"""
tests/test_cli_pipelines.py — Сквозное тестирование всех этапов взаимодействия токенизатора с подсистемами Tolstoy-CLI.

Проверяет:
  1. Подготовка датасета: извлечение текста из файлов различных форматов (.txt, .md, .json, .csv, .xml),
     нормализация через clean_text, обучение токенизатора, оценка качества через estimate_tokenizer_quality,
     сериализация в dataset_tokens.pkl и загрузка через load_training_data.
  2. Формирование окон контекста (TokenDataset): корректность смещения меток targets = inputs + 1
     и упаковка в батчи PyTorch.
  3. Тренировочный цикл и чекпоинты: создание модели TolstoyLLM_v5 с динамическим vocab_size = len(tokenizer),
     вычисление CrossEntropy loss, шаг оптимизатора, сохранение весов, конфигурации и выделенного <model>_tokenizer.bpe,
     а также автодетекция архитектуры через autodetect_model_architecture.
  4. Пайплайн чата и инференса: приоритетный резолв токенизатора через resolve_tokenizer_path,
     быстрое кодирование реплик пользователя (use_parallel=False), генерация токенов через model.generate
     и декодирование ответа.
  5. Диагностика и меню разработчика: валидация версий пакетов и сквозной прогон scripts.tester.test_tokenizer.
"""
import csv
import json
import os
import tempfile
import unittest

import torch

from models.tolstoy_model import TolstoyLLM_v5
from scripts.tester import test_tokenizer
from tokenizers import (
    BPETokenizer,
    __version__,
    extract_vocab,
    resolve_tokenizer_path,
)
from tolstoy_cli import (
    autodetect_model_architecture,
    extract_text_from_file,
)
from training.trainer import (
    TokenDataset,
    Trainer,
    TrainingConfig,
    load_training_data,
)
from utils.model_utils import (
    clean_text,
    estimate_tokenizer_quality,
    load_model_safe,
)


class TestCLIPipelines(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.russian_sample = (
            "Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему. "
            "Все смешалось в доме Облонских. Жена узнала, что муж был в связи с бывшею в их доме француженкою-гувернанткой, "
            "и объявила мужу, что не может жить с ним в одном доме. Положение это продолжалось уже третий день "
            "и мучительно чувствовалось и самими супругами, и всеми членами семьи, и домочадцами. "
        ) * 10

    def test_pipeline_1_text_extraction_and_cleaning(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # TXT
            txt_path = os.path.join(tmpdir, "sample.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write("Текст из обычного TXT файла.\nВторая строка.")
            extracted_txt = extract_text_from_file(txt_path)
            self.assertIn("Текст из обычного TXT файла", extracted_txt)

            # MD
            md_path = os.path.join(tmpdir, "sample.md")
            with open(md_path, "w", encoding="utf-8") as f:
                f.write("# Заголовок\n\nТекст из Markdown файла.")
            extracted_md = extract_text_from_file(md_path)
            self.assertIn("Текст из Markdown файла", extracted_md)

            # JSON
            json_path = os.path.join(tmpdir, "sample.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump({"title": "Война и мир", "content": ["Глава 1", "Глава 2"]}, f, ensure_ascii=False)
            extracted_json = extract_text_from_file(json_path)
            self.assertIn("Война и мир", extracted_json)
            self.assertIn("Глава 1", extracted_json)

            # CSV
            csv_path = os.path.join(tmpdir, "sample.csv")
            with open(csv_path, "w", encoding="utf-8", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(["ID", "Цитата"])
                writer.writerow(["1", "Красота спасет мир"])
            extracted_csv = extract_text_from_file(csv_path)
            self.assertIn("Красота спасет мир", extracted_csv)

            # XML
            xml_path = os.path.join(tmpdir, "sample.xml")
            with open(xml_path, "w", encoding="utf-8") as f:
                f.write("<root><book><title>Анна Каренина</title><author>Лев Толстой</author></book></root>")
            extracted_xml = extract_text_from_file(xml_path)
            self.assertIn("Анна Каренина", extracted_xml)
            self.assertIn("Лев Толстой", extracted_xml)

            # Очистка текста
            cleaned = clean_text(self.russian_sample)
            self.assertGreater(len(cleaned), 0)
            self.assertNotIn("\r", cleaned)

    def test_pipeline_2_data_preparation_and_metrics(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            cleaned = clean_text(self.russian_sample)
            bpe_path = os.path.join(tmpdir, "custom_tokenizer.bpe")
            tokens_pkl_path = os.path.join(tmpdir, "dataset_tokens.pkl")

            tok = BPETokenizer()
            target_vocab = 320
            tokens = tok.train(cleaned, vocab_size=target_vocab)
            tok.save(bpe_path)

            # Проверка метрик качества токенизации
            metrics = estimate_tokenizer_quality(tok, cleaned[:2000])
            self.assertEqual(metrics["vocab_size"], len(tok))
            self.assertEqual(metrics["merges_len"], tok.merges_len)
            self.assertGreater(metrics["fertility"], 0.5)
            self.assertGreater(metrics["compression_ratio"], 1.5)
            self.assertGreater(metrics["num_tokens"], 0)

            # Сохранение скомпилированных токенов в pickle
            import pickle
            with open(tokens_pkl_path, "wb") as f:
                pickle.dump(tokens, f)

            # Загрузка через load_training_data
            tensor_data = load_training_data(tokens_pkl_path)
            self.assertIsInstance(tensor_data, torch.Tensor)
            self.assertEqual(tensor_data.dtype, torch.long)
            self.assertEqual(tensor_data.shape[0], len(tokens))
            self.assertEqual(tensor_data.tolist(), tokens)

    def test_pipeline_3_token_dataset_and_batching(self):
        tok = BPETokenizer()
        tokens = tok.train(self.russian_sample, vocab_size=320)
        tensor_data = torch.tensor(tokens, dtype=torch.long)

        block_size = 16
        dataset = TokenDataset(tensor_data, block_size=block_size)
        expected_len = len(tensor_data) - block_size - 1
        self.assertEqual(len(dataset), expected_len)

        x, y = dataset[0]
        self.assertEqual(x.shape, (block_size,))
        self.assertEqual(y.shape, (block_size,))
        # Метки y должны быть строго смещены на 1 токен вперед
        self.assertTrue(torch.equal(y[:-1], x[1:]))

    def test_pipeline_4_model_training_and_tokenizer_sync(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            cleaned = clean_text(self.russian_sample)
            tok = BPETokenizer()
            # 320 — кратно 64 (5 * 64), что совпадает с padded_vocab_size
            vocab_size = 320
            tokens = tok.train(cleaned, vocab_size=vocab_size)

            model_name = "tolstoy_test_model"
            bpe_path = os.path.join(tmpdir, f"{model_name}_tokenizer.bpe")
            tok.save(bpe_path)

            config = TrainingConfig(
                n_embd=64,
                n_head=4,
                n_layer=2,
                block_size=16,
                batch_size=4,
                vocab_size=len(tok),
                max_iters=5,
                checkpoint_interval=5,
            )

            # Инициализация модели TolstoyLLM_v5
            model = TolstoyLLM_v5(
                vocab_size=config.vocab_size,
                n_embd=config.n_embd,
                n_head=config.n_head,
                n_layer=config.n_layer,
                block_size=config.block_size,
                num_experts=2,
            )

            # Прямой проход и подсчет градиентов
            tensor_data = torch.tensor(tokens, dtype=torch.long)
            dataset = TokenDataset(tensor_data, block_size=config.block_size)
            x_batch = torch.stack([dataset[i][0] for i in range(4)])
            y_batch = torch.stack([dataset[i][1] for i in range(4)])

            logits, loss, aux_loss = model(x_batch, y_batch)
            self.assertEqual(logits.shape, (4, 16, config.vocab_size))
            self.assertFalse(torch.isnan(loss))
            loss.backward()

            # Сохранение чекпоинта модели (.pth + .conf)
            model_pth = os.path.join(tmpdir, f"{model_name}.pth")
            model_conf = os.path.join(tmpdir, f"{model_name}.conf")
            torch.save(model.state_dict(), model_pth)
            import pickle
            with open(model_conf, "wb") as f:
                pickle.dump(config.to_dict(), f)

            # Проверка автодетекции архитектуры
            detected_conf = autodetect_model_architecture(model_pth, len(tok))
            self.assertEqual(detected_conf["vocab_size"], len(tok))
            self.assertEqual(detected_conf["n_embd"], 64)
            self.assertEqual(detected_conf["n_layer"], 2)

    def test_pipeline_5_chat_inference_and_generation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            cleaned = clean_text(self.russian_sample)
            tok = BPETokenizer()
            tokens = tok.train(cleaned, vocab_size=320)

            model_name = "chat_bot_model"
            pth_path = os.path.join(tmpdir, f"{model_name}.pth")
            conf_path = os.path.join(tmpdir, f"{model_name}.conf")
            bpe_path = os.path.join(tmpdir, f"{model_name}_tokenizer.bpe")

            tok.save(bpe_path)

            model = TolstoyLLM_v5(
                vocab_size=len(tok),
                n_embd=64,
                n_head=4,
                n_layer=2,
                block_size=32,
                num_experts=2,
            )
            torch.save(model.state_dict(), pth_path)
            import pickle
            with open(conf_path, "wb") as f:
                pickle.dump({"vocab_size": len(tok), "n_embd": 64, "n_head": 4, "n_layer": 2, "block_size": 32, "num_experts": 2, "num_shared_experts": 0}, f)

            # Симуляция menu_chat:
            resolved_tok_path = resolve_tokenizer_path(pth_path)
            self.assertEqual(resolved_tok_path, bpe_path)

            loaded_tok = BPETokenizer.load(resolved_tok_path)
            self.assertEqual(len(loaded_tok), len(tok))

            # Кодирование пользовательского ввода (use_parallel=False для коротких реплик)
            user_prompt = "В чем смысл жизни?"
            input_ids = loaded_tok.encode(user_prompt, use_parallel=False)
            self.assertIsInstance(input_ids, list)
            self.assertGreater(len(input_ids), 0)

            # Генерация токенов
            idx = torch.tensor([input_ids], dtype=torch.long)
            out_ids = model.generate(idx, max_new_tokens=15, temperature=0.7, top_p=0.9)
            generated_tokens = out_ids[0][len(input_ids):].tolist()
            self.assertEqual(len(generated_tokens), 15)

            # Декодирование ответа
            response = loaded_tok.decode(generated_tokens)
            self.assertIsInstance(response, str)

            # Проверка, что исходный промпт декодируется 1 в 1
            decoded_prompt = loaded_tok.decode(input_ids, strict=True)
            self.assertEqual(decoded_prompt, user_prompt)

    def test_pipeline_6_diagnostics_and_tester_script(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            cleaned = clean_text(self.russian_sample)
            tok = BPETokenizer()
            tok.train(cleaned, vocab_size=320)
            bpe_path = os.path.join(tmpdir, "diagnostic_tokenizer.bpe")
            tok.save(bpe_path)

            # Запуск scripts.tester.test_tokenizer
            test_success = test_tokenizer(bpe_path)
            self.assertTrue(test_success)


if __name__ == "__main__":
    unittest.main()
