import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from .layers import RMSNorm, precompute_freqs_cis, Block, SpeculativeHead, XQuantCache
from utils.device import clear_memory

class TolstoyLLM_v5(nn.Module):
    # [__init__ и configure_optimizers без изменений]
    def __init__(self, vocab_size, n_embd, n_head, n_layer, block_size,
                 n_kv_head=None, num_experts=8, num_shared_experts=0,
                 use_expert_choice=False, rope_scaling=None,
                 kv_cache_mode='int8kv', use_speculative=False, num_speculative_stages=3,
                 compile_regions=False):
        super().__init__()
        self.vocab_size = vocab_size
        self.n_embd = n_embd
        self.block_size = block_size
        padded_vocab_size = (vocab_size + 63) // 64 * 64
        self.tok_embeddings = nn.Embedding(padded_vocab_size, n_embd)
        self.layers = nn.ModuleList([
            Block(n_embd, n_head, n_kv_head, num_experts, num_shared_experts,
                  use_expert_choice=use_expert_choice,
                  use_xquant=(kv_cache_mode in ('xquant', 'int8kv')))
            for _ in range(n_layer)
        ])
        self.norm = RMSNorm(n_embd)
        self.output = nn.Linear(n_embd, padded_vocab_size, bias=False)
        self.output.weight = self.tok_embeddings.weight

        head_dim = n_embd // n_head
        self.freqs_cis = precompute_freqs_cis(head_dim, block_size * 2, rope_scaling=rope_scaling, device='cpu')
        self.register_buffer("freqs_cis_buffer", self.freqs_cis)

        self.gradient_checkpointing = True
        self.kv_cache_mode = kv_cache_mode
        self.use_speculative = use_speculative
        self.compile_regions = compile_regions

        self.xquant_cache = None
        if kv_cache_mode in ('xquant', 'int8kv'):
            self.xquant_cache = XQuantCache(mode=kv_cache_mode, max_seq_len=block_size * 2, n_layers=n_layer)

        self.speculative_head = None
        if use_speculative:
            self.speculative_head = SpeculativeHead(n_embd, padded_vocab_size, num_stages=num_speculative_stages)

    def forward(self, idx, targets=None, past_key_values=None, use_cache=False, return_hiddens=False):
        B, T = idx.shape
        start_pos = 0
        if past_key_values is not None and len(past_key_values) > 0:
            start_pos = past_key_values[0][2] if isinstance(past_key_values[0], tuple) else 0

        freqs_cis = self.freqs_cis_buffer[start_pos: start_pos + T].to(idx.device)
        x = self.tok_embeddings(idx)
        total_aux_loss = 0.0
        next_kvs = []

        if use_cache and self.xquant_cache is not None and len(self.xquant_cache._kv_storage) == 0:
            layer0 = self.layers[0]
            n_kv = layer0.attention.n_kv_head
            hd = layer0.attention.head_dim
            dtype = next(self.parameters()).dtype
            self.xquant_cache.init_buffers(B, n_kv, hd, len(self.layers), idx.device, dtype)
            for layer in self.layers: layer.attention.xquant_cache = self.xquant_cache

        for i, layer in enumerate(self.layers):
            pkv = past_key_values[i] if past_key_values is not None else None

            if self.gradient_checkpointing and self.training and targets is not None and not use_cache:
                # [ИСПРАВЛЕНО] Вычисление attention_norm помещено внутрь чекпоинта
                def custom_forward(x_in, freqs_cis_in, pkv_in, layer_idx):
                    x_norm_in = self.layers[layer_idx].attention_norm(x_in) if self.xquant_cache else None
                    return self.layers[layer_idx](x_in, freqs_cis_in, pkv_in, use_cache=False, layer_idx=layer_idx, x_norm_for_xquant=x_norm_in)
                
                h, kv, aux_loss = torch.utils.checkpoint.checkpoint(custom_forward, x, freqs_cis, pkv, i, use_reentrant=False)
                x = x + h
            else:
                x_norm = self.layers[i].attention_norm(x) if self.xquant_cache else None
                x, kv, aux_loss = layer(x, freqs_cis, pkv, use_cache, layer_idx=i, x_norm_for_xquant=x_norm)

            total_aux_loss = total_aux_loss + aux_loss
            if use_cache: next_kvs.append(kv)

        x_final = self.norm(x)
        logits = self.output(x_final)
        
        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits[:, :, :self.vocab_size].contiguous().view(-1, self.vocab_size), targets.view(-1), ignore_index=-1)
            
        ret = (logits[:, :, :self.vocab_size], loss, total_aux_loss)
        if return_hiddens: ret += (x_final,)
        if use_cache: ret += (next_kvs,)
        return ret

    @torch.inference_mode()
    def generate(self, idx, max_new_tokens, temperature=1.0, top_p=0.9, repetition_penalty=1.15, use_speculative=False):
        self.eval()
        B, T = idx.shape
        max_seq_len = T + max_new_tokens
        device = idx.device
        dtype = next(self.parameters()).dtype
        out_idx = torch.empty((B, max_seq_len), dtype=torch.long, device=device)
        out_idx[:, :T] = idx

        past_key_values = []
        for layer in self.layers:
            raw_layer = layer._orig_mod if hasattr(layer, "_orig_mod") else layer
            n_kv_head = raw_layer.attention.n_kv_head
            head_dim = raw_layer.attention.head_dim
            if self.xquant_cache is not None and self.xquant_cache.mode != 'full':
                past_key_values.append((None, None, 0))
            else:
                past_key_values.append((torch.zeros(B, max_seq_len, n_kv_head, head_dim, device=device, dtype=dtype),
                                        torch.zeros(B, max_seq_len, n_kv_head, head_dim, device=device, dtype=dtype), 0))

        if self.xquant_cache is not None:
            self.xquant_cache.init_buffers(B, n_kv_head, head_dim, len(self.layers), device, dtype)
            for layer in self.layers: layer.attention.xquant_cache = self.xquant_cache

        current_pos = T
        accepted_drafts = 0

        if use_speculative and self.speculative_head is not None and B == 1:
            while current_pos < max_seq_len:
                draft_len = min(self.speculative_head.num_stages, max_seq_len - current_pos)
                with torch.no_grad():
                    # [ИСПРАВЛЕНО] Получаем правильный contextualized hidden state (h) вместо сырого эмбеддинга
                    out = self.forward(out_idx[:, :current_pos], past_key_values=past_key_values, use_cache=True, return_hiddens=True)
                    logits_draft, _, _, h, past_key_values = out
                    h_last = h[:, -1:] # Берём только скрытое состояние последнего токена

                    draft_tokens = []
                    h_draft = h_last
                    for stage in range(draft_len):
                        logits_s = self.speculative_head.heads[stage](h_draft).squeeze(1)
                        tok = torch.argmax(logits_s[:, :self.vocab_size], dim=-1, keepdim=True)
                        draft_tokens.append(tok)
                        if stage < len(self.speculative_head.transitions):
                            h_draft = h_draft + self.speculative_head.transitions[stage](h_draft)

                candidate = torch.cat([out_idx[:, :current_pos], torch.cat(draft_tokens, dim=1)], dim=1)
                
                # Верифицируем весь черновик за 1 проход
                out_verify = self.forward(candidate[:, current_pos - 1:current_pos + draft_len], past_key_values=past_key_values, use_cache=True)
                logits_verify, _, _, new_past = out_verify

                accepted = 0
                for j, draft_tok in enumerate(draft_tokens):
                    pos = current_pos + j
                    if pos >= max_seq_len: break
                    verify_tok = torch.argmax(logits_verify[:, j, :self.vocab_size], dim=-1)
                    if verify_tok.item() == draft_tok.item():
                        out_idx[:, pos] = draft_tok
                        accepted += 1
                        accepted_drafts += 1
                    else:
                        out_idx[:, pos] = verify_tok
                        accepted += 1
                        break

                # [ИСПРАВЛЕНО] Откат (Rollback) счетчика кэша, чтобы отвергнутые токены перезаписались
                for layer_idx in range(len(new_past)):
                    k_cache, v_cache, _ = new_past[layer_idx]
                    new_past[layer_idx] = (k_cache, v_cache, current_pos + accepted)
                
                current_pos += accepted
                past_key_values = new_past

        else:
            # Стандартная авторегрессия
            for _ in range(max_new_tokens):
                if current_pos >= max_seq_len: break
                idx_cond = out_idx[:, current_pos - 1:current_pos] if (past_key_values[0][2] > 0 if isinstance(past_key_values[0], tuple) else False) else out_idx[:, :current_pos]

                out = self.forward(idx_cond, past_key_values=past_key_values, use_cache=True)
                logits, _, _, past_key_values = out
                logits = logits[:, -1, :]

                if repetition_penalty > 1.0:
                    prev_tokens = out_idx[:, :current_pos]
                    for b_idx in range(B):
                        unique_tokens = torch.unique(prev_tokens[b_idx])
                        if unique_tokens.numel() == 0: continue
                        vals = logits[b_idx, unique_tokens]
                        pos_mask = vals > 0
                        neg_mask = ~pos_mask
                        if pos_mask.any(): logits[b_idx, unique_tokens[pos_mask]] /= repetition_penalty
                        if neg_mask.any(): logits[b_idx, unique_tokens[neg_mask]] *= repetition_penalty

                logits = logits / temperature
                if top_p is not None and top_p < 1.0:
                    sorted_logits, sorted_indices = torch.sort(logits, descending=True)
                    cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                    sorted_indices_to_remove = cumulative_probs > top_p
                    sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                    sorted_indices_to_remove[..., 0] = 0
                    indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                    logits[indices_to_remove] = -float('Inf')

                probs = F.softmax(logits, dim=-1)
                out_idx[:, current_pos:current_pos + 1] = torch.multinomial(probs, num_samples=1)
                current_pos += 1

        clear_memory(device)
        return out_idx