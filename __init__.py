"""
Tolstoy AI Studio v8 — Радикально оптимизированная генеративная модель

Оптимизации:
- BPE Tokenizer v10: LinkedArray + Trie O(n) encode
- TolstoyLLM v5: XQuant KV-cache + Speculative Decoding + GaLore + Muon
- Training: GaLore optimizer + 8-bit AdamW + OneCycleLR + Hybrid Muon/AdamW
- Inference: torch.compile + FlashAttention + INT8 quantization
"""
__version__ = "8.0.0"

from models.tolstoy_model import TolstoyLLM_v5
from training.trainer import Trainer, TrainingConfig