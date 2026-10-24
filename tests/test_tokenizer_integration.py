"""
tests/test_tokenizer_integration.py — Интеграционные тесты токенизации Tolstoy-CLI.

Проверяет:
  1. 100% алгоритмический паритет rust-bpe-tokenizer и архивного Python-токенизатора на корпусе русской классики.
  2. Сериализацию в Bincode (.bpe), миграцию с legacy Pickle (.pkl) и резолвер путей resolve_tokenizer_path.
  3. Сквозную интеграцию с утилитами очистки текста, оценки качества (estimate_tokenizer_quality),
     TokenDataset и нейросетевой моделью TolstoyLLM_v5.
  4. Корректность работы диагностического стенда scripts/tester.py.
"""
import os
import tempfile
import unittest

import torch

from docs.archive.bpe_tokenizer_old import BPETokenizer as LegacyPyBPETokenizer
from models.tolstoy_model import TolstoyLLM_v5
from scripts.tester import test_tokenizer
from tokenizers import (
    BPETokenizer,
    __version__,
    extract_vocab,
    resolve_tokenizer_path,
)
from training.trainer import TokenDataset
from utils.model_utils import clean_text, estimate_tokenizer_quality


class TestTokenizerIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        corpus_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "corpus",
            "Chekhov_Dama.txt",
        )
        if os.path.exists(corpus_file):
            with open(corpus_file, "r", encoding="utf-8", errors="ignore") as f:
                raw = f.read(40_000)
            cls.sample_corpus = clean_text(raw)
        else:
            cls.sample_corpus = clean_text(
                "Лев Николаевич Толстой — один из наиболее известных русских писателей и мыслителей. "
                "Анна Каренина и Война и мир входят в золотой фонд мировой литературы. " * 100
            )

    def test_version_is_valid(self):
        self.assertIsInstance(__version__, str)
        self.assertNotEqual(__version__, "0.0.0+unknown")

    def test_parity_with_legacy_on_russian_corpus(self):
        vocab_size = 380
        py_tok = LegacyPyBPETokenizer()
        rs_tok = BPETokenizer()

        py_train_ids = py_tok.train(self.sample_corpus[:15_000], vocab_size=vocab_size)
        rs_train_ids = rs_tok.train(self.sample_corpus[:15_000], vocab_size=vocab_size)

        self.assertEqual(py_train_ids, rs_train_ids)
        self.assertEqual(len(rs_tok), len(py_tok.vocab))
        self.assertEqual(rs_tok.merges_len, len(py_tok.merges))
        self.assertEqual(extract_vocab(rs_tok), py_tok.vocab)

        holdout_text = self.sample_corpus[15_000:25_000]
        py_enc = py_tok.encode(holdout_text)
        rs_enc_par = rs_tok.encode(holdout_text, use_parallel=True)
        rs_enc_seq = rs_tok.encode(holdout_text, use_parallel=False)

        self.assertEqual(py_enc, rs_enc_par)
        self.assertEqual(py_enc, rs_enc_seq)
        self.assertEqual(rs_tok.decode(rs_enc_par, strict=True), holdout_text)

    def test_bpe_and_legacy_pkl_resolution_workflow(self):
        tok = BPETokenizer()
        tok.train(self.sample_corpus[:10_000], vocab_size=320)

        with tempfile.TemporaryDirectory() as tmpdir:
            model_pth = os.path.join(tmpdir, "nano_test.pth")
            ded_pkl = os.path.join(tmpdir, "nano_test_tokenizer.pkl")
            ded_bpe = os.path.join(tmpdir, "nano_test_tokenizer.bpe")

            # 1. Сначала создаем только legacy .pkl
            py_tok = LegacyPyBPETokenizer()
            py_tok.train(self.sample_corpus[:10_000], vocab_size=320)
            py_tok.save(ded_pkl)

            resolved_pkl = resolve_tokenizer_path(model_pth, fallback_name="")
            self.assertEqual(resolved_pkl, ded_pkl)

            # Мигрируем через BPETokenizer.load и сохраняем в .bpe
            migrated = BPETokenizer.load(resolved_pkl)
            migrated.save(ded_bpe)

            # 2. Теперь должен приоритетно выбираться .bpe
            resolved_bpe = resolve_tokenizer_path(model_pth, fallback_name="")
            self.assertEqual(resolved_bpe, ded_bpe)

            loaded_bpe = BPETokenizer.load(resolved_bpe)
            test_phrase = "Проверка приоритета загрузки бинарного формата Bincode (.bpe)."
            self.assertEqual(tok.encode(test_phrase), loaded_bpe.encode(test_phrase))

    def test_end_to_end_model_pipeline(self):
        tok = BPETokenizer()
        tokens = tok.train(self.sample_corpus[:12_000], vocab_size=320)

        metrics = estimate_tokenizer_quality(tok, self.sample_corpus[:2_000])
        self.assertGreater(metrics["fertility"], 0.5)
        self.assertGreater(metrics["compression_ratio"], 1.5)
        self.assertEqual(metrics["vocab_size"], len(tok))
        self.assertEqual(metrics["merges_len"], tok.merges_len)

        tensor_data = torch.tensor(tokens, dtype=torch.long)
        dataset = TokenDataset(tensor_data, block_size=32)
        self.assertGreater(len(dataset), 10)

        x, y = dataset[0]
        model = TolstoyLLM_v5(
            vocab_size=len(tok),
            n_embd=64,
            n_head=4,
            n_layer=2,
            block_size=32,
            n_kv_head=2,
            num_experts=2,
        )
        logits, loss, _ = model(x.unsqueeze(0), y.unsqueeze(0))
        self.assertEqual(logits.shape, (1, 32, len(tok)))
        self.assertFalse(torch.isnan(loss).item())

        prompt_ids = tok.encode("Дама с собачкой", use_parallel=False)
        prompt_tensor = torch.tensor([prompt_ids], dtype=torch.long)
        out_ids = model.generate(prompt_tensor, max_new_tokens=8, temperature=0.8)
        generated = out_ids[0].tolist()
        decoded_text = tok.decode(generated)
        self.assertIsInstance(decoded_text, str)
        self.assertGreater(len(decoded_text), 0)

    def test_tester_script_runs_on_bpe_file(self):
        tok = BPETokenizer()
        tok.train(self.sample_corpus[:15_000], vocab_size=320)

        with tempfile.TemporaryDirectory() as tmpdir:
            bpe_path = os.path.join(tmpdir, "test_model_tokenizer.bpe")
            tok.save(bpe_path)
            result = test_tokenizer(bpe_path)
            self.assertTrue(result)


if __name__ == "__main__":
    unittest.main()
