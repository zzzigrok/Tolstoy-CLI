import os
import time
from tokenizers.bpe_tokenizer import BPETokenizer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

console = Console()

C_SUCCESS = "bold green"
C_ERROR = "bold red"
C_ACCENT = "bold cyan"
C_DIM = "dim"

def test_tokenizer(model_name="testt"):
    tokenizer_path = f"{model_name}_tokenizer.pkl"
    
    if not os.path.exists(tokenizer_path):
        console.print(f"[{C_ERROR}]❌ Файл {tokenizer_path} не найден![/]")
        return

    console.print(f"[{C_DIM}]🔄 Загрузка токенизатора из {tokenizer_path}...[/]")
    tokenizer = BPETokenizer.load(tokenizer_path)
    console.print(f"[{C_SUCCESS}]✅ Загружено. Размер словаря: {len(tokenizer.vocab)} токенов.[/]\n")

    # Общая таблица результатов (статусы тестов)
    summary_table = Table(box=box.ROUNDED, border_style=C_DIM)
    summary_table.add_column("Тест", style=f"{C_ACCENT}")
    summary_table.add_column("Статус", justify="center")
    summary_table.add_column("Детали", style="white")

    # --- ТЕСТ 1 ---
    test_text = "Съешь ещё этих мягких французских булок, да выпей чаю. 12345!"
    encoded = tokenizer.encode(test_text)
    decoded = tokenizer.decode(encoded)
    if test_text == decoded:
        summary_table.add_row("1. Базовая обратимость", f"[{C_SUCCESS}]ПРОЙДЕН[/]", "Текст восстановился на 100%")
    else:
        summary_table.add_row("1. Базовая обратимость", f"[{C_ERROR}]ПРОВАЛЕН[/]", "Текст поврежден при декодировании")

    # --- ТЕСТ 2 ---
    hard_text = "Hello world! Привет! 漢字 🤖🔥\nTab\tи пробелы."
    encoded_hard = tokenizer.encode(hard_text)
    decoded_hard = tokenizer.decode(encoded_hard)
    if hard_text == decoded_hard:
        summary_table.add_row("2. Мультиязычность & Эмодзи", f"[{C_SUCCESS}]ПРОЙДЕН[/]", "Китайский, Эмодзи и спецсимволы поддерживаются")
    else:
        summary_table.add_row("2. Мультиязычность & Эмодзи", f"[{C_ERROR}]ПРОВАЛЕН[/]", "Символы утеряны")

    console.print(Panel(summary_table, title="[bold white]Основные тесты движка[/]", border_style=C_ACCENT))
    console.print()

    # --- ТЕСТ 3: Визуализация слияний (Subwords) ---
    subwords_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Разделение сложных слов[/]")
    subwords_table.add_column("Исходное слово", style=f"{C_ACCENT}")
    subwords_table.add_column("Токены (Subwords)", style="yellow")
    subwords_table.add_column("Кол-во", justify="right")

    words_to_test = ["Непревзойденный", "водогрязелечебница", "ChatGPT", "Оптимизация", "нейросетевой"]
    for w in words_to_test:
        tokens = tokenizer.encode(w)
        # Decode individual tokens to see subwords
        subwords = [tokenizer.decode([t]) for t in tokens]
        subwords_str = " | ".join(subwords)
        subwords_table.add_row(w, subwords_str, str(len(tokens)))
    console.print(subwords_table)
    console.print()

    # --- ТЕСТ 4: Регистр ---
    case_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Чувствительность к регистру[/]")
    case_table.add_column("Вариант", style=f"{C_ACCENT}")
    case_table.add_column("Индексы токенов")
    case_table.add_column("Кол-во", justify="right")
    
    cases = ["привет", "Привет", "ПРИВЕТ", "привет,", "привет!"]
    for c in cases:
        tokens = tokenizer.encode(c)
        case_table.add_row(c, str(tokens), str(len(tokens)))
    console.print(case_table)
    console.print()

    # --- ТЕСТ 5: Метрики сжатия ---
    sample_text = (
        "Нейросети стремительно развиваются и требуют эффективных алгоритмов "
        "обработки естественного языка. Токенизация — первый шаг к пониманию смысла."
    )
    tokens = tokenizer.encode(sample_text)
    words = len(sample_text.split())
    bytes_len = len(sample_text.encode("utf-8"))
    
    metrics_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Метрики компрессии текста[/]")
    metrics_table.add_column("Метрика", style=f"{C_ACCENT}")
    metrics_table.add_column("Значение", style="bold white")
    metrics_table.add_column("Норма", style=C_DIM)
    
    metrics_table.add_row("Символов -> Байт", f"{len(sample_text)} -> {bytes_len}")
    metrics_table.add_row("Количество слов", str(words))
    metrics_table.add_row("Количество токенов", str(len(tokens)))
    
    fertility = len(tokens)/words
    comp_ratio = bytes_len/len(tokens)
    
    fert_color = C_SUCCESS if 1.0 <= fertility <= 2.5 else "yellow"
    comp_color = C_SUCCESS if comp_ratio >= 3.0 else "yellow"
    
    metrics_table.add_row("Фертильность", f"[{fert_color}]{fertility:.2f} токенов/слово[/]", "1.5 - 2.5")
    metrics_table.add_row("Коэфф. сжатия", f"[{comp_color}]{comp_ratio:.2f} байт/токен[/]", "> 3.0")
    console.print(metrics_table)
    console.print()

    # --- ТЕСТ 6: Бенчмарк ---
    big_text = sample_text * 1000
    start_enc = time.time()
    big_tokens = tokenizer.encode(big_text)
    enc_time = time.time() - start_enc
    
    start_dec = time.time()
    _ = tokenizer.decode(big_tokens)
    dec_time = time.time() - start_dec
    
    enc_speed = len(big_tokens) / enc_time if enc_time > 0 else 0
    
    perf_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Производительность (CPU)[/]")
    perf_table.add_column("Операция", style=f"{C_ACCENT}")
    perf_table.add_column("Размер данных", style="white")
    perf_table.add_column("Время", style="yellow")
    perf_table.add_column("Скорость", style="bold green")
    
    perf_table.add_row("Кодирование (encode)", f"{len(big_text):,} симв.", f"{enc_time:.4f} с", f"{enc_speed:,.0f} ток/сек")
    perf_table.add_row("Декодирование (decode)", f"{len(big_tokens):,} ток.", f"{dec_time:.4f} с", "-")
    console.print(perf_table)
    console.print()

    # --- ТЕСТ 7: Топ токенов ---
    vocab = tokenizer.vocab
    longest = sorted(vocab.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    
    top_table = Table(box=box.ROUNDED, border_style=C_DIM, title="[bold white]Топ-10 самых длинных выученных слов/фраз[/]")
    top_table.add_column("Токен ID", style="cyan", justify="right")
    top_table.add_column("Текст (Раскодированный)", style="white")
    top_table.add_column("Длина (байт)", style="yellow", justify="right")
    
    for idx, b_val in longest:
        try:
            text_val = b_val.decode('utf-8')
            text_val = text_val.replace('\n', '↵').replace('\r', '').replace('\t', '⇥')
        except UnicodeDecodeError:
            text_val = "<неполные UTF-8 байты>"
        
        # Экранируем квадратные скобки для корректного отображения в rich
        text_val = text_val.replace('[', '\\[').replace(']', '\\]')
        top_table.add_row(str(idx), f"'{text_val}'", str(len(b_val)))
        
    console.print(top_table)
    console.print(f"\n[{C_SUCCESS}]✅ Все тесты завершены успешно![/]\n")

if __name__ == "__main__":
    test_tokenizer("custom")