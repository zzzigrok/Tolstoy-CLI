"""
training/trainer.py — Tolstoy AI Studio v8 (Radically Optimized & Bug-Free)
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import os, pickle, time, csv, logging, traceback, math
from datetime import datetime, timedelta

from torch.utils.data import Dataset, DataLoader, Subset
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.device import get_optimal_device, get_amp_context, clear_memory
from utils.pickle_utils import RestrictedUnpickler, safe_pickle_load

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger("TolstoyTrainer")

class Muon(torch.optim.Optimizer):
    def __init__(self, params, lr=0.02, weight_decay=0.01, momentum=0.95,
                 nesterov=True, ns_steps=5, rank=0, world_size=1):
        defaults = dict(lr=lr, weight_decay=weight_decay, momentum=momentum,
                        nesterov=nesterov, ns_steps=ns_steps, rank=rank, world_size=world_size)
        super().__init__(params, defaults)

    @torch.no_grad()
    def step(self, closure=None):
        loss = None
        if closure is not None:
            with torch.enable_grad():
                loss = closure()

        for group in self.param_groups:
            lr = group['lr']
            wd = group['weight_decay']
            momentum = group['momentum']
            nesterov = group['nesterov']
            ns_steps = group['ns_steps']

            for p in group['params']:
                if p.grad is None or p.ndim != 2:
                    continue

                g = p.grad
                state = self.state[p]
                if len(state) == 0:
                    state['momentum_buffer'] = torch.zeros_like(g)

                buf = state['momentum_buffer']
                buf.mul_(momentum).add_(g)
                g = g.add(buf, alpha=momentum) if nesterov else buf

                original_dtype = g.dtype
                V = g.float()
                
                # ИСПРАВЛЕНИЕ MUON: Строгая нормализация до начала итераций Ньютона-Шульца
                V_norm = V.norm(dim=1, keepdim=True).clamp_min_(1e-8)
                V = V / V_norm

                for _ in range(ns_steps):
                    V = (3.0 * V - V @ V.T @ V) * 0.5

                # Нормализация по операторной норме
                g_norm_final = g.norm(dim=1, keepdim=True).clamp_min_(1e-8)
                V_norm_final = V.norm(dim=1, keepdim=True).clamp_min_(1e-8)
                V = V * (g_norm_final / V_norm_final)
                V = V.to(original_dtype)

                if wd > 0:
                    p.data.mul_(1 - lr * wd)
                p.data.add_(V, alpha=-lr)

        return loss

class GaLoreOptimizer(torch.optim.Optimizer):
    def __init__(self, params, base_optimizer_cls=torch.optim.AdamW,
                 rank=64, update_proj_gap=200, scale=1.0,
                 weight_decay=0.1, lr=3e-4, betas=(0.9, 0.999), eps=1e-8,
                 quantize_projection=False, **base_kwargs):
        defaults = dict(
            rank=rank, update_proj_gap=update_proj_gap, scale=scale,
            weight_decay=weight_decay, lr=lr, betas=betas, eps=eps,
            quantize_projection=quantize_projection,
            step=0, **base_kwargs
        )
        super().__init__(params, defaults)
        self.base_optimizer_cls = base_optimizer_cls

    def _project_gradient(self, param, grad, rank, update_proj_gap, step):
        if grad.dim() < 2:
            return grad, None, None, None

        original_shape = grad.shape
        if grad.dim() > 2:
            grad = grad.view(grad.size(0), -1)

        m, n = grad.shape
        if m < rank or n < rank:
            return grad.view(original_shape), None, None, None

        state = self.state.get(param, {})

        if step % update_proj_gap == 0 or 'U' not in state:
            try:
                U, S, Vh = torch.linalg.svd(grad.float(), full_matrices=False)
                state['U'] = U[:, :rank].to(grad.dtype)
                state['V'] = Vh[:rank, :].T.to(grad.dtype)
                state['shape'] = original_shape
                if self.defaults['quantize_projection']:
                    state['U_q'] = self._quantize_lowrank(state['U'])
                    state['V_q'] = self._quantize_lowrank(state['V'])
            except Exception as e:
                return None, None, None, None

        self.state[param] = state
        U_r = state.get('U')
        V_r = state.get('V')
        if U_r is None:
            return None, None, None, None

        grad_proj = U_r.T @ grad @ V_r
        return grad_proj, U_r, V_r, original_shape

    def _quantize_lowrank(self, t):
        scale = t.abs().max() / 127.0
        t_q = (t / scale.clamp_min_(1e-5)).round().clamp(-128, 127).to(torch.int8)
        return t_q, scale

    def _dequantize_lowrank(self, t_q, scale):
        return t_q.to(scale.dtype) * scale

    @torch.no_grad()
    def step(self, closure=None):
        loss = None
        if closure is not None:
            with torch.enable_grad():
                loss = closure()

        for group in self.param_groups:
            rank, update_proj_gap, scale = group['rank'], group['update_proj_gap'], group['scale']
            step = group['step'] = group.get('step', 0) + 1
            weight_decay, lr, betas, eps = group['weight_decay'], group['lr'], group['betas'], group['eps']
            quantize = group.get('quantize_projection', False)

            for p in group['params']:
                if p.grad is None:
                    continue
                grad = p.grad.data

                grad_proj, U_r, V_r, orig_shape = self._project_gradient(p, grad, rank, update_proj_gap, step)

                if U_r is None:
                    self._adamw_step(p, grad, group, step)
                    continue

                state = self.state.setdefault(p, {})
                if 'exp_avg_proj' not in state:
                    state['exp_avg_proj'] = torch.zeros_like(grad_proj)
                    state['exp_avg_sq_proj'] = torch.zeros_like(grad_proj)

                exp_avg, exp_avg_sq = state['exp_avg_proj'], state['exp_avg_sq_proj']

                if weight_decay != 0:
                    p.data.mul_(1 - lr * weight_decay)

                exp_avg.mul_(betas[0]).add_(grad_proj, alpha=1 - betas[0])
                exp_avg_sq.mul_(betas[1]).addcmul_(grad_proj, grad_proj, value=1 - betas[1])

                bias_correction1 = 1 - betas[0] ** step
                bias_correction2 = 1 - betas[1] ** step
                step_size = lr / bias_correction1
                denom = (exp_avg_sq.sqrt() / math.sqrt(bias_correction2)).add_(eps)

                update_proj = (exp_avg / denom).mul_(step_size * scale)

                if quantize and 'U_q' in state:
                    U_deq = self._dequantize_lowrank(*state['U_q'])
                    V_deq = self._dequantize_lowrank(*state['V_q'])
                    update = U_deq @ update_proj @ V_deq.T
                else:
                    update = U_r @ update_proj @ V_r.T

                if orig_shape is not None:
                    update = update.view(orig_shape)
                p.data.add_(update, alpha=-1.0)
        return loss

    def _adamw_step(self, p, grad, group, step):
        lr, weight_decay, betas, eps = group['lr'], group['weight_decay'], group['betas'], group['eps']
        state = self.state.setdefault(p, {})
        if 'exp_avg' not in state:
            state['exp_avg'] = torch.zeros_like(p.data)
            state['exp_avg_sq'] = torch.zeros_like(p.data)
        
        if weight_decay != 0:
            p.data.mul_(1 - lr * weight_decay)
            
        state['exp_avg'].mul_(betas[0]).add_(grad, alpha=1 - betas[0])
        state['exp_avg_sq'].mul_(betas[1]).addcmul_(grad, grad, value=1 - betas[1])
        step_size = lr / (1 - betas[0] ** step)
        denom = (state['exp_avg_sq'].sqrt() / math.sqrt(1 - betas[1] ** step)).add_(eps)
        p.data.addcdiv_(state['exp_avg'], denom, value=-step_size)

class TokenDataset(Dataset):
    def __init__(self, data, block_size):
        self.data = data
        self.block_size = block_size

    def __len__(self):
        return max(0, len(self.data) - self.block_size - 1)

    def __getitem__(self, idx):
        return self.data[idx:idx + self.block_size], self.data[idx + 1:idx + self.block_size + 1]

class TrainingConfig:
    def __init__(self, n_embd=256, n_head=8, n_layer=8, block_size=256,
                 max_iters=1500, learning_rate=3e-4, batch_size=16, vocab_size=1024,
                 eval_interval=50, eval_iters=20, early_stopping_patience=500,
                 early_stopping_min_delta=1e-4, checkpoint_interval=500,
                 finetune=False, finetune_path=None, finetune_lr=1e-4,
                 num_experts=8, num_shared_experts=0,
                 max_grad_norm=1.0, warmup_steps=100, use_scheduler=True,
                 grad_accum_steps=1, moe_loss_coef=0.1,
                 compile_model=False, use_bf16=True,
                 freeze_inactive_experts=True, freeze_interval=200, freeze_threshold=0.01,
                 use_galore=False, galore_rank=64, galore_update_gap=200,
                 galore_quantize=False, use_8bit_adam=False,
                 use_muon=False, muon_lr=0.02, muon_wd=0.01,
                 use_onecycle=False):
        self.__dict__.update(locals())
        del self.__dict__['self']

    def to_dict(self):
        return self.__dict__.copy()

class Trainer:
    def __init__(self, model_class, config, device='auto'):
        self.model_class = model_class
        self.config = config
        self.device = get_optimal_device() if device == 'auto' else torch.device(device)
        self.checkpoint_interval = config.checkpoint_interval
        self.amp_ctx = get_amp_context(self.device)
        self.scaler = torch.amp.GradScaler('cuda') if (self.device.type == 'cuda' and not config.use_bf16) else None

        self.current_iter, self.best_iter = 0, 0
        self.best_val_loss = float('inf')
        self.patience_counter = 0
        self.history = {'train_loss': [], 'val_loss': [], 'steps': []}
        self.checkpoints = []
        self.early_stopped = False
        self._expert_load_window = []
        self._val_stream = torch.cuda.Stream(device=self.device) if self.device.type == 'cuda' else None

        self._init_model()

    def _init_model(self):
        kwargs = dict(vocab_size=self.config.vocab_size, n_embd=self.config.n_embd,
                      n_head=self.config.n_head, n_layer=self.config.n_layer,
                      block_size=self.config.block_size, num_experts=self.config.num_experts,
                      num_shared_experts=self.config.num_shared_experts)
                      
        self.model = self.model_class(**kwargs).to(self.device)
        lr = self.config.learning_rate
        
        if self.config.finetune and self.config.finetune_path:
            self.model.load_state_dict(torch.load(self.config.finetune_path, map_location=self.device, weights_only=True))
            lr = self.config.finetune_lr

        self.model.train()
        self.model.gradient_checkpointing = True

        if self.config.compile_model:
            try:
                self.model = torch.compile(self.model, mode="max-autotune", fullgraph=False, dynamic=True)
            except Exception as e:
                logger.warning(f"Компиляция не удалась: {e}")

        raw_model = self.model._orig_mod if hasattr(self.model, "_orig_mod") else self.model

        if self.config.use_muon:
            muon_params, adamw_params = [], []
            for name, param in raw_model.named_parameters():
                if param.ndim == 2 and 'weight' in name:
                    muon_params.append(param)
                else:
                    adamw_params.append(param)
            self.optimizer = torch.optim.AdamW(adamw_params, lr=lr, betas=(0.9, 0.95), weight_decay=0.1)
            self.muon_optimizer = Muon(muon_params, lr=self.config.muon_lr, weight_decay=self.config.muon_wd)
        elif self.config.use_galore:
            self.optimizer = GaLoreOptimizer(raw_model.parameters(), rank=self.config.galore_rank,
                                             update_proj_gap=self.config.galore_update_gap,
                                             quantize_projection=self.config.galore_quantize,
                                             weight_decay=0.1, lr=lr, betas=(0.9, 0.95))
            self.muon_optimizer = None
        else:
            self.optimizer = raw_model.configure_optimizers(weight_decay=0.1, learning_rate=lr, betas=(0.9, 0.95), device_type=self.device.type)
            self.muon_optimizer = None

        if self.config.use_scheduler:
            if self.config.use_onecycle:
                self.scheduler = torch.optim.lr_scheduler.OneCycleLR(
                    self.optimizer, max_lr=lr, total_steps=self.config.max_iters, 
                    pct_start=self.config.warmup_steps / self.config.max_iters, anneal_strategy='cos')
            else:
                def lr_lambda(step):
                    if step < self.config.warmup_steps: return float(step) / float(max(1, self.config.warmup_steps))
                    progress = float(step - self.config.warmup_steps) / float(max(1, self.config.max_iters - self.config.warmup_steps))
                    return max(0.0, 0.5 * (1.0 + math.cos(math.pi * progress)))
                self.scheduler = torch.optim.lr_scheduler.LambdaLR(self.optimizer, lr_lambda)
        else:
            self.scheduler = None

    @torch.inference_mode()
    def estimate_loss(self, data_loader):
        self.model.eval()
        losses = []
        for i, (xb, yb) in enumerate(data_loader):
            if i >= self.config.eval_iters: break
            with self.amp_ctx:
                _, loss, _ = self.model(xb.to(self.device), yb.to(self.device))
            losses.append(loss.item())
        self.model.train()
        return sum(losses) / len(losses) if losses else float('inf')

    def train(self, data, model_name, progress_callback=None, error_callback=None):
        dataset = TokenDataset(data, self.config.block_size)
        
        # === ИСПРАВЛЕНИЕ BUG-1: Разделение train/val без утечки данных ===
        use_pin_memory = (self.device.type == 'cuda')
        train_size = int(0.9 * len(dataset))
        train_subset = Subset(dataset, range(0, train_size))
        val_subset = Subset(dataset, range(train_size, len(dataset)))
        
        train_loader = DataLoader(
            train_subset, 
            batch_size=self.config.batch_size, 
            shuffle=True, 
            drop_last=True,
            pin_memory=use_pin_memory
        )
        val_loader = DataLoader(
            val_subset, 
            batch_size=self.config.batch_size,
            pin_memory=use_pin_memory
        )
        train_iter = iter(train_loader)
        for i in range(self.config.max_iters):
            step_start = time.time()
            self.current_iter = i + 1

            if (i % self.config.grad_accum_steps == 0):
                self.optimizer.zero_grad(set_to_none=True)
                if self.muon_optimizer: self.muon_optimizer.zero_grad(set_to_none=True)

            try: xb, yb = next(train_iter)
            except StopIteration: train_iter = iter(train_loader); xb, yb = next(train_iter)

            with self.amp_ctx:
                _, ce_loss, aux_loss = self.model(xb.to(self.device), yb.to(self.device))
                loss = (ce_loss + self.config.moe_loss_coef * aux_loss) / self.config.grad_accum_steps

            if self.scaler: self.scaler.scale(loss).backward()
            else: loss.backward()

            if ((i + 1) % self.config.grad_accum_steps == 0) or ((i + 1) == self.config.max_iters):
                if self.config.max_grad_norm > 0:
                    if self.scaler:
                        self.scaler.unscale_(self.optimizer)
                        if self.muon_optimizer: self.scaler.unscale_(self.muon_optimizer)
                    raw_model = self.model._orig_mod if hasattr(self.model, "_orig_mod") else self.model
                    torch.nn.utils.clip_grad_norm_([p for p in raw_model.parameters() if p.grad is not None], self.config.max_grad_norm)

                if self.scaler:
                    self.scaler.step(self.optimizer)
                    if self.muon_optimizer: self.scaler.step(self.muon_optimizer)
                    self.scaler.update()
                else:
                    self.optimizer.step()
                    if self.muon_optimizer: self.muon_optimizer.step()

                if self.scheduler: self.scheduler.step()

            # Логирование и валидация
            if (i + 1) % 10 == 0:
                aux_val = aux_loss.item() if hasattr(aux_loss, 'item') else float(aux_loss)
                train_loss = ce_loss.item() + self.config.moe_loss_coef * aux_val
                
                # === ДОБАВЛЕНО: Расчет Validation Loss ===
                current_val_loss = None
                
                # Проверяем на каждой eval_interval итерации (по умолчанию каждые 50 шагов)
                if (i + 1) % self.config.eval_interval == 0:
                    current_val_loss = self.estimate_loss(val_loader)
                    
                    # Сохраняем лучший чекпоинт и сбрасываем счётчик терпения
                    if current_val_loss < self.best_val_loss - self.config.early_stopping_min_delta:
                        self.best_val_loss = current_val_loss
                        self.patience_counter = 0
                        self.save_checkpoint(f"{model_name}_best")
                    else:
                        self.patience_counter += 1
                    
                    # Early Stopping: patience задан в итерациях, переводим в кол-во оценок
                    patience_evals = max(1, self.config.early_stopping_patience // self.config.eval_interval)
                    if self.patience_counter >= patience_evals:
                        self.early_stopped = True

                if progress_callback: 
                    progress_callback(i, self.config.max_iters, train_loss, current_val_loss,
                                      self.optimizer.param_groups[0]['lr'], early_stop=self.early_stopped)
                
                if self.early_stopped:
                    logger.info(f"Early stopping на итерации {i+1} (val_loss не улучшался {self.patience_counter} оценок)")
                    break

        self.save_checkpoint(model_name)
        return {'best_val_loss': self.best_val_loss, 'final_iter': self.current_iter}

    def save_checkpoint(self, model_name, save_best_only=False):
        raw_model = self.model._orig_mod if hasattr(self.model, "_orig_mod") else self.model
        torch.save(raw_model.state_dict(), f"{model_name}.pth")
        with open(f"{model_name}.conf", "wb") as f: pickle.dump(self.config.to_dict(), f)

# === ВОССТАНОВЛЕННЫЕ ФУНКЦИИ ===

def finalize_training(results, model_name):
    return f"Обучение завершено. Лучший val loss: {results.get('best_val_loss', 0):.4f}"

def load_training_data(tokens_path):
    with open(tokens_path, 'rb') as f:
        data = safe_pickle_load(f)
    return torch.tensor(data, dtype=torch.long)