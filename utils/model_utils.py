import torch
import os
import pickle
import re
import hashlib

class RestrictedUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        raise pickle.UnpicklingError(f"Global '{module}.{name}' is forbidden for security reasons")

def safe_pickle_load(file):
    return RestrictedUnpickler(file).load()


def clean_text(raw_text):
    """
    Очистка текста от мусора и нормализация с сохранением Unicode.
    """
    if not raw_text: return ""
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]', '', raw_text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def validate_pkl_file(filepath, expected_keys=None):
    if not os.path.exists(filepath): return False, None, f"Файл не найден: {filepath}"
    try:
        with open(filepath, 'rb') as f: data = safe_pickle_load(f)
        return True, data, "OK"
    except Exception as e: return False, None, f"Ошибка чтения {filepath}: {str(e)}"

def load_model_safe(model_class, weights_path, device='cpu', **model_kwargs):
    if not os.path.exists(weights_path): return None, f"Файл весов не найден"
    try:
        state_dict = torch.load(weights_path, map_location=device, weights_only=True)
        model = model_class(**model_kwargs).to(device)
        model.load_state_dict(state_dict)
        model.eval()
        return model, None
    except Exception as e: return None, str(e)

def save_model_config(config, filepath):
    """Сохранение конфигурации модели в файл"""
    with open(filepath, 'wb') as f:
        pickle.dump(config, f)

def load_model_config(filepath):
    """Загрузка конфигурации модели из файла"""
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'rb') as f:
        return safe_pickle_load(f)

def get_effective_config(selected_preset, data_size_tokens=None):
    """Возвращает конфигурацию пресета. Единый источник истины — config/PRESETS."""
    # CLI-only пресеты (отсутствуют в config/)
    cli_only = {
        'chat':   {'n_embd': 512,  'n_layer': 6,  'n_head': 8,  'block_size': 2048, 'max_iters': 12000, 'batch_size': 16},
        'logic':  {'n_embd': 384,  'n_layer': 12, 'n_head': 6,  'block_size': 1024, 'max_iters': 15000, 'batch_size': 16},
    }
    if selected_preset in cli_only:
        return cli_only[selected_preset]

    try:
        from config import PRESETS
        if selected_preset in PRESETS:
            cfg = PRESETS[selected_preset]
            return {
                'n_embd': cfg.model.n_embd, 'n_layer': cfg.model.n_layer,
                'n_head': cfg.model.n_head, 'block_size': cfg.model.block_size,
                'max_iters': cfg.training.max_iters, 'batch_size': cfg.training.batch_size,
            }
    except ImportError:
        pass

    # Fallback
    return {'n_embd': 256, 'n_layer': 4, 'n_head': 8, 'block_size': 512, 'max_iters': 5000, 'batch_size': 16}

def estimate_tokenizer_quality(tokenizer, sample_text: str) -> dict:
    tokens = tokenizer.encode(sample_text)
    words = sample_text.split()
    return {'fertility': len(tokens) / len(words) if words else 0,
            'compression_ratio': len(sample_text.encode('utf-8')) / len(tokens) if tokens else 0,
            'num_tokens': len(tokens)}