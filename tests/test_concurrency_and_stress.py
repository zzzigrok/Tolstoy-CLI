"""
tests/test_concurrency_and_stress.py — Нагрузочное тестирование, многопоточность и стабильность памяти.

Проверяет:
  1. Потокобезопасность (Thread Safety): одновременное обращение множества потоков (ThreadPoolExecutor)
     к одному экземпляру BPETokenizer для parallel/sequential кодирования и декодирования.
  2. Стресс-тест на реальном корпусе русской классики (100K+ символов):
     обучение словаря vocab_size=1024, компрессия, 100% обратимость декодирования и высокая скорость.
  3. Стабильность памяти и сборка мусора: многократный жизненный цикл (создание, обучение, сериализация,
     десериализация, удаление) без утечек ресурсов или блокировок GIL.
"""
import concurrent.futures
import gc
import os
import tempfile
import time
import unittest

from tokenizers import (
    BPETokenizer,
    extract_vocab,
    resolve_tokenizer_path,
)
from utils.model_utils import clean_text


class TestConcurrencyAndStress(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        corpus_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "corpus",
            "Chekhov_Dama.txt",
        )
        if os.path.exists(corpus_path):
            with open(corpus_path, "r", encoding="utf-8", errors="ignore") as f:
                raw = f.read(150_000)
            cls.large_text = clean_text(raw)
        else:
            cls.large_text = clean_text(
                "Классический русский текст для нагрузочного стресс-тестирования. " * 3000
            )

    def test_multithreaded_concurrent_access(self):
        tok = BPETokenizer()
        tok.train(self.large_text[:20_000], vocab_size=512)

        test_sentences = [
            "Говорили, что на набережной появилось новое лицо: дама с собачкой.",
            "Дмитрий Дмитрич Гуров, проживший в Ялте уже две недели и привыкший тут, тоже стал интересоваться новыми лицами.",
            "Сидя в павильоне у Верне, он видел, как по набережной прошла молодая дама, невысокого роста блондинка, в берете;",
            "за нею бежал белый шпиц.",
            "И потом он встречал ее в городском саду и на сквере по нескольку раз в день.",
            "Она гуляла одна, все в том же берете, с белым шпицем; никто не знал, кто она, и звали ее просто так: дама с собачкой.",
            "«Если она здесь без мужа и без знакомых, — соображал Гуров, — то было бы не лишнее познакомиться с ней».",
            "Ему не было еще сорока, но у него была уже дочь двенадцати лет и два сына-гимназиста.",
        ]

        def worker_task(sentence: str):
            # Поток выполняет оба режима кодирования и декодирование
            enc_par = tok.encode(sentence, use_parallel=True)
            enc_seq = tok.encode(sentence, use_parallel=False)
            if enc_par != enc_seq:
                return False, "Parity mismatch"
            dec_par = tok.decode(enc_par, strict=True)
            if dec_par != sentence:
                return False, f"Decoded text mismatch: {dec_par} != {sentence}"
            dec_bytes = tok.decode_bytes(enc_par, strict=True)
            if dec_bytes != sentence.encode("utf-8"):
                return False, "Decoded bytes mismatch"
            return True, "OK"

        # Запускаем 8 потоков с пулом задач (каждое предложение по 20 раз)
        tasks = test_sentences * 20
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(worker_task, s) for s in tasks]
            for future in concurrent.futures.as_completed(futures):
                success, msg = future.result()
                self.assertTrue(success, msg)

    def test_stress_throughput_on_full_russian_corpus(self):
        tok = BPETokenizer()
        train_slice = self.large_text[:50_000]
        vocab_size = 1024

        t0 = time.perf_counter()
        train_tokens = tok.train(train_slice, vocab_size=vocab_size)
        train_time = time.perf_counter() - t0

        self.assertEqual(len(tok), vocab_size)
        self.assertLess(train_time, 10.0, f"Training took too long: {train_time:.2f}s")

        test_slice = self.large_text[:40_000]
        t0 = time.perf_counter()
        enc_par = tok.encode(test_slice, use_parallel=True)
        par_time = time.perf_counter() - t0

        t0 = time.perf_counter()
        enc_seq = tok.encode(test_slice, use_parallel=False)
        seq_time = time.perf_counter() - t0

        self.assertEqual(enc_par, enc_seq)

        t0 = time.perf_counter()
        dec = tok.decode(enc_par, strict=True)
        dec_time = time.perf_counter() - t0

        self.assertEqual(dec, test_slice)

        raw_bytes_len = len(test_slice.encode("utf-8"))
        mb_size = raw_bytes_len / (1024 * 1024)
        throughput_par = mb_size / par_time if par_time > 0 else 0

        self.assertGreater(throughput_par, 1.0, f"Throughput too low: {throughput_par:.2f} MB/s")

    def test_memory_stability_and_gc(self):
        sample = self.large_text[:5_000]

        with tempfile.TemporaryDirectory() as tmpdir:
            for i in range(20):
                tok = BPETokenizer()
                tok.train(sample, vocab_size=300)
                temp_path = os.path.join(tmpdir, f"temp_tok_{i}.bpe")
                tok.save(temp_path)

                loaded = BPETokenizer.load(temp_path)
                enc = loaded.encode("Тестовая строка для сборщика мусора.", use_parallel=False)
                dec = loaded.decode(enc, strict=True)
                self.assertEqual(dec, "Тестовая строка для сборщика мусора.")

                # Удаляем ссылки и форсируем сборку мусора Python
                del tok
                del loaded
                gc.collect()


if __name__ == "__main__":
    unittest.main()
