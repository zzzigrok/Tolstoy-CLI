import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))
    def forward(self, x):
        norm = x.pow(2).mean(-1, keepdim=True)
        return x * torch.rsqrt(norm + self.eps) * self.weight

def precompute_freqs_cis(dim, end=2048, theta=10000.0, rope_scaling=None, yarn_beta=32, yarn_alpha=1.0, device='cpu'):
    if rope_scaling is not None and rope_scaling > 1.0:
        theta = theta * (rope_scaling ** (dim / (dim - 2)))
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2, device=device)[: (dim // 2)].float() / dim))
    t = torch.arange(end, device=device)
    if rope_scaling is not None and rope_scaling > 1.0:
        low_freq_mask = torch.arange(0, dim // 2, device=device) < (dim // 2 * 0.5)
        freqs = torch.where(low_freq_mask, freqs, freqs / rope_scaling)
    freqs = torch.outer(t, freqs).float()
    return torch.polar(torch.ones_like(freqs), freqs)

def apply_rotary_emb(xq, xk, freqs_cis):
    xq_ = torch.view_as_complex(xq.float().reshape(*xq.shape[:-1], -1, 2))
    xk_ = torch.view_as_complex(xk.float().reshape(*xk.shape[:-1], -1, 2))
    freqs_cis = freqs_cis.view(1, xq_.shape[1], 1, xq_.shape[-1])
    xq_out = torch.view_as_real(xq_ * freqs_cis).flatten(3)
    xk_out = torch.view_as_real(xk_ * freqs_cis).flatten(3)
    return xq_out.type_as(xq), xk_out.type_as(xk)

class XQuantCache:
    def __init__(self, mode='int8kv', max_seq_len=8192, n_layers=1):
        self.mode = mode
        self.max_seq_len = max_seq_len
        self._kv_storage = {}

    def init_buffers(self, batch_size, n_kv_head, head_dim, n_layers, device, dtype):
        self.batch_size = batch_size
        self.n_kv_head = n_kv_head
        self.head_dim = head_dim
        
        # [ИСПРАВЛЕНО] XQuant теперь корректно использует INT8 KV кэш, избегая O(T^2) рематериализации
        for i in range(n_layers):
            k_cache = torch.zeros(batch_size, self.max_seq_len, n_kv_head, head_dim, device=device, dtype=torch.int8)
            v_cache = torch.zeros(batch_size, self.max_seq_len, n_kv_head, head_dim, device=device, dtype=torch.int8)
            k_scales = torch.ones(batch_size, self.max_seq_len, n_kv_head, 1, device=device, dtype=dtype)
            v_scales = torch.ones(batch_size, self.max_seq_len, n_kv_head, 1, device=device, dtype=dtype)
            self._kv_storage[i] = (k_cache, v_cache, k_scales, v_scales)
        return [(None, None, 0) for _ in range(n_layers)]

    def quantize_tensor(self, t, per_channel=False):
        t_max = t.abs().amax(dim=-1, keepdim=True).clamp_min_(1e-5)
        scale = t_max / 127.0
        t_q = (t / scale).round().clamp(-128, 127).to(torch.int8)
        return t_q, scale

    def dequantize_tensor(self, t_q, scale):
        return t_q.to(scale.dtype) * scale

    def update(self, layer_idx, start_pos, T, k, v, x_norm=None, wk=None, wv=None):
        k_cache, v_cache, k_scales, v_scales = self._kv_storage[layer_idx]
        
        if self.mode == 'xquant' and x_norm is not None:
            # Вычисляем только НОВЫЕ токены, избегая O(T^2)
            k = (x_norm @ wk.T).view(self.batch_size, T, self.n_kv_head, self.head_dim)
            v = (x_norm @ wv.T).view(self.batch_size, T, self.n_kv_head, self.head_dim)

        k_q, k_s = self.quantize_tensor(k, per_channel=True)
        v_q, v_s = self.quantize_tensor(v, per_channel=False)
        k_cache[:, start_pos:start_pos + T, :, :] = k_q
        v_cache[:, start_pos:start_pos + T, :, :] = v_q
        k_scales[:, start_pos:start_pos + T, :, :] = k_s
        v_scales[:, start_pos:start_pos + T, :, :] = v_s
        
        # Деквантуем весь кэш до текущей позиции для Attention
        k_full = self.dequantize_tensor(k_cache[:, :start_pos + T, :, :], k_scales[:, :start_pos + T, :, :])
        v_full = self.dequantize_tensor(v_cache[:, :start_pos + T, :, :], v_scales[:, :start_pos + T, :, :])
        return k_full, v_full

class MultiheadSelfAttention(nn.Module):
    # [__init__ без изменений]
    def __init__(self, n_embd, n_head, n_kv_head=None, use_xquant=False):
        super().__init__()
        self.n_head = n_head
        self.n_kv_head = n_kv_head if n_kv_head is not None else max(1, n_head // 4)
        self.n_rep = self.n_head // self.n_kv_head
        self.head_dim = n_embd // n_head
        self.use_xquant = use_xquant
        self.wq = nn.Linear(n_embd, self.n_head * self.head_dim, bias=False)
        self.wk = nn.Linear(n_embd, self.n_kv_head * self.head_dim, bias=False)
        self.wv = nn.Linear(n_embd, self.n_kv_head * self.head_dim, bias=False)
        self.wo = nn.Linear(self.n_head * self.head_dim, n_embd, bias=False)
        self.q_norm = RMSNorm(self.head_dim)
        self.k_norm = RMSNorm(self.head_dim)
        self.xquant_cache = None

    def forward(self, x, freqs_cis, past_key_value=None, use_cache=False, x_norm_input=None, layer_idx=0):
        B, T, C = x.shape
        q = self.wq(x).view(B, T, self.n_head, self.head_dim)
        k = self.wk(x).view(B, T, self.n_kv_head, self.head_dim)
        v = self.wv(x).view(B, T, self.n_kv_head, self.head_dim)

        q, k = self.q_norm(q), self.k_norm(k)
        q, k = apply_rotary_emb(q, k, freqs_cis)

        if past_key_value is not None and use_cache:
            start_pos = past_key_value[2] if isinstance(past_key_value, tuple) else 0
            if self.xquant_cache is not None and self.xquant_cache.mode != 'full':
                k, v = self.xquant_cache.update(layer_idx, start_pos, T, k, v, x_norm=x_norm_input, wk=self.wk.weight, wv=self.wv.weight)
                past_kv = (None, None, start_pos + T)
            else:
                k_cache, v_cache, _ = past_key_value
                k_cache[:, start_pos:start_pos + T, :, :] = k
                v_cache[:, start_pos:start_pos + T, :, :] = v
                k, v = k_cache[:, :start_pos + T, :, :], v_cache[:, :start_pos + T, :, :]
                past_kv = (k_cache, v_cache, start_pos + T)
        else:
            past_kv = (k, v) if use_cache else None

        q, k, v = q.transpose(1, 2), k.transpose(1, 2), v.transpose(1, 2)
        is_causal = (past_key_value is None) and (T > 1)
        
        try:
            y = F.scaled_dot_product_attention(q, k, v, is_causal=is_causal, enable_gqa=(self.n_rep > 1))
        except TypeError:
            if self.n_rep > 1:
                k = k.repeat_interleave(self.n_rep, dim=1)
                v = v.repeat_interleave(self.n_rep, dim=1)
            y = F.scaled_dot_product_attention(q, k, v, is_causal=is_causal)

        y = y.transpose(1, 2).contiguous().view(B, T, C)
        return self.wo(y), past_kv

class FeedForward(nn.Module):
    def __init__(self, dim, use_fused_silu=True):
        super().__init__()
        hidden_dim = int(8 * dim / 3)
        hidden_dim = 256 * ((hidden_dim + 255) // 256)
        self.gate_up_proj = nn.Linear(dim, 2 * hidden_dim, bias=False)
        self.w2 = nn.Linear(hidden_dim, dim, bias=False)

    def forward(self, x):
        gate, up = self.gate_up_proj(x).chunk(2, dim=-1)
        return self.w2(F.silu(gate, inplace=False) * up)

class SparseMoE(nn.Module):
    def __init__(self, dim, num_experts=8, top_k=2, num_shared_experts=0, use_expert_choice=False, capacity_factor=1.25):
        super().__init__()
        self.num_experts = num_experts
        self.top_k = top_k
        self.use_expert_choice = use_expert_choice
        self.capacity_factor = capacity_factor
        self.router = nn.Linear(dim, num_experts, bias=False)
        self.experts = nn.ModuleList([FeedForward(dim) for _ in range(num_experts)])
        self.shared_experts = nn.ModuleList([FeedForward(dim) for _ in range(num_shared_experts)]) if num_shared_experts > 0 else None

    def forward(self, x):
        B, T, C = x.shape
        x_flat = x.view(-1, C)
        router_logits = self.router(x_flat)
        output = torch.zeros_like(x_flat)
        
        routing_weights = F.softmax(router_logits, dim=-1)
        topk_weights, topk_indices = torch.topk(routing_weights, self.top_k, dim=-1)
        topk_weights = topk_weights / topk_weights.sum(dim=-1, keepdim=True)

        # [ИСПРАВЛЕНО] Оптимизированный цикл экспертов (исключает перебор всех токенов)
        # Формируем плотные маски для батчинга по экспертам
        for e_idx, expert in enumerate(self.experts):
            expert_mask = (topk_indices == e_idx)
            if not expert_mask.any(): continue
            
            token_indices = expert_mask.any(dim=1)
            tokens_for_expert = x_flat[token_indices]
            expert_out = expert(tokens_for_expert)
            
            weights_for_expert = torch.zeros(token_indices.sum(), device=x.device, dtype=x.dtype)
            for k in range(self.top_k):
                mask_k = topk_indices[token_indices, k] == e_idx
                weights_for_expert[mask_k] = topk_weights[token_indices, k][mask_k]
                
            output[token_indices] += expert_out * weights_for_expert.unsqueeze(-1)

        load_balancing_loss = self.num_experts * torch.sum(routing_weights.mean(dim=0) * (F.one_hot(topk_indices[:, 0], self.num_experts).float().mean(dim=0))) if self.training else 0.0

        if self.shared_experts is not None:
            for se in self.shared_experts: output += se(x_flat)
        return output.view(B, T, C), load_balancing_loss

class SpeculativeHead(nn.Module):
    def __init__(self, n_embd, vocab_size, num_stages=3):
        super().__init__()
        self.num_stages = num_stages
        self.heads = nn.ModuleList([nn.Sequential(RMSNorm(n_embd), nn.Linear(n_embd, n_embd), nn.GELU(), nn.Linear(n_embd, vocab_size)) for _ in range(num_stages)])
        self.transitions = nn.ModuleList([nn.Linear(n_embd, n_embd) for _ in range(num_stages - 1)])

class Block(nn.Module):
    def __init__(self, n_embd, n_head, n_kv_head=None, num_experts=8, num_shared_experts=0, use_expert_choice=False, use_xquant=False):
        super().__init__()
        self.attention = MultiheadSelfAttention(n_embd, n_head, n_kv_head, use_xquant=use_xquant)
        self.feed_forward = SparseMoE(n_embd, num_experts=num_experts, num_shared_experts=num_shared_experts, use_expert_choice=use_expert_choice)
        self.attention_norm = RMSNorm(n_embd)
        self.ffn_norm = RMSNorm(n_embd)

    def forward(self, x, freqs_cis, past_key_value=None, use_cache=False, layer_idx=0, x_norm_for_xquant=None):
        h, past_kv = self.attention(self.attention_norm(x), freqs_cis, past_key_value=past_key_value, use_cache=use_cache, x_norm_input=x_norm_for_xquant, layer_idx=layer_idx)
        x = x + h
        ffw_out, aux_loss = self.feed_forward(self.ffn_norm(x))
        return x + ffw_out, past_kv, aux_loss