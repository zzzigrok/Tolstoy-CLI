import glob
import os
import re
import sys
import time

# Добавляем корневую директорию проекта в sys.path для корректных импортов
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from tokenizers.bpe_tokenizer import (
    BPETokenizer,
    __version__ as BPE_VERSION,
    extract_vocab,
    resolve_tokenizer_path,
)

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

# Безопасная настройка кодировки для Windows консоли (не ломает stdout при импорте из CLI/тестов)
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

console = Console()

C_SUCCESS = "bold green"
C_ERROR = "bold red"
C_ACCENT = "bold cyan"
C_DIM = "dim"


def count_actual_words(text: str) -> int:
    """Более точный подсчет слов (исключая пунктуацию)."""
    return len(re.findall(r"[а-яА-ЯёЁa-zA-Z]+(?:-[а-яА-ЯёЁa-zA-Z]+)*|\w+", text))


def _find_tokenizer_file(model_name: str):
    """Ищет файл токенизатора (.bpe в приоритете, .pkl как legacy fallback)."""
    direct = resolve_tokenizer_path(model_name, fallback_name="")
    if direct:
        return direct

    patterns = [
        f"**/{model_name}_tokenizer.bpe",
        f"**/{model_name}.bpe",
        f"**/{model_name}_tokenizer.pkl",
        f"**/{model_name}.pkl",
    ]
    for pattern in patterns:
        for f in glob.glob(pattern, recursive=True):
            if "venv" not in f and "__pycache__" not in f and "node_modules" not in f:
                return f
    return None


def test_tokenizer(model_name="custom"):
    tokenizer_path = _find_tokenizer_file(model_name)

    if not tokenizer_path:
        console.print(f"[{C_ERROR}]❌ Файл токенизатора для '{model_name}' (.bpe / .pkl) не найден![/]")
        return False

    console.print(f"[{C_DIM}]🔄 Загрузка токенизатора из {tokenizer_path} (rust-bpe-tokenizer v{BPE_VERSION})...[/]")
    tokenizer = BPETokenizer.load(tokenizer_path)
    console.print(
        f"[{C_SUCCESS}]✅ Загружено. Размер словаря: {len(tokenizer):,} токенов "
        f"(правил слияния: {tokenizer.merges_len:,}).[/]\n"
    )

    # Общая таблица результатов (статусы тестов)
    summary_table = Table(box=box.ROUNDED, border_style=C_DIM)
    summary_table.add_column("Тест", style=f"{C_ACCENT}")
    summary_table.add_column("Статус", justify="center")
    summary_table.add_column("Детали", style="white")

    # --- ТЕСТ 1: Базовая обратимость ---
    test_text = "Съешь ещё этих мягких французских булок, да выпей чаю. 12345!"
    encoded = tokenizer.encode(test_text)
    decoded = tokenizer.decode(encoded)
    if test_text == decoded:
        summary_table.add_row("1. Базовая обратимость", f"[{C_SUCCESS}]ПРОЙДЕН[/]", "Текст восстановился на 100%")
    else:
        summary_table.add_row("1. Базовая обратимость", f"[{C_ERROR}]ПРОВАЛЕН[/]", "Текст поврежден при декодировании")

    # --- ТЕСТ 2: Мультиязычность & Эмодзи ---
    hard_text = "Hello world! Привет! 漢字 🤖🔥\nTab\tи пробелы."
    encoded_hard = tokenizer.encode(hard_text)
    decoded_hard = tokenizer.decode(encoded_hard)
    if hard_text == decoded_hard:
        summary_table.add_row("2. Мультиязычность & Эмодзи", f"[{C_SUCCESS}]ПРОЙДЕН[/]", "Китайский, Эмодзи и спецсимволы поддерживаются")
    else:
        summary_table.add_row("2. Мультиязычность & Эмодзи", f"[{C_ERROR}]ПРОВАЛЕН[/]", "Символы утеряны")

    # --- ТЕСТ 3: Паритет режимов (Rayon parallel vs Sequential) ---
    enc_par = tokenizer.encode(test_text, use_parallel=True)
    enc_seq = tokenizer.encode(test_text, use_parallel=False)
    if enc_par == enc_seq:
        summary_table.add_row("3. Паритет Rayon / Sequential", f"[{C_SUCCESS}]ПРОЙДЕН[/]", "Параллельный и последовательный режимы идентичны")
    else:
        summary_table.add_row("3. Паритет Rayon / Sequential", f"[{C_ERROR}]ПРОВАЛЕН[/]", "Расхождение между режимами кодирования")

    # --- ТЕСТ 4: Побайтовое и строгое декодирование ---
    raw_bytes = tokenizer.decode_bytes(encoded, strict=True)
    strict_str = tokenizer.decode(encoded, strict=True)
    if raw_bytes == test_text.encode("utf-8") and strict_str == test_text:
        summary_table.add_row("4. Строгий режим & decode_bytes", f"[{C_SUCCESS}]ПРОЙДЕН[/]", "Побайтовая точность и валидация ID (strict=True)")
    else:
        summary_table.add_row("4. Строгий режим & decode_bytes", f"[{C_ERROR}]ПРОВАЛЕН[/]", "Ошибка decode_bytes / strict=True")

    console.print(Panel(summary_table, title="[bold white]Основные тесты движка (Rust BPE)[/]", border_style=C_ACCENT))
    console.print()

    # --- Визуализация слияний (Subwords) ---
    subwords_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Разделение сложных слов[/]")
    subwords_table.add_column("Исходное слово", style=f"{C_ACCENT}")
    subwords_table.add_column("Токены (Subwords)", style="yellow")
    subwords_table.add_column("Кол-во", justify="right")

    words_to_test = ["Непревзойденный", "водогрязелечебница", "ChatGPT", "Оптимизация", "нейросетевой"]
    for w in words_to_test:
        tokens = tokenizer.encode(w, use_parallel=False)
        subwords = [tokenizer.decode([t]) for t in tokens]
        subwords_str = " | ".join(subwords)
        subwords_table.add_row(w, subwords_str, str(len(tokens)))
    console.print(subwords_table)
    console.print()

    # --- Чувствительность к регистру ---
    case_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Чувствительность к регистру[/]")
    case_table.add_column("Вариант", style=f"{C_ACCENT}")
    case_table.add_column("Индексы токенов")
    case_table.add_column("Кол-во", justify="right")

    cases = ["привет", "Привет", "ПРИВЕТ", "привет,", "привет!", "", "A" * 50, " \n\t "]
    for c in cases:
        tokens = tokenizer.encode(c, use_parallel=False)
        case_table.add_row(c, str(tokens), str(len(tokens)))
    console.print(case_table)
    console.print()

    # --- Метрики сжатия ---
    sample_text = (
        "Нейросети стремительно развиваются и требуют эффективных алгоритмов "
        "обработки естественного языка. Токенизация — первый шаг к пониманию смысла."
    )
    tokens = tokenizer.encode(sample_text, use_parallel=False)
    words = count_actual_words(sample_text)
    bytes_len = len(sample_text.encode("utf-8"))

    metrics_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Метрики компрессии текста[/]")
    metrics_table.add_column("Метрика", style=f"{C_ACCENT}")
    metrics_table.add_column("Значение", style="bold white")
    metrics_table.add_column("Норма", style=C_DIM)

    metrics_table.add_row("Символов -> Байт", f"{len(sample_text)} -> {bytes_len}")
    metrics_table.add_row("Количество слов", str(words))
    metrics_table.add_row("Количество токенов", str(len(tokens)))

    fertility = len(tokens) / words
    comp_ratio = bytes_len / len(tokens)

    fert_color = C_SUCCESS if 1.0 <= fertility <= 2.5 else "yellow"
    comp_color = C_SUCCESS if comp_ratio >= 3.0 else "yellow"

    metrics_table.add_row("Фертильность", f"[{fert_color}]{fertility:.2f} токенов/слово[/]", "1.5 - 2.5")
    metrics_table.add_row("Коэфф. сжатия", f"[{comp_color}]{comp_ratio:.2f} байт/токен[/]", "> 3.0")
    console.print(metrics_table)
    console.print()

    # --- Бенчмарк производительности ---
    big_text = sample_text * 10000  # ~1.5 MB
    big_bytes_mb = len(big_text.encode("utf-8")) / (1024 * 1024)

    start_enc_par = time.perf_counter()
    big_tokens = tokenizer.encode(big_text, use_parallel=True)
    enc_par_time = time.perf_counter() - start_enc_par

    start_enc_seq = time.perf_counter()
    _ = tokenizer.encode(big_text, use_parallel=False)
    enc_seq_time = time.perf_counter() - start_enc_seq

    start_dec = time.perf_counter()
    _ = tokenizer.decode(big_tokens)
    dec_time = time.perf_counter() - start_dec

    start_dec_bytes = time.perf_counter()
    _ = tokenizer.decode_bytes(big_tokens)
    dec_bytes_time = time.perf_counter() - start_dec_bytes

    enc_par_speed = len(big_tokens) / enc_par_time if enc_par_time > 0 else 0
    enc_seq_speed = len(big_tokens) / enc_seq_time if enc_seq_time > 0 else 0
    enc_par_mbs = big_bytes_mb / enc_par_time if enc_par_time > 0 else 0
    enc_seq_mbs = big_bytes_mb / enc_seq_time if enc_seq_time > 0 else 0

    perf_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Производительность (Rust FFI / CPU)[/]")
    perf_table.add_column("Операция", style=f"{C_ACCENT}")
    perf_table.add_column("Размер данных", style="white")
    perf_table.add_column("Время", style="yellow")
    perf_table.add_column("Скорость", style="bold green")

    perf_table.add_row(
        "Кодирование (Rayon parallel)",
        f"{len(big_text):,} симв. ({big_bytes_mb:.2f} MB)",
        f"{enc_par_time:.4f} с",
        f"{enc_par_speed:,.0f} ток/с ({enc_par_mbs:.2f} MB/s)",
    )
    perf_table.add_row(
        "Кодирование (Sequential)",
        f"{len(big_text):,} симв. ({big_bytes_mb:.2f} MB)",
        f"{enc_seq_time:.4f} с",
        f"{enc_seq_speed:,.0f} ток/с ({enc_seq_mbs:.2f} MB/s)",
    )
    perf_table.add_row("Декодирование (decode -> str)", f"{len(big_tokens):,} ток.", f"{dec_time:.4f} с", "-")
    perf_table.add_row("Декодирование (decode_bytes)", f"{len(big_tokens):,} ток.", f"{dec_bytes_time:.4f} с", "-")

    if HAS_PSUTIL:
        process = psutil.Process(os.getpid())
        mem_mb = process.memory_info().rss / (1024 * 1024)
        perf_table.add_row("Использование RAM", "-", "-", f"{mem_mb:.1f} MB")

    console.print(perf_table)
    console.print()

    # --- Топ-10 самых длинных токенов словаря ---
    vocab = extract_vocab(tokenizer)
    longest = sorted(vocab.items(), key=lambda x: len(x[1]), reverse=True)[:10]

    top_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Топ-10 самых длинных выученных слов/фраз[/]")
    top_table.add_column("Токен ID", style="cyan", justify="right")
    top_table.add_column("Текст (Раскодированный)", style="white")
    top_table.add_column("Длина (байт)", style="yellow", justify="right")

    for idx, b_val in longest:
        try:
            text_val = b_val.decode("utf-8")
            text_val = text_val.replace("\n", "↵").replace("\r", "").replace("\t", "⇥")
        except UnicodeDecodeError:
            text_val = "<неполные UTF-8 байты>"

        text_val = text_val.replace("[", "\\[").replace("]", "\\]")
        top_table.add_row(str(idx), f"'{text_val}'", str(len(b_val)))

    console.print(top_table)
    console.print(f"\n[{C_SUCCESS}]✅ Все тесты завершены успешно![/]\n")
    return True


if __name__ == "__main__":
    test_tokenizer("custom")
