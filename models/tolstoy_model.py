import torch
import torch.nn as nn
import torch.nn.functional as F
from models.layers import RMSNorm, precompute_freqs_cis, Block
from utils.device import clear_memory

class TolstoyLLM_v5(nn.Module):
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
        self.layers = nn.ModuleList([Block(n_embd, n_head, n_kv_head, num_experts, num_shared_experts) for _ in range(n_layer)])
        self.norm = RMSNorm(n_embd)
        self.output = nn.Linear(n_embd, padded_vocab_size, bias=False)
        self.output.weight = self.tok_embeddings.weight
        self.freqs_cis_buffer = precompute_freqs_cis(n_embd // n_head, block_size * 2, rope_scaling=rope_scaling)
        self.gradient_checkpointing = True

        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def configure_optimizers(self, weight_decay, learning_rate, betas, device_type):
        # named_parameters() дедуплицирует weight-tied параметры автоматически
        param_dict = {pn: p for pn, p in self.named_parameters()}
        decay, no_decay = set(), set()

        for pn, p in param_dict.items():
            if p.dim() < 2 or pn.endswith('.bias') or 'norm' in pn or 'embedding' in pn:
                no_decay.add(pn)
            else:
                decay.add(pn)

        optim_groups = [
            {"params": [param_dict[pn] for pn in sorted(decay)], "weight_decay": weight_decay},
            {"params": [param_dict[pn] for pn in sorted(no_decay)], "weight_decay": 0.0}
        ]

        use_fused = (device_type == 'cuda')
        return torch.optim.AdamW(optim_groups, lr=learning_rate, betas=betas, fused=use_fused)

    def forward(self, idx, targets=None, past_key_values=None, use_cache=False, return_hiddens=False):
        B, T = idx.shape
        start_pos = past_key_values[0][2] if (past_key_values and len(past_key_values[0]) > 2) else 0
        freqs_cis = self.freqs_cis_buffer[start_pos: start_pos + T].to(idx.device)
        x = self.tok_embeddings(idx)
        total_aux_loss = 0.0
        next_kvs = []

        for i, layer in enumerate(self.layers):
            pkv = past_key_values[i] if past_key_values else None
            x, kv, aux_loss = layer(x, freqs_cis, pkv, use_cache, layer_idx=i)
            if use_cache: next_kvs.append(kv)
            total_aux_loss += aux_loss

        x_final = self.norm(x)
        logits = self.output(x_final)[:, :, :self.vocab_size]
        loss = F.cross_entropy(logits.contiguous().view(-1, self.vocab_size), targets.view(-1), ignore_index=-1) if targets is not None else None
        
        ret = (logits, loss, total_aux_loss)
        if return_hiddens: ret += (x_final,)
        if use_cache: ret += (next_kvs,)
        return ret

    @torch.inference_mode()
    def generate(self, idx, max_new_tokens, temperature=1.0, top_p=0.9, repetition_penalty=1.15, use_speculative=False):
        self.eval()
        B, T = idx.shape
        device = idx.device
        out_idx = torch.empty((B, T + max_new_tokens), dtype=torch.long, device=device)
        out_idx[:, :T] = idx

# Определяем правильный тип данных (float32 или float16 в зависимости от устройства)
        model_dtype = next(self.parameters()).dtype
        
        past_key_values = [(torch.zeros(B, T + max_new_tokens, l.attention.n_kv_head, l.attention.head_dim, device=device, dtype=model_dtype),
                            torch.zeros(B, T + max_new_tokens, l.attention.n_kv_head, l.attention.head_dim, device=device, dtype=model_dtype), 0)
                           for l in self.layers]

        current_pos = T

        # ИСПРАВЛЕНИЕ: Корректная Speculative Decoding логика без перезаписи кэша
        for _ in range(max_new_tokens):
            if current_pos >= T + max_new_tokens: break
            
            idx_cond = out_idx[:, current_pos - 1:current_pos] if current_pos > T else out_idx[:, :current_pos]
            logits, _, _, past_key_values = self.forward(idx_cond, past_key_values=past_key_values, use_cache=True)
            logits = logits[:, -1, :]

            if repetition_penalty != 1.0:
                for b_idx in range(B):
                    unique_tokens = torch.unique(out_idx[b_idx, :current_pos])
                    logits[b_idx, unique_tokens] /= torch.where(logits[b_idx, unique_tokens] > 0, repetition_penalty, 1/repetition_penalty)

            probs = F.softmax(logits / temperature, dim=-1)
            out_idx[:, current_pos:current_pos + 1] = torch.multinomial(probs, num_samples=1)
            current_pos += 1

        clear_memory(device)
        return out_idx[:, :current_pos]