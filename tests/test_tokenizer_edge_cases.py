"""
tests/test_tokenizer_edge_cases.py — Комплексное тестирование граничных условий и устойчивости BPETokenizer.

Проверяет:
  1. Минимальный размер словаря (vocab_size=256, 0 слияний, чистый побайтовый режим).
  2. Полноту побайтового пространства: сохранение и восстановление всех 256 возможных байт.
  3. Пустые строки, пробельные символы, табы, множественные переводы строк.
  4. Сложный Юникод: эмодзи, составные символы, редкие алфавиты, дореволюционную русскую орфографию (ѣ, і, ѳ, ѵ).
  5. Длинные повторяющиеся последовательности и отсутствие рекурсивных переполнений.
  6. Режимы строгой декодировки (strict=True vs strict=False), обработку некорректных токенов и усеченных UTF-8 байт.
  7. Контракт обратного вызова прогресса обучения (progress_bar callback).
  8. Устойчивость к поврежденным и некорректным файлам моделей.
  9. Полный паритет Rayon (parallel) и последовательного (sequential) режимов на всех граничных случаях.
"""
import os
import tempfile
import unittest

from tokenizers import (
    BPETokenizer,
    extract_vocab,
    resolve_tokenizer_path,
)


class TestTokenizerEdgeCases(unittest.TestCase):
    def test_minimal_vocab_256_no_merges(self):
        text = "Минимальный словарь BPE без единого слияния (только базовые 256 байт)."
        tok = BPETokenizer()
        tokens = tok.train(text, vocab_size=256)

        self.assertEqual(len(tok), 256)
        self.assertEqual(tok.vocab_size, 256)
        self.assertEqual(tok.merges_len, 0)

        # Каждому байту UTF-8 должен соответствовать ровно один токен
        raw_bytes = text.encode("utf-8")
        self.assertEqual(tokens, list(raw_bytes))
        self.assertEqual(tok.encode(text, use_parallel=False), list(raw_bytes))
        self.assertEqual(tok.encode(text, use_parallel=True), list(raw_bytes))
        self.assertEqual(tok.decode(tokens, strict=True), text)

    def test_all_256_bytes_roundtrip(self):
        all_bytes = bytes(range(256))
        tok = BPETokenizer()
        tok.train("Азбука и базовый русский текст для инициализации", vocab_size=270)

        # Любая произвольная бинарная последовательность декодируется через decode_bytes
        # Базовые 256 токенов соответствуют отдельным байтам
        byte_ids = list(all_bytes)
        decoded_bytes = tok.decode_bytes(byte_ids, strict=True)
        self.assertEqual(decoded_bytes, all_bytes)

    def test_empty_and_whitespace_only_strings(self):
        tok = BPETokenizer()
        tok.train("Тестовый корпус с различными пробелами и переносами строк.\n\t", vocab_size=280)

        # Пустая строка
        self.assertEqual(tok.encode("", use_parallel=True), [])
        self.assertEqual(tok.encode("", use_parallel=False), [])
        self.assertEqual(tok.decode([]), "")
        self.assertEqual(tok.decode_bytes([]), b"")

        # Пробельные последовательности
        whitespaces = [" ", "   ", "\t", "\n", "\r\n", "  \n\t  \n  "]
        for ws in whitespaces:
            enc_par = tok.encode(ws, use_parallel=True)
            enc_seq = tok.encode(ws, use_parallel=False)
            self.assertEqual(enc_par, enc_seq, f"Mismatch for whitespace: {repr(ws)}")
            self.assertEqual(tok.decode(enc_par, strict=True), ws)

    def test_complex_unicode_and_emojis(self):
        tok = BPETokenizer()
        tok.train("Корпус с эмодзи 🚀 и символами классической русской литературы.", vocab_size=300)

        test_cases = [
            "🚀🔥✨🎉💡💻",
            "Семья: 👨‍👩‍👧‍👦 (ZWJ-последовательность)",
            "Китайский: 你好，世界！",
            "Японский: こんにちは世界",
            "Арабский: مرحبا بالعالم",
            "Хинди: नमस्ते दुनिया",
            "Древнегреческий: Ἐν ἀρχῇ ἦν ὁ λόγος",
            "Дореволюционная орфография Толстого: Война и миръ, нѣтъ, онѣ, разъ, всѣмъ, Іисусъ, Ѳома, мѵро.",
            "Смешанный: Leo Tolstoy 1828–1910 — автор романа «Анна Каренина» (100% Russian literature!).",
        ]

        for text in test_cases:
            enc_par = tok.encode(text, use_parallel=True)
            enc_seq = tok.encode(text, use_parallel=False)
            self.assertEqual(enc_par, enc_seq, f"Rayon vs Seq mismatch on: {text}")
            dec = tok.decode(enc_par, strict=True)
            self.assertEqual(dec, text, f"Roundtrip failed for: {text}")

    def test_large_repetitive_patterns(self):
        tok = BPETokenizer()
        sample = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя " * 50
        tok.train(sample, vocab_size=320)

        # Паттерн из 10_000 одинаковых букв
        rep_a = "а" * 10_000
        enc_par = tok.encode(rep_a, use_parallel=True)
        enc_seq = tok.encode(rep_a, use_parallel=False)
        self.assertEqual(enc_par, enc_seq)
        self.assertEqual(tok.decode(enc_par, strict=True), rep_a)

        # Паттерн из 5_000 повторяющихся пар 'то'
        rep_to = "то" * 5_000
        enc_to_par = tok.encode(rep_to, use_parallel=True)
        enc_to_seq = tok.encode(rep_to, use_parallel=False)
        self.assertEqual(enc_to_par, enc_to_seq)
        self.assertEqual(tok.decode(enc_to_par, strict=True), rep_to)

    def test_strict_mode_and_invalid_tokens(self):
        tok = BPETokenizer()
        tok.train("Простой текст для проверки режима strict и ошибочных токенов.", vocab_size=280)

        # Токен за пределами словаря в strict=True вызывает ValueError
        out_of_bounds_id = 999999
        with self.assertRaises(ValueError):
            tok.decode([out_of_bounds_id], strict=True)

        with self.assertRaises(ValueError):
            tok.decode_bytes([out_of_bounds_id], strict=True)

        # В нестрогом режиме (strict=False) неизвестный ID безопасно пропускается без исключений
        self.assertEqual(tok.decode([out_of_bounds_id], strict=False), "")
        self.assertEqual(tok.decode_bytes([out_of_bounds_id], strict=False), b"")
        # В сочетании с валидным токеном 'а' (UTF-8 b'\xd0\xb0')
        valid_id = ord('a')
        self.assertEqual(tok.decode([out_of_bounds_id, valid_id], strict=False), "a")

        # Невалидная последовательность UTF-8 (например, только первый байт двухбайтового символа 'ж': 0xd0)
        # 'ж' = b'\xd0\xb6'
        invalid_utf8_single_byte = [0xD0]
        # decode_bytes всегда выдает байты как есть
        self.assertEqual(tok.decode_bytes(invalid_utf8_single_byte, strict=True), b"\xd0")

        # decode(strict=True) на оборванном байте UTF-8 должен вызывать ValueError
        with self.assertRaises(ValueError):
            tok.decode(invalid_utf8_single_byte, strict=True)

        # decode(strict=False) должен подставлять стандартный символ замены U+FFFD
        replaced = tok.decode(invalid_utf8_single_byte, strict=False)
        self.assertEqual(replaced, "\ufffd")

    def test_progress_bar_callback_invocation(self):
        class ProgressCollector:
            def __init__(self):
                self.calls = []

            def progress(self, val, text=""):
                self.calls.append((val, text))

        collector = ProgressCollector()
        tok = BPETokenizer()
        corpus = "Анна Каренина сидела в гостиной и читала книгу. " * 30
        tok.train(corpus, vocab_size=320, progress_bar=collector)

        self.assertGreater(len(collector.calls), 0)
        # Проверяем монотонность и диапазон значений 0.0 .. 1.0
        prev = -1.0
        for val, desc in collector.calls:
            self.assertIsInstance(val, float)
            self.assertGreaterEqual(val, 0.0)
            self.assertLessEqual(val, 1.0001)
            self.assertGreaterEqual(val, prev)
            self.assertIsInstance(desc, str)
            prev = val

    def test_invalid_training_arguments(self):
        tok = BPETokenizer()
        # vocab_size < 256 недопустим
        with self.assertRaises(ValueError):
            tok.train("Текст", vocab_size=255)

        with self.assertRaises(ValueError):
            tok.train("Текст", vocab_size=0)

    def test_corrupted_file_handling(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # 1. Несуществующий файл
            fake_path = os.path.join(tmpdir, "non_existent.bpe")
            with self.assertRaises((ValueError, IOError, FileNotFoundError, RuntimeError)):
                BPETokenizer.load(fake_path)

            # 2. Пустой файл
            empty_path = os.path.join(tmpdir, "empty.bpe")
            with open(empty_path, "wb") as f:
                pass
            with self.assertRaises((ValueError, IOError, RuntimeError)):
                BPETokenizer.load(empty_path)

            # 3. Файл со сломанным заголовком
            corrupt_path = os.path.join(tmpdir, "corrupt.bpe")
            with open(corrupt_path, "wb") as f:
                f.write(b"NOT_A_VALID_BPE_MAGIC_HEADER_1234567890")
            with self.assertRaises((ValueError, IOError, RuntimeError)):
                BPETokenizer.load(corrupt_path)

    def test_extract_vocab_completeness(self):
        tok = BPETokenizer()
        corpus = "Тестовая выборка для проверки полноты словаря extract_vocab."
        tok.train(corpus, vocab_size=290)

        vocab = extract_vocab(tok)
        self.assertEqual(len(vocab), len(tok))
        self.assertEqual(len(vocab), 290)

        # Все первые 256 токенов должны быть однобайтными значениями
        for i in range(256):
            self.assertEqual(vocab[i], bytes([i]))

        # Токены слияний должны иметь длину >= 2 байта
        for i in range(256, 290):
            self.assertGreaterEqual(len(vocab[i]), 2)


if __name__ == "__main__":
    unittest.main()
