"""
Мониторинг системных ресурсов и умный выбор устройства
Поддержка: CUDA, Intel XPU, Apple MPS, CPU

Дополнительные функции:
- Оценка оптимального batch size по доступной памяти
- torch.compile compatibility check
- FlashAttention availability detection
"""
import torch
import os

try:
    import psutil
except ImportError:
    psutil = None

try:
    import pynvml
    NVML_AVAILABLE = True
except ImportError:
    NVML_AVAILABLE = False


def get_system_stats():
    stats = {
        "cpu_percent": psutil.cpu_percent(interval=None) if psutil else 0.0,
        "ram_gb": psutil.virtual_memory().used / (1024**3) if psutil else 0.0,
        "ram_total_gb": psutil.virtual_memory().total / (1024**3) if psutil else 0.0,
        "gpu_percent": None,
        "vram_gb": None,
        "vram_total_gb": None
    }

    if NVML_AVAILABLE and torch.cuda.is_available():
        try:
            pynvml.nvmlInit()
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            stats["vram_gb"] = mem_info.used / (1024**3)
            stats["vram_total_gb"] = mem_info.total / (1024**3)
            stats["gpu_percent"] = pynvml.nvmlDeviceGetUtilizationRates(handle).gpu
        except Exception:
            pass
    elif torch.cuda.is_available():
        stats["vram_gb"] = torch.cuda.memory_allocated() / (1024**3)
        stats["vram_total_gb"] = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    return stats


def get_optimal_dtype(device_type: str):
    if device_type == 'cuda':
        return torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    elif device_type == 'xpu':
        return torch.bfloat16 if hasattr(torch, 'xpu') and torch.xpu.is_available() else torch.float16
    elif device_type == 'mps':
        return torch.float16
    return torch.float32


def optimize_cpu_threads():
    num_cores = os.cpu_count()
    if num_cores:
        threads = max(1, num_cores - 1)
        torch.set_num_threads(threads)
        return threads
    return 1


def clear_memory(device):
    import gc
    gc.collect()
    device_type = device.type if isinstance(device, torch.device) else device

    if device_type == 'cuda':
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
        torch.cuda.synchronize()
    elif device_type == 'mps':
        torch.mps.empty_cache()
    elif device_type == 'xpu':
        if hasattr(torch, 'xpu'):
            torch.xpu.empty_cache()


def setup_environment():
    device, _, _ = get_device_info()
    if device == 'cuda':
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.set_float32_matmul_precision('high')
        torch.backends.cuda.enable_flash_sdp(True)
        torch.backends.cuda.enable_mem_efficient_sdp(True)
    return device


def check_flash_attention():
    """Проверяет доступность FlashAttention-2/3 через PyTorch SDPA."""
    if not torch.cuda.is_available():
        return False, "CUDA недоступен"
    try:
        # FlashAttention аппаратно поддерживается на архитектуре Ampere (major >= 8) и новее
        major = torch.cuda.get_device_properties(0).major
        if major >= 8 and torch.backends.cuda.flash_sdp_enabled():
            return True, "[Native SDPA Backend]"
        return False, f"Требуется Ampere+ (сейчас CC {major}.x)"
    except Exception as e:
        return False, str(e)


def check_torch_compile():
    """Проверяет доступность torch.compile."""
    return hasattr(torch, 'compile')


def get_device_info():
    if torch.cuda.is_available():
        try:
            gpu_memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            device_name = torch.cuda.get_device_name(0)
            if gpu_memory_gb >= 24:
                return "cuda", f"{device_name} ({gpu_memory_gb:.1f} ГБ)", "large"
            elif gpu_memory_gb >= 16:
                return "cuda", f"{device_name} ({gpu_memory_gb:.1f} ГБ)", "medium"
            elif gpu_memory_gb >= 8:
                return "cuda", f"{device_name} ({gpu_memory_gb:.1f} ГБ)", "small"
            else:
                return "cuda", f"{device_name} ({gpu_memory_gb:.1f} ГБ)", "mini"
        except Exception:
            return "cuda", "NVIDIA GPU", "mini"

    if hasattr(torch, 'xpu') and torch.xpu.is_available():
        try:
            device_name = torch.xpu.get_device_name(0)
            return "xpu", f"{device_name} (Intel)", "medium"
        except Exception:
            return "xpu", "Intel XPU", "small"

    if torch.backends.mps.is_available():
        return "mps", "Apple Silicon (M-Series)", "medium"

    if psutil:
        ram_gb = psutil.virtual_memory().total / (1024**3)
        if ram_gb >= 32:
            return "cpu", f"CPU ({ram_gb:.1f} ГБ RAM)", "medium"
        elif ram_gb >= 16:
            return "cpu", f"CPU ({ram_gb:.1f} ГБ RAM)", "small"
        else:
            return "cpu", f"CPU ({ram_gb:.1f} ГБ RAM)", "mini"
    return "cpu", "CPU", "mini"


def estimate_optimal_config(data_size_tokens=None, device='cpu', available_memory_gb=None):
    if available_memory_gb is None:
        if device == 'cuda' and torch.cuda.is_available():
            available_memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3) * 0.7
        else:
            available_memory_gb = psutil.virtual_memory().available / (1024**3) * 0.5 if psutil else 8.0

    if available_memory_gb >= 24:
        n_embd, n_layer, n_head = 1024, 16, 16
        max_iters = 10000
    elif available_memory_gb >= 20:
        n_embd, n_layer, n_head = 768, 12, 12
        max_iters = 5000
    elif available_memory_gb >= 12:
        n_embd, n_layer, n_head = 512, 8, 8
        max_iters = 3000
    elif available_memory_gb >= 6:
        n_embd, n_layer, n_head = 384, 6, 6
        max_iters = 2000
    else:
        n_embd, n_layer, n_head = 256, 4, 4
        max_iters = 1000

    if data_size_tokens:
        data_mb = data_size_tokens * 2 / (1024**2)
        if data_mb < 1:
            max_iters = min(max_iters, 500)
        elif data_mb < 10:
            max_iters = min(max_iters, 2000)

    return {
        'n_embd': n_embd, 'n_layer': n_layer, 'n_head': n_head,
        'block_size': 512, 'max_iters': max_iters,
        'batch_size': 32 if available_memory_gb >= 12 else 16
    }


def estimate_batch_size(model_params_mb, seq_len, device='cpu', safety_factor=0.8):
    """Оценивает максимальный batch size по доступной памяти."""
    stats = get_system_stats()
    if device == 'cuda' and stats['vram_total_gb']:
        avail_mb = (stats['vram_total_gb'] - stats['vram_gb']) * 1024 * safety_factor
    else:
        avail_mb = (stats['ram_total_gb'] - stats['ram_gb']) * 1024 * safety_factor

    # Эвристика: активации ~ 4 * seq_len * n_embd * 4 bytes per token
    per_token_mb = 4 * seq_len * 4 / (1024**2)  # упрощённо
    batch_size = int(avail_mb / (model_params_mb * 0.1 + per_token_mb * seq_len))
    return max(1, batch_size)


def get_smart_config_presets():
    device, hardware, recommended = get_device_info()
    presets = [
        {'key': 'auto',  'name': '🤖 Авто-выбор (рекомендуется)', 'desc': f'Под ваше оборудование: {hardware}'},
        {'key': 'nano',  'name': '🔬 Nano (эксперименты)', 'desc': 'n_embd=64, n_layer=1'},
        {'key': 'mini',  'name': '⚡ Мини (быстрое тестирование)', 'desc': 'n_embd=128, n_layer=2'},
        {'key': 'small', 'name': '📝 Малая (чат-боты)', 'desc': 'n_embd=256, n_layer=4'},
        {'key': 'medium','name': '📚 Средняя (универсальная)', 'desc': 'n_embd=512, n_layer=8'},
        {'key': 'large', 'name': '🧠 Большая (максимальное качество)', 'desc': 'n_embd=768, n_layer=12'},
        {'key': 'xlarge','name': '🚀 XL (требует 24GB+)', 'desc': 'n_embd=1024, n_layer=16'},
    ]
    if device == 'cuda':
        presets.append({'key': 'chat',  'name': '💬 Чат-бот оптимизация', 'desc': 'Диалоговая конфигурация'})
        presets.append({'key': 'logic', 'name': '🔐 Логика и код', 'desc': 'Увеличенный контекст'})
    return presets


def get_amp_context(device):
    from contextlib import nullcontext
    if isinstance(device, torch.device):
        device_type = device.type
    else:
        device_type = device

    if device_type == 'cuda':
        dtype = get_optimal_dtype('cuda')
        return torch.amp.autocast('cuda', dtype=dtype)
    elif device_type == 'xpu':
        dtype = get_optimal_dtype('xpu')
        return torch.amp.autocast('xpu', dtype=dtype)
    elif device_type == 'mps':
        return torch.amp.autocast('mps', dtype=torch.float16)
    else:
        return nullcontext()


def get_optimal_device(verbose=True):
    if torch.cuda.is_available():
        device = torch.device('cuda')
        if verbose:
            print(f"[DEVICE] Выбран CUDA: {torch.cuda.get_device_name(0)}")
        return device

    if hasattr(torch, 'xpu') and torch.xpu.is_available():
        device = torch.device('xpu')
        if verbose:
            try:
                name = torch.xpu.get_device_name(0)
            except Exception:
                name = "Intel XPU"
            print(f"[DEVICE] Выбран Intel XPU: {name}")
        return device

    if torch.backends.mps.is_available():
        device = torch.device('mps')
        if verbose:
            print("[DEVICE] Выбран Apple MPS")
        return device

    device = torch.device('cpu')
    if verbose:
        print("[DEVICE] Используется CPU")
    return device
