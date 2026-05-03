"""
Конфигурации Tolstoy AI Studio v5.0
Включает поддержку GQA, Sparse MoE, Weight Tying и динамический подсчет параметров (M/B).
"""
import os
import yaml
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any


@dataclass
class ModelConfig:
    """Конфигурация архитектуры модели Tolstoy v5"""
    n_embd: int = 256
    n_head: int = 8
    n_layer: int = 8
    block_size: int = 512
    vocab_size: int = 2000  # Увеличено для BPE RU
    num_experts: int = 8
    top_k_experts: int = 2
    n_kv_head: Optional[int] = 2  # GQA по умолчанию 4:1 (8 голов / 2 KV головы)
    num_shared_experts: int = 1
    weight_tying: bool = True     # Экономия ~20% параметров
    rope_scaling: Optional[float] = None

    @property
    def estimated_parameters(self) -> int:
        """
        Динамический расчет количества параметров модели (в штуках).
        Учитывает Weight Tying, GQA (n_kv_head) и MoE экспертов.
        """
        # Эмбеддинги
        emb_params = self.vocab_size * self.n_embd
        
        # Настройки голов
        head_dim = self.n_embd // self.n_head
        kv_heads = self.n_kv_head if self.n_kv_head is not None else self.n_head
        
        # Внимание (Q, K, V, O проекции + QK-Norm)
        q_params = self.n_embd * (self.n_head * head_dim)
        k_params = self.n_embd * (kv_heads * head_dim)
        v_params = self.n_embd * (kv_heads * head_dim)
        o_params = (self.n_head * head_dim) * self.n_embd
        qk_norm_params = 2 * head_dim # RMSNorm для Q и K
        attn_params = q_params + k_params + v_params + o_params + qk_norm_params
        
        # Sparse MoE (SwiGLU эксперты + Роутер)
        hidden_dim = int(8 * self.n_embd / 3)
        hidden_dim = 256 * ((hidden_dim + 255) // 256) # Выравнивание по блокам
        expert_params = 3 * (self.n_embd * hidden_dim) # w1, w2, w3 в SwiGLU
        
        router_params = self.n_embd * self.num_experts
        total_experts = self.num_experts + self.num_shared_experts
        ffn_params = router_params + (total_experts * expert_params)
        
        # Нормализации (attention_norm, ffn_norm)
        layer_norm_params = 2 * self.n_embd
        
        # Всего параметров в 1 слое
        layer_total = attn_params + ffn_params + layer_norm_params
        
        # Финальный RMSNorm
        final_norm = self.n_embd
        
        # Выходной слой
        output_params = 0 if self.weight_tying else (self.vocab_size * self.n_embd)
        
        return emb_params + (self.n_layer * layer_total) + final_norm + output_params

    @property
    def formatted_params(self) -> str:
        """Автоматический перевод в миллионы (M) или миллиарды (B)"""
        params = self.estimated_parameters
        if params >= 1_000_000_000:
            return f"{params / 1_000_000_000:.2f}B"
        return f"{params / 1_000_000:.1f}M"


@dataclass
class TrainingConfig:
    """Конфигурация процесса обучения"""
    max_iters: int = 5000
    learning_rate: float = 3e-4
    batch_size: int = 16
    eval_interval: int = 100
    eval_iters: int = 20
    early_stopping_patience: int = 500
    early_stopping_min_delta: float = 1e-4
    checkpoint_interval: int = 500
    
    finetune: bool = False
    finetune_lr: float = 5e-5
    
    grad_accum_steps: int = 4
    moe_loss_coef: float = 0.1
    warmup_steps: int = 100
    use_scheduler: bool = True
    max_grad_norm: float = 1.0


@dataclass
class DeviceConfig:
    """Конфигурация аппаратного обеспечения"""
    device: str = 'cpu'
    use_amp: bool = True
    compile_model: bool = False


class Config:
    """Основной сборщик конфигурации"""
    
    def __init__(
        self,
        model: Optional[ModelConfig] = None,
        training: Optional[TrainingConfig] = None,
        device: Optional[DeviceConfig] = None
    ):
        self.model = model or ModelConfig()
        self.training = training or TrainingConfig()
        self.device = device or DeviceConfig()
    
    @classmethod
    def from_yaml(cls, filepath: str) -> 'Config':
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        model = ModelConfig(**data.get('model', {}))
        training = TrainingConfig(**data.get('training', {}))
        device = DeviceConfig(**data.get('device', {}))
        
        return cls(model=model, training=training, device=device)
    
    def to_yaml(self, filepath: str):
        with open(filepath, 'w', encoding='utf-8') as f:
            yaml.dump(self.to_dict(), f, default_flow_style=False, allow_unicode=True)
    
    def to_dict(self) -> Dict[str, Any]:
        model_dict = asdict(self.model)
        model_dict['estimated_parameters'] = self.model.estimated_parameters
        model_dict['formatted_params'] = self.model.formatted_params
        
        return {
            'model': model_dict,
            'training': asdict(self.training),
            'device': asdict(self.device)
        }


# ==========================================
# ПРЕСЕТЫ ПОД РАЗНЫЕ ЗАДАЧИ И ЖЕЛЕЗО
# ==========================================
PRESETS = {
    "micro": Config(
        model=ModelConfig(
            n_embd=64, n_head=2, n_kv_head=1, n_layer=2, 
            block_size=128, num_experts=4, num_shared_experts=0
        ),
        training=TrainingConfig(max_iters=500, batch_size=8, grad_accum_steps=1)
    ),
    "nano": Config(
        model=ModelConfig(
            n_embd=128, n_head=4, n_kv_head=1, n_layer=4, 
            block_size=128, num_experts=4, num_shared_experts=0
        ),
        training=TrainingConfig(max_iters=1500, batch_size=8, grad_accum_steps=1)
    ),
    "mini": Config(
        model=ModelConfig(
            n_embd=256, n_head=8, n_kv_head=2, n_layer=6, 
            block_size=256, num_experts=8, num_shared_experts=1
        ),
        training=TrainingConfig(max_iters=5000, batch_size=16, grad_accum_steps=2)
    ),
    "small": Config(
        model=ModelConfig(
            n_embd=512, n_head=8, n_kv_head=2, n_layer=8, 
            block_size=512, num_experts=8, num_shared_experts=1
        ),
        training=TrainingConfig(max_iters=10000, batch_size=16, grad_accum_steps=4)
    ),
    "medium": Config(
        model=ModelConfig(
            n_embd=1024, n_head=16, n_kv_head=4, n_layer=12, 
            block_size=1024, num_experts=8, num_shared_experts=2
        ),
        training=TrainingConfig(max_iters=20000, batch_size=8, grad_accum_steps=8)
    ),
    "large": Config(
        model=ModelConfig(
            n_embd=2048, n_head=32, n_kv_head=8, n_layer=24, 
            block_size=2048, num_experts=8, num_shared_experts=2
        ),
        training=TrainingConfig(max_iters=50000, batch_size=4, grad_accum_steps=16)
    ),
    "xlarge": Config(
        model=ModelConfig(
            n_embd=4096, n_head=32, n_kv_head=8, n_layer=32, 
            block_size=4096, num_experts=8, num_shared_experts=2
        ),
        training=TrainingConfig(max_iters=100000, batch_size=2, grad_accum_steps=32)
    ),
    "titan": Config(
        model=ModelConfig(
            n_embd=8192, n_head=64, n_kv_head=8, n_layer=64, 
            block_size=8192, num_experts=8, num_shared_experts=4
        ),
        training=TrainingConfig(max_iters=250000, batch_size=1, grad_accum_steps=128)
    )
}

DEFAULT_CONFIGS = PRESETS  # Алиас для обратной совместимости


def get_preset(name: str) -> Config:
    if name not in PRESETS:
        raise ValueError(f"Неизвестный пресет: {name}. Доступные: {list(PRESETS.keys())}")
    
    preset = PRESETS[name]
    print(f"[SYS] Загружен пресет '{name}' (~{preset.model.formatted_params} параметров)")
    return preset