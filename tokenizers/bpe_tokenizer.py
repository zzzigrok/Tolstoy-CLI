"""
tokenizers/bpe_tokenizer.py — Модуль токенизации Tolstoy AI Studio на базе rust-bpe-tokenizer.

Интегрирует нативное Rust-ядро (PyO3 FFI + Rayon + Bincode):
  1. Ускорение обучения до 7–10x и кодирования до 10–20x с полным освобождением Python GIL.
  2. Параллельное (Rayon, use_parallel=True) и последовательное (use_parallel=False) кодирование.
  3. Побайтовое декодирование (decode_bytes) и строгий режим валидации (strict=True).
  4. Компактная сериализация в бинарный формат Bincode (.bpe, заголовок BPE1 v10)
     с автоматической обратной совместимостью и миграцией со старых файлов Pickle (.pkl).
  5. Поддержка стандартных протоколов Python: len(), repr(), pickle, copy.deepcopy, multiprocessing.
"""
import copy
import os
import pickle
import re
import tempfile
import unittest
from typing import Dict, List, Optional

from rust_bpe_tokenizer import BPETokenizer, __version__

# -----------------------------------------------------------------------------
# Pre-tokenization regex (GPT-2 / CLIP style adapted for Cyrillic)
# Соответствует регулярному выражению внутри Rust-ядра BpeCore
# -----------------------------------------------------------------------------
RU_PATTERN = re.compile(
    r""" ?[а-яА-ЯёЁa-zA-Z]+-[а-яА-ЯёЁa-zA-Z]+| ?\w+| ?[^\s\w]+|\s+(?!\S)|\s+"""
)

DEFAULT_TOKENIZER_BPE = "custom_tokenizer.bpe"
DEFAULT_TOKENIZER_PKL = "custom_tokenizer.pkl"


def extract_vocab(tokenizer: BPETokenizer) -> Dict[int, bytes]:
    """
    Извлекает полный словарь {token_id: raw_bytes} из экземпляра BPETokenizer.
    Использует нативный метод decode_bytes для реконструкции байтового представления
    каждого токена словаря (с поддержкой fallback на атрибут .vocab для legacy-объектов).
    """
    if hasattr(tokenizer, "vocab") and isinstance(getattr(tokenizer, "vocab"), dict):
        return dict(tokenizer.vocab)
    vocab_len = len(tokenizer)
    return {idx: tokenizer.decode_bytes([idx]) for idx in range(vocab_len)}


def resolve_tokenizer_path(
    model_or_base_path: Optional[str] = None,
    fallback_name: str = "custom_tokenizer",
) -> Optional[str]:
    """
    Определяет путь к файлу токенизатора с приоритетом формата Bincode (.bpe)
    и автоматическим откатом на legacy Pickle (.pkl).

    Порядок поиска:
      1. Если передан путь к весам модели (.pth) или префикс имени:
         - <stem>_tokenizer.bpe
         - <stem>.bpe
         - <stem>_tokenizer.pkl
         - <stem>.pkl
      2. Глобальный токенизатор по умолчанию:
         - <fallback_name>.bpe
         - <fallback_name>.pkl
    """
    candidates: List[str] = []

    if model_or_base_path:
        if os.path.isfile(model_or_base_path) and model_or_base_path.endswith((".bpe", ".pkl")):
            return model_or_base_path

        stem = model_or_base_path
        for suffix in (".pth", "_tokenizer.bpe", "_tokenizer.pkl", ".bpe", ".pkl"):
            if stem.endswith(suffix):
                stem = stem[: -len(suffix)]
                break

        candidates.extend(
            [
                f"{stem}_tokenizer.bpe",
                f"{stem}.bpe",
                f"{stem}_tokenizer.pkl",
                f"{stem}.pkl",
            ]
        )

    if fallback_name:
        fb_stem = fallback_name
        for suffix in (".bpe", ".pkl"):
            if fb_stem.endswith(suffix):
                fb_stem = fb_stem[: -len(suffix)]
                break
        candidates.extend([f"{fb_stem}.bpe", f"{fb_stem}.pkl"])

    for path in candidates:
        if os.path.isfile(path):
            return path

    return None


__all__ = [
    "BPETokenizer",
    "__version__",
    "RU_PATTERN",
    "DEFAULT_TOKENIZER_BPE",
    "DEFAULT_TOKENIZER_PKL",
    "extract_vocab",
    "resolve_tokenizer_path",
]


# =============================================================================
# UNIT TESTS — строгая верификация нативного Rust BPETokenizer
# =============================================================================
class TestBPETokenizer(unittest.TestCase):
    def test_roundtrip_simple(self):
        text = "aaabdaaabac"
        tok = BPETokenizer()
        tok.train(text, vocab_size=260)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_roundtrip_cyrillic(self):
        text = "Привет, мир! Это высокопроизводительный Rust BPE тест."
        tok = BPETokenizer()
        tok.train(text, vocab_size=300)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_overlapping_pairs_aaaa(self):
        """Перекрывающиеся пары: 'aaaa' -> 'aa'+'aa' -> 'aaaa'."""
        text = "aaaa"
        tok = BPETokenizer()
        tok.train(text, vocab_size=258)
        self.assertEqual(tok.decode(tok.encode(text)), text)
        self.assertEqual(len(tok), 258)
        self.assertEqual(tok.merges_len, 2)

    def test_repeated_pattern_ababab(self):
        text = "abababababab"
        tok = BPETokenizer()
        tok.train(text, vocab_size=260)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_hyphenated_word(self):
        text = "state-of-the-art писатель-романист"
        tok = BPETokenizer()
        tok.train(text, vocab_size=270)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_bincode_save_load_identity(self):
        text = "hello world, this is a Bincode (.bpe) serialization test."
        tok1 = BPETokenizer()
        tok1.train(text, vocab_size=270)
        enc1 = tok1.encode(text)

        fd, path = tempfile.mkstemp(suffix=".bpe")
        os.close(fd)
        try:
            tok1.save(path)
            tok2 = BPETokenizer.load(path)
            enc2 = tok2.encode(text)
            self.assertEqual(enc1, enc2)
            self.assertEqual(tok2.decode(enc2), text)
            self.assertEqual(len(tok1), len(tok2))
            self.assertEqual(tok1.merges_len, tok2.merges_len)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_legacy_pickle_migration(self):
        text = "Проверка миграции legacy .pkl словаря в Rust BPETokenizer."
        tok = BPETokenizer()
        tok.train(text, vocab_size=275)
        expected_ids = tok.encode(text)

        # Эмулируем сохранение словаря в старом формате pickle
        vocab_dict = extract_vocab(tok)
        # Создадим эталонный legacy pickle через архивный токенизатор
        from docs.archive.bpe_tokenizer_old import BPETokenizer as LegacyPyTokenizer

        legacy_tok = LegacyPyTokenizer()
        legacy_ids = legacy_tok.train(text, vocab_size=275)
        self.assertEqual(expected_ids, legacy_ids)

        fd, pkl_path = tempfile.mkstemp(suffix=".pkl")
        os.close(fd)
        try:
            legacy_tok.save(pkl_path)
            migrated_tok = BPETokenizer.load(pkl_path)
            self.assertEqual(migrated_tok.encode(text), expected_ids)
            self.assertEqual(migrated_tok.decode(expected_ids), text)
            self.assertEqual(extract_vocab(migrated_tok), vocab_dict)
        finally:
            if os.path.exists(pkl_path):
                os.unlink(pkl_path)

    def test_parallel_and_sequential_parity(self):
        text = ("Лев Николаевич Толстой — русский писатель и мыслитель. " * 25).strip()
        tok = BPETokenizer()
        tok.train(text, vocab_size=320)
        enc_par = tok.encode(text, use_parallel=True)
        enc_seq = tok.encode(text, use_parallel=False)
        self.assertEqual(enc_par, enc_seq)
        self.assertEqual(tok.decode(enc_seq), text)

    def test_decode_bytes_and_strict_mode(self):
        text = "Тестирование decode_bytes и строгого режима strict=True."
        tok = BPETokenizer()
        tok.train(text, vocab_size=280)
        ids = tok.encode(text)

        self.assertEqual(tok.decode_bytes(ids), text.encode("utf-8"))
        self.assertEqual(tok.decode(ids, strict=True), text)
        self.assertEqual(tok.decode_bytes(ids, strict=True), text.encode("utf-8"))

        with self.assertRaises(ValueError):
            tok.decode(ids + [999_999], strict=True)
        with self.assertRaises(ValueError):
            tok.decode_bytes(ids + [999_999], strict=True)

    def test_pickle_and_deepcopy(self):
        text = "Проверка стандартных протоколов pickle и copy.deepcopy."
        tok = BPETokenizer()
        tok.train(text, vocab_size=275)
        ids = tok.encode(text)

        restored = pickle.loads(pickle.dumps(tok))
        copied = copy.deepcopy(tok)

        self.assertEqual(restored.encode(text), ids)
        self.assertEqual(copied.encode(text), ids)

    def test_extract_vocab_and_resolve_path(self):
        tok = BPETokenizer()
        tok.train("тестовый корпус для проверки словаря", vocab_size=270)
        vocab = extract_vocab(tok)
        self.assertEqual(len(vocab), len(tok))
        self.assertEqual(vocab[0], b"\x00")
        self.assertEqual(vocab[65], b"A")

        with tempfile.TemporaryDirectory() as tmpdir:
            bpe_file = os.path.join(tmpdir, "model_tokenizer.bpe")
            tok.save(bpe_file)
            resolved = resolve_tokenizer_path(os.path.join(tmpdir, "model.pth"), fallback_name="")
            self.assertEqual(resolved, bpe_file)

    def test_empty_inputs(self):
        tok = BPETokenizer()
        self.assertEqual(tok.encode(""), [])
        self.assertEqual(tok.decode([]), "")

    def test_vocab_too_small_fails(self):
        tok = BPETokenizer()
        with self.assertRaises(ValueError):
            tok.train("test", vocab_size=200)

    def test_inference_without_train(self):
        """До обучения encode должен вернуть байты как есть."""
        tok = BPETokenizer()
        self.assertEqual(tok.encode("ab"), [97, 98])


if __name__ == "__main__":
    unittest.main()
