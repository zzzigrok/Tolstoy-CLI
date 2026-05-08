"""
BPETokenizer v10 (Production-Grade) — Оптимизированная реализация с гарантией корректности.
Исправления и улучшения:
  1. Инкрементальные обновления с батчингом записей в кучу (меньше фантомов).
  2. Агрессивная очистка pair_counts от нулевых/отрицательных значений.
  3. O(N log N) инференс через связный список + min-heap (вместо O(N^2)).
  4. Полный набор unit-тестов для верификации.
  5. Улучшенная типизация и обработка ошибок.
"""
import heapq
import pickle

class RestrictedUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        raise pickle.UnpicklingError(f"Global '{module}.{name}' is forbidden for security reasons")

def safe_pickle_load(file):
    return RestrictedUnpickler(file).load()

import pickle
import re
import unittest
from collections import Counter, defaultdict
from typing import Dict, Iterable, List, Optional, Tuple

# -----------------------------------------------------------------------------
# Pre-tokenization regex (GPT-2 / CLIP style adapted for Cyrillic)
# -----------------------------------------------------------------------------
RU_PATTERN = re.compile(
    r""" ?[а-яА-ЯёЁa-zA-Z]+-[а-яА-ЯёЁa-zA-Z]+| ?\w+| ?[^\s\w]+|\s+(?!\S)|\s+"""
)


class BPETokenizer:
    VERSION = 10

    def __init__(self) -> None:
        self.merges: Dict[Tuple[int, int], int] = {}
        self.vocab: Dict[int, bytes] = {i: bytes([i]) for i in range(256)}

    # -------------------------------------------------------------------------
    # Training
    # -------------------------------------------------------------------------
    def train(
        self,
        text: str,
        vocab_size: int,
        progress_bar=None,
        n_workers: Optional[int] = None,
    ) -> List[int]:
        """
        Жадное обучение BPE с инкрементальными дельтами, lazy heap и in-place
        связным массивом.  Сложность: O(N log M) где N — уникальные фрагменты,
        M — размер словаря.
        """
        if vocab_size < 256:
            raise ValueError("vocab_size must be >= 256")
        if not text:
            return []

        # 1. Дедупликация через Counter (закон Хипса) — finditer для экономии памяти
        word_counts: Counter = Counter()
        for m in RU_PATTERN.finditer(text):
            word_counts[m.group()] += 1

        # 2. Плоские массивы (linked array)
        tokens: List[int] = []
        prev_idx: List[int] = []
        next_idx: List[int] = []
        counts: List[int] = []

        pair_counts: Dict[Tuple[int, int], int] = {}
        pair_to_positions: Dict[Tuple[int, int], List[int]] = defaultdict(list)

        pos = 0
        for word, count in word_counts.items():
            byte_ids = word.encode("utf-8")
            n = len(byte_ids)
            for i, b in enumerate(byte_ids):
                tokens.append(b)
                prev_idx.append(pos - 1 if i > 0 else -1)
                next_idx.append(pos + 1 if i < n - 1 else -1)
                counts.append(count)

                if i > 0:
                    pair = (byte_ids[i - 1], b)
                    pair_counts[pair] = pair_counts.get(pair, 0) + count
                    pair_to_positions[pair].append(pos - 1)
                pos += 1

        # 3. Lazy Priority Queue (max-heap через инвертированные частоты)
        heap = [(-freq, pair) for pair, freq in pair_counts.items()]
        heapq.heapify(heap)

        num_merges = vocab_size - 256
        for i in range(num_merges):
            best_pair = None
            best_freq = 0

            # Извлечь валидный максимум, отбросив фантомы
            while heap:
                neg_freq, pair = heapq.heappop(heap)
                actual = pair_counts.get(pair, 0)
                if actual == 0:
                    # Чистим висячий индекс, если есть
                    pair_to_positions.pop(pair, None)
                    continue
                if actual == -neg_freq:
                    best_pair = pair
                    best_freq = actual
                    break
                # Устаревшая частота — перепушиваем актуальную
                heapq.heappush(heap, (-actual, pair))

            if best_pair is None:
                break

            new_id = 256 + i
            self.merges[best_pair] = new_id
            self.vocab[new_id] = self.vocab[best_pair[0]] + self.vocab[best_pair[1]]

            # 4. In-place слияние с дельтами
            positions = pair_to_positions.pop(best_pair, [])
            new_pairs_created: set = set()

            for p1 in positions:
                p2 = next_idx[p1]
                if p2 == -1:
                    continue

                # Защита от перекрытия / уже мёртвой позиции
                if tokens[p1] != best_pair[0] or tokens[p2] != best_pair[1]:
                    continue

                word_count = counts[p1]

                # --- LOST: разорванные пары соседей ---
                prev_p = prev_idx[p1]
                if prev_p != -1:
                    lost = (tokens[prev_p], tokens[p1])
                    old_val = pair_counts.get(lost, 0)
                    if old_val:
                        new_val = old_val - word_count
                        if new_val > 0:
                            pair_counts[lost] = new_val
                        else:
                            del pair_counts[lost]
                            pair_to_positions.pop(lost, None)

                next_p = next_idx[p2]
                if next_p != -1:
                    lost = (tokens[p2], tokens[next_p])
                    old_val = pair_counts.get(lost, 0)
                    if old_val:
                        new_val = old_val - word_count
                        if new_val > 0:
                            pair_counts[lost] = new_val
                        else:
                            del pair_counts[lost]
                            pair_to_positions.pop(lost, None)

                # --- Мутация in-place ---
                tokens[p1] = new_id
                tokens[p2] = -1  # помечаем узел мёртвым
                next_idx[p1] = next_p
                if next_p != -1:
                    prev_idx[next_p] = p1

                # --- NEW: новые пары после слияния ---
                if prev_p != -1:
                    new_p = (tokens[prev_p], new_id)
                    pair_counts[new_p] = pair_counts.get(new_p, 0) + word_count
                    pair_to_positions[new_p].append(prev_p)
                    new_pairs_created.add(new_p)

                if next_p != -1:
                    new_p = (new_id, tokens[next_p])
                    pair_counts[new_p] = pair_counts.get(new_p, 0) + word_count
                    pair_to_positions[new_p].append(p1)
                    new_pairs_created.add(new_p)

            # Батчевый пуш новых пар (одна запись на пару, а не на позицию)
            for new_p in new_pairs_created:
                freq = pair_counts.get(new_p, 0)
                if freq:
                    heapq.heappush(heap, (-freq, new_p))

            # Удаляем обработанную пару из счётчиков
            pair_counts.pop(best_pair, None)

            if progress_bar and num_merges > 0 and i % max(1, num_merges // 100) == 0:
                progress_bar.progress(
                    (i + 1) / num_merges, text=f"BPE merge {i + 1}/{num_merges}"
                )

        return self.encode(text)

    # -------------------------------------------------------------------------
    # Inference
    # -------------------------------------------------------------------------
    def _encode_word(self, word: str) -> Tuple[int, ...]:
        """
        Кодирование одного слова за O(N log N) через связный список на массиве
        и min-heap по рангу слияния (ранг = new_id, чем меньше — тем раньше).
        """
        if not word:
            return ()

        tokens = list(word.encode("utf-8"))
        n = len(tokens)
        if n < 2:
            return tuple(tokens)

        merges = self.merges
        if not merges:
            return tuple(tokens)

        # Linked array: nxt / prv / alive
        nxt = list(range(1, n)) + [-1]
        prv = [-1] + list(range(n - 1))
        alive = [True] * n

        # Min-heap по рангу (чем меньше new_id, тем раньше применяем слияние)
        heap: List[Tuple[int, int]] = []
        for i in range(n - 1):
            rank = merges.get((tokens[i], tokens[i + 1]))
            if rank is not None:
                heapq.heappush(heap, (rank, i))

        while heap:
            rank, i = heapq.heappop(heap)
            if not alive[i]:
                continue
            j = nxt[i]
            if j == -1 or not alive[j]:
                continue

            # Валидация: не устарела ли запись?
            if merges.get((tokens[i], tokens[j])) != rank:
                continue

            new_id = rank

            # Слияние i и j
            tokens[i] = new_id
            alive[j] = False

            # Обновление связей
            right = nxt[j]
            nxt[i] = right
            if right != -1:
                prv[right] = i

            # Новая пара слева
            left = prv[i]
            if left != -1:
                new_rank = merges.get((tokens[left], new_id))
                if new_rank is not None:
                    heapq.heappush(heap, (new_rank, left))

            # Новая пара справа
            if right != -1:
                new_rank = merges.get((new_id, tokens[right]))
                if new_rank is not None:
                    heapq.heappush(heap, (new_rank, i))

        # Сборка результата
        result: List[int] = []
        idx = 0
        while idx != -1:
            if alive[idx]:
                result.append(tokens[idx])
            idx = nxt[idx]
        return tuple(result)

    def encode(
        self,
        text: str,
        progress_bar=None,
        logger=None,
        use_parallel: bool = False,
    ) -> List[int]:
        """Кодирование текста с предварительной токенизацией."""
        if logger:
            logger("[SYS] BPE encode (word-level)")
        if not text:
            return []

        parts = [self._encode_word(m.group()) for m in RU_PATTERN.finditer(text)]
        tokens = [t for sub in parts for t in sub]

        if progress_bar:
            progress_bar.progress(1.0, text="Токенизация: 100%")
        return tokens

    def decode(self, ids: Iterable[int]) -> str:
        """Декодирование ID в строку."""
        arr = bytearray()
        extend = arr.extend
        vocab = self.vocab
        for idx in ids:
            if idx in vocab:
                extend(vocab[idx])
        return arr.decode("utf-8", errors="replace")

    # -------------------------------------------------------------------------
    # Persistence
    # -------------------------------------------------------------------------
    def save(self, filepath: str) -> None:
        with open(filepath, "wb") as f:
            pickle.dump(
                {
                    "merges": self.merges,
                    "vocab": self.vocab,
                    "version": self.VERSION,
                },
                f,
            )

    @classmethod
    def load(cls, filepath: str) -> "BPETokenizer":
        with open(filepath, "rb") as f:
            data = safe_pickle_load(f)

        tokenizer = cls()
        tokenizer.merges = data.get("merges", {})
        # Базовый словарь 256 байтов восстанавливаем принудительно
        tokenizer.vocab = {i: bytes([i]) for i in range(256)}
        tokenizer.vocab.update(data.get("vocab", {}))
        return tokenizer


# =============================================================================
# UNIT TESTS — строгая верификация корректности
# =============================================================================
class TestBPETokenizer(unittest.TestCase):
    def test_roundtrip_simple(self):
        text = "aaabdaaabac"
        tok = BPETokenizer()
        tok.train(text, vocab_size=260)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_roundtrip_cyrillic(self):
        text = "Привет, мир! Это тест."
        tok = BPETokenizer()
        tok.train(text, vocab_size=300)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_overlapping_pairs_aaaa(self):
        """Перекрывающиеся пары: 'aaaa' -> 'aa'+'aa' -> 'aaaa'."""
        text = "aaaa"
        tok = BPETokenizer()
        tok.train(text, vocab_size=258)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_repeated_pattern_ababab(self):
        text = "abababababab"
        tok = BPETokenizer()
        tok.train(text, vocab_size=260)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_hyphenated_word(self):
        text = "state-of-the-art"
        tok = BPETokenizer()
        tok.train(text, vocab_size=260)
        self.assertEqual(tok.decode(tok.encode(text)), text)

    def test_save_load_identity(self):
        import os
        import tempfile

        text = "hello world, this is a test."
        tok1 = BPETokenizer()
        tok1.train(text, vocab_size=260)
        enc1 = tok1.encode(text)

        fd, path = tempfile.mkstemp(suffix=".pkl")
        os.close(fd)
        try:
            tok1.save(path)
            tok2 = BPETokenizer.load(path)
            enc2 = tok2.encode(text)
            self.assertEqual(enc1, enc2)
            self.assertEqual(tok2.decode(enc2), text)
        finally:
            os.unlink(path)

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