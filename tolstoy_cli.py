"""
Tolstoy CLI v7 — Интерактивный интерфейс с поддержкой новых оптимизаций

Новые возможности:
- Автоопределение XQuant KV-cache режима
- Поддержка Speculative Decoding в генерации
- Интеграция GaLore / 8-bit Adam в обучении
- Визуализация метрик токенизатора (fertility, compression)
- Пресет 'xlarge' для 24GB+ GPU
"""
import os
import glob
import torch
import pickle
import logging
import shutil
import random
import json
import xml.etree.ElementTree as ET
import csv
from time import sleep
import sys
import html
import types

if 'cgi' not in sys.modules:
    mock_cgi = types.ModuleType('cgi')
    mock_cgi.escape = html.escape
    sys.modules['cgi'] = mock_cgi

if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

try:
    import corus
    CORUS_AVAILABLE = True
except ImportError as e:
    CORUS_AVAILABLE = False

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

SUPPORTED_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.xml']
if PDF_AVAILABLE: SUPPORTED_EXTENSIONS.append('.pdf')
if DOCX_AVAILABLE: SUPPORTED_EXTENSIONS.append('.docx')

CORUS_DATASETS = {
    "1": ("Lenta.ru", "load_lenta", "~200 MB", "Micro / Mini"),
    "2": ("Lenta.ru v2", "load_lenta2", "~1.5 GB", "Mini / Base"),
    "3": ("Russian News", "load_news", "~1.5 GB", "Mini / Base"),
    "4": ("Wikipedia (ru)", "load_wiki", "~5.0+ GB", "Base / Large"),
    "5": ("Taiga: Fontanka", "load_taiga_fontanka", "~200 MB", "Micro"),
    "6": ("Taiga: Lenta", "load_taiga_lenta", "~300 MB", "Micro / Mini"),
    "7": ("Taiga: Social", "load_taiga_social", "~5.0 GB", "Base / Large"),
    "8": ("Taiga: Proza", "load_taiga_proza", "~2.0 GB", "Mini / Base"),
    "9": ("Taiga: Stihi", "load_taiga_stihi", "~500 MB", "Mini"),
    "10": ("Taiga: Subtitles", "load_taiga_subtitles", "~1.0 GB", "Mini / Base"),
    "11": ("Taiga: Magazines", "load_taiga_magazines", "~200 MB", "Micro"),
    "12": ("Taiga: News", "load_taiga_news", "~1.5 GB", "Mini / Base"),
    "13": ("Taiga: Arzamas", "load_taiga_arzamas", "~50 MB", "Nano"),
    "14": ("Taiga: Nplus1", "load_taiga_nplus1", "~50 MB", "Nano"),
    "15": ("Taiga: Haker", "load_taiga_haker", "~50 MB", "Nano"),
    "16": ("Taiga: Geektimes", "load_taiga_geektimes", "~100 MB", "Nano / Micro"),
    "17": ("Taiga: Habr", "load_taiga_habr", "~500 MB", "Mini"),
    "18": ("Pikabu", "load_pikabu", "~1.0 GB", "Mini / Base"),
    "19": ("Habr", "load_habr", "~1.5 GB", "Mini / Base"),
    "20": ("Buriy News", "load_buriy_news", "~2.0 GB", "Mini / Base"),
    "21": ("Buriy Webhose", "load_buriy_webhose", "~10+ GB", "Base / Large")
}

logging.getLogger("TolstoyTrainer").setLevel(logging.ERROR)

from models.tolstoy_model import TolstoyLLM_v5
from tokenizers.bpe_tokenizer import BPETokenizer
from training.trainer import Trainer, TrainingConfig
from utils.model_utils import clean_text, get_effective_config, load_model_safe, estimate_tokenizer_quality
from utils.device import get_optimal_device, get_system_stats, check_flash_attention, optimize_cpu_threads

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, IntPrompt, Confirm
from rich.table import Table
from rich import box
from rich.align import Align
from rich.live import Live
from rich.rule import Rule
from rich.text import Text
from rich.markup import escape
from rich.progress import (
    Progress, TextColumn, BarColumn, TaskProgressColumn,
    TimeRemainingColumn, SpinnerColumn, MofNCompleteColumn, TimeElapsedColumn
)

console = Console()

C_ACCENT = "#00e5ff"
C_MODEL = "#ff2a6d"
C_USER = "#05d9e8"
C_SUCCESS = "#01ffc3"
C_WARN = "#ffb300"
C_DIM = "#6b7d85"
C_PURPLE = "#b388ff"
C_GOLD = "#ffd700"
C_ERROR = "#ff1744"

BANNER_LINES = [
    f"[{C_ACCENT}] ▄▄▄█████▓ ▒█████   ██▓     ██████ ▄▄▄█████▓ ▒█████ ▓██   ██▓[/]",
    f"[{C_USER}] ▓  ██▒ ▓▒▒██▒  ██▒▓██▒   ▒██    ▒ ▓  ██▒ ▓▒▒██▒  ██▒▒██  ██▒[/]",
    f"[{C_ACCENT}] ▒ ▓██░ ▒░▒██░  ██▒▒██░   ░ ▓██▄   ▒ ▓██░ ▒░▒██░  ██▒ ▒██ ██░[/]",
    f"[{C_USER}] ░ ▓██▓ ░ ▒██   ██░▒██░     ▒   ██▒░ ▓██▓ ░ ▒██   ██░ ░ ▐██▓░[/]",
    f"[{C_ACCENT}]   ▒██▒ ░ ░ ████▓▒░░██████▒▒██████▒▒ ▒██▒ ░ ░ ████▓▒░ ░ ██▒▓░[/]",
    f"[{C_USER}]   ▒ ░░   ░ ▒░▒░▒░ ░ ▒░▓  ░▒ ▒▓▒ ▒ ░ ▒ ░░   ░ ▒░▒░▒░   ██▒▒▒ [/]",
    "",
    f"[bold white]A I   S T U D I O[/]  [{C_DIM}]━━━[/]  [bold {C_GOLD}]P R O   E D I T I O N[/]",
    f"[{C_DIM}]══════════════ v8.0.0 ══════════════[/]",
]

def print_banner(animate=False):
    console.clear()
    title_text = f"[bold {C_GOLD}] ⚡ XQuant • GaLore • Trie [/]"
    sub_text = f"[italic {C_DIM}]Powered by TolstoyLLM_v5 ✦ torch {torch.__version__}[/]"
    if animate:
        with Live(refresh_per_second=15, transient=False) as live:
            for i in range(len(BANNER_LINES)):
                current_lines = BANNER_LINES[:i+1] + [""] * (len(BANNER_LINES) - i - 1)
                display_text = "\n".join(current_lines)
                panel = Panel(
                    Align.center(display_text), box=box.DOUBLE_EDGE, border_style=C_ACCENT,
                    padding=(1, 5), title=title_text, subtitle=sub_text
                )
                live.update(panel)
                sleep(0.10)
    else:
        full_text = "\n".join(BANNER_LINES)
        panel = Panel(
            Align.center(full_text), box=box.DOUBLE_EDGE, border_style=C_ACCENT,
            padding=(1, 5), title=title_text, subtitle=sub_text
        )
        console.print(panel)

def print_section(title, icon, color=None):
    c = color or C_ACCENT
    console.print()
    console.print(Rule(f"[bold {c}] {icon} {title} [/]", style=c, characters="━"))
    console.print()

def print_step(msg):
    console.print(f"  [{C_SUCCESS}]●[/] [white]{msg}[/]")

def print_warn(msg):
    console.print(f"  [{C_WARN}]▲ ВНИМАНИЕ[/] [{C_WARN}]{msg}[/]")

def print_info(msg):
    console.print(f"  [{C_DIM}]◦ {msg}[/]")

def extract_text_from_file(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    text = ""
    try:
        if ext in ['.txt', '.md']:
            try:
                with open(filepath, 'r', encoding='utf-8') as f: text = f.read()
            except UnicodeDecodeError:
                with open(filepath, 'r', encoding='cp1251') as f: text = f.read()
        elif ext == '.json':
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                text_parts = []
                def extract_strings(obj):
                    if isinstance(obj, dict):
                        for v in obj.values(): extract_strings(v)
                    elif isinstance(obj, list):
                        for item in obj: extract_strings(item)
                    elif isinstance(obj, str):
                        text_parts.append(obj)
                extract_strings(data)
                text = "\n\n".join(text_parts)
        elif ext == '.csv':
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    text = "\n".join([" ".join(row) for row in reader])
            except UnicodeDecodeError:
                with open(filepath, 'r', encoding='cp1251') as f:
                    reader = csv.reader(f)
                    text = "\n".join([" ".join(row) for row in reader])
        elif ext == '.pdf' and PDF_AVAILABLE:
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text: text += page_text + "\n"
        elif ext == '.docx' and DOCX_AVAILABLE:
            doc = docx.Document(filepath)
            text = "\n".join([p.text for p in doc.paragraphs])
        # === ДОБАВЛЕННЫЙ БЛОК ДЛЯ XML ===
        elif ext == '.xml':
            try:
                tree = ET.parse(filepath)
                root = tree.getroot()
                text_parts = []
                # Проходим по всем узлам (тегам) дерева XML
                for elem in root.iter():
                    if elem.text and elem.text.strip():
                        text_parts.append(elem.text.strip())
                text = "\n\n".join(text_parts)
            except Exception as e:
                print_warn(f"Ошибка при разборе XML {escape(os.path.basename(filepath))}: {escape(str(e))}")
    except Exception as e:
        print_warn(f"Ошибка при чтении {escape(os.path.basename(filepath))}: {escape(str(e))}")
    return text + "\n\n"

def interactive_file_selector(prompt_title, extensions, icon="📄"):
    files = []
    for ext in extensions:
        found = glob.glob(f"**/*{ext}", recursive=True)
        files.extend([f for f in found if "venv" not in f and "__pycache__" not in f])
    if not files:
        console.print(f"[{C_DIM}]Файлы формата {', '.join(extensions)} не найдены.[/]")
        return Prompt.ask(f"[{C_ACCENT}]{prompt_title} (введите путь вручную)[/]")
    table = Table(box=box.ROUNDED, border_style=C_DIM, header_style=f"bold {C_ACCENT}", padding=(0, 1))
    table.add_column("№", justify="center", style=f"bold {C_GOLD}", width=4)
    table.add_column(f"{icon} Файл", style="bold white", ratio=1)
    table.add_column("Размер", justify="right", style=f"{C_DIM}")
    for i, file_path in enumerate(files, 1):
        size_kb = os.path.getsize(file_path) / 1024
        display_path = file_path if len(file_path) <= 60 else "..." + file_path[-57:]
        table.add_row(str(i), escape(display_path), f"{size_kb:.1f} KB")
    table.add_row("0", f"[{C_DIM}]Ввести путь вручную...[/]", "")
    console.print(f"\n[bold white]{prompt_title}[/bold white]")
    console.print(table)
    choices = [str(x) for x in range(len(files) + 1)]
    choice = Prompt.ask(f"[bold {C_ACCENT}]❯ Выбор[/]", choices=choices, default="1" if files else "0")
    if choice == "0":
        return Prompt.ask(f"[{C_ACCENT}]Введите точный путь к файлу[/]")
    return files[int(choice) - 1]

def autodetect_model_architecture(model_path, tokenizer_vocab_size):
    conf = {}
    config_path = model_path.replace('.pth', '.conf')
    if os.path.exists(config_path):
        try:
            with open(config_path, 'rb') as f: conf = pickle.load(f)
        except Exception: pass
    try:
        sd = torch.load(model_path, map_location='cpu', weights_only=True)
        clean_keys = {k.replace('_orig_mod.', ''): k for k in sd.keys()}
        if 'tok_embeddings.weight' in clean_keys:
            emb_shape = sd[clean_keys['tok_embeddings.weight']].shape
            conf['vocab_size'] = emb_shape[0]
            conf['n_embd'] = emb_shape[1]
        layer_indices = [int(k.split('.')[1]) for k in clean_keys.keys() if k.startswith('layers.') and k.split('.')[1].isdigit()]
        if layer_indices: conf['n_layer'] = max(layer_indices) + 1
        router_key = 'layers.0.feed_forward.router.weight'
        if router_key in clean_keys: conf['num_experts'] = sd[clean_keys[router_key]].shape[0]
        # Check for speculative head
        if any('speculative_head' in k for k in clean_keys):
            conf['use_speculative'] = True
    except Exception as e:
        console.print(f"[dim yellow]⚠ Ошибка сканирования тензоров: {escape(str(e))}[/]")
    conf.setdefault('n_embd', 256)
    conf.setdefault('n_layer', 4)
    conf.setdefault('n_head', 8)
    conf.setdefault('block_size', 512)
    conf.setdefault('num_experts', 8)
    conf.setdefault('num_shared_experts', 0)
    conf.setdefault('vocab_size', tokenizer_vocab_size)
    conf.setdefault('use_speculative', False)
    conf.setdefault('kv_cache_mode', 'int8kv')
    return conf

def animated_bot_response(text):
    current_text = ""
    words = text.split(" ")
    bot_title = f"[bold {C_GOLD}]🤖 Толстой[/]"
    with Live(
        Panel("", title=bot_title, title_align="left", border_style=C_MODEL, box=box.ROUNDED, width=80, padding=(0, 2)),
        refresh_per_second=30, transient=False
    ) as live:
        for i, word in enumerate(words):
            chunk = word if i == 0 else " " + word
            for char in chunk:
                current_text += char
                live.update(Panel(f"[white]{escape(current_text)}[/]", title=bot_title, title_align="left", border_style=C_MODEL, box=box.ROUNDED, width=80, padding=(0, 2)))
                sleep(random.uniform(0.004, 0.018))
            sleep(random.uniform(0.02, 0.06))

# ==========================================
# 1. МЕНЮ ПОДГОТОВКИ ДАТАСЕТА
# ==========================================
def menu_prepare_data():
    print_section("ПОДГОТОВКА ДАТАСЕТА", "📚", C_USER)
    console.print("\n[bold white]Выберите источник данных:[/bold white]")
    console.print(f"  [{C_ACCENT}][1][/] Одиночный файл ({', '.join(SUPPORTED_EXTENSIONS)})")
    console.print(f"  [{C_ACCENT}][2][/] Папка с файлами (Собрать в один датасет)")
    if CORUS_AVAILABLE:
        console.print(f"  [{C_ACCENT}][3][/] Архив датасета через Corus (Lenta, Wiki, Taiga и др.)")
    else:
        console.print(f"  [{C_DIM}][3] Архив датасета через Corus (недоступно, установите: pip install corus)[/]")
    source_choice = Prompt.ask(f"\n[{C_ACCENT}]❯ Выбор источника[/]", choices=["1", "2", "3"] if CORUS_AVAILABLE else ["1", "2"], default="1")
    raw_text = ""
    if source_choice == "1":
        input_file = interactive_file_selector("Выберите файл для обучения:", SUPPORTED_EXTENSIONS, icon="📝")
        if not os.path.exists(input_file): return
        with console.status(f"[bold {C_ACCENT}]Чтение и извлечение текста...[/]"):
            raw_text = extract_text_from_file(input_file)
    elif source_choice == "2":
        console.print(f"\n[{C_DIM}]Будут найдены и объединены все файлы форматов: {', '.join(SUPPORTED_EXTENSIONS)}[/]")
        target_dir = Prompt.ask(f"[{C_ACCENT}]Введите путь к папке с файлами[/]", default="./")
        if not os.path.isdir(target_dir):
            print_warn("Указанная директория не существует!"); sleep(2); return
        files_to_parse = []
        for ext in SUPPORTED_EXTENSIONS:
            found = glob.glob(os.path.join(target_dir, f"**/*{ext}"), recursive=True)
            files_to_parse.extend([f for f in found if "venv" not in f and "__pycache__" not in f])
        if not files_to_parse:
            print_warn(f"В папке {target_dir} не найдено подходящих файлов!"); sleep(2); return
        print_step(f"Найдено файлов для сборки: [bold white]{len(files_to_parse)}[/bold white]")
        with Progress(
            SpinnerColumn(spinner_name="dots"),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(style=C_DIM, complete_style=C_ACCENT),
            MofNCompleteColumn(),
            console=console
        ) as progress:
            task = progress.add_task(f"[{C_ACCENT}]Извлечение текста...[/]", total=len(files_to_parse))
            for file_path in files_to_parse:
                progress.update(task, description=f"[{C_ACCENT}]Чтение: {escape(os.path.basename(file_path)[:20])}[/]")
                raw_text += extract_text_from_file(file_path)
                progress.advance(task)
    elif source_choice == "3":
        table = Table(box=box.ROUNDED, border_style=C_DIM, header_style=f"bold {C_ACCENT}")
        table.add_column("ID", justify="center", style="bold yellow")
        table.add_column("Название датасета", style="bold white")
        table.add_column("Объем текста", justify="right", style="cyan")
        table.add_column("Конфиг модели", justify="center", style="green")
        for d_id, (d_name, _, d_size, d_config) in CORUS_DATASETS.items():
            table.add_row(d_id, d_name, d_size, d_config)
        console.print(table)
        dataset_id = Prompt.ask(f"[{C_ACCENT}]Выберите ID датасета[/]", choices=list(CORUS_DATASETS.keys()), default="1")
        dataset_name, corus_func_name, _, _ = CORUS_DATASETS[dataset_id]
        archive_path = interactive_file_selector(f"Выберите архив для {dataset_name}:", ['.gz', '.bz2', '.tar', '.csv', '.corus'], icon="📦")
        if not os.path.exists(archive_path): return
        max_records = IntPrompt.ask(f"[{C_ACCENT}]Максимум записей для загрузки (0 - загрузить всё)[/]", default=50000)
        with console.status(f"[bold {C_ACCENT}]Извлечение текстов ({dataset_name})...[/]"):
            try:
                load_func = getattr(corus, corus_func_name)
                records = load_func(archive_path)
                texts = []
                for i, record in enumerate(records):
                    if max_records > 0 and i >= max_records: break
                    text = getattr(record, 'text', None)
                    if not text:
                        title = getattr(record, 'title', '')
                        body = getattr(record, 'body', '')
                        text = f"{title}\n{body}".strip()
                    if text: texts.append(text)
                raw_text = "\n\n".join(texts)
                print_step(f"Успешно извлечено {len(texts):,} записей.")
            except Exception as e:
                print_warn(f"Ошибка при чтении архива Corus: {escape(str(e))}"); sleep(2); return

    with console.status(f"[bold {C_ACCENT}]Очистка шума и нормализация...[/]"):
        cleaned_text = clean_text(raw_text)
        sleep(0.5)
    num_chars = len(cleaned_text)
    print_step(f"Датасет готов. Полезный объем: [bold]{num_chars:,}[/bold] символов.")
    if num_chars == 0:
        print_warn("Собранный текст пуст! Операция прервана."); sleep(2); return

    if num_chars < 50_000: rec_vocab = 1024
    elif num_chars < 200_000: rec_vocab = 2048
    elif num_chars < 1_000_000: rec_vocab = 4096
    else: rec_vocab = 8192

    console.print(f"\n  [{C_DIM}]💡 Подсказка: идеальный словарь — около [bold white]{rec_vocab}[/] токенов.[/]")
    vocab_size = IntPrompt.ask(f"[{C_ACCENT}]🧠 Введите размер BPE словаря[/]", default=rec_vocab)

    # Метрики токенизатора
    show_metrics = Confirm.ask(f"[{C_ACCENT}]Показать метрики токенизации после обучения?[/]", default=True)

    with Progress(
        SpinnerColumn(spinner_name="dots"),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(style=C_ACCENT, complete_style=C_SUCCESS),
        TaskProgressColumn(),
        TimeRemainingColumn(),
        console=console
    ) as progress:
        task_bpe = progress.add_task(f"[{C_ACCENT}]Анализ текста...[/]", total=100)
        class CLIProgressAdapter:
            def __init__(self): self.last_log = -1
            def progress(self, val, text=""):
                pct = int(val * 100)
                progress.update(task_bpe, completed=pct, description=f"[{C_ACCENT}]{text}[/]")
                if pct % 20 == 0 and pct != self.last_log and pct > 0:
                    progress.console.print(f"  [{C_DIM}]↳ \\[SYS_LOG] Компрессия BPE: {pct}% пар обработано...[/]")
                    self.last_log = pct

        tokenizer = BPETokenizer()
        tokens = tokenizer.train(cleaned_text, vocab_size=vocab_size, progress_bar=CLIProgressAdapter(), n_workers=0)
        progress.update(task_bpe, completed=100, description=f"[{C_SUCCESS}]Компиляция завершена![/]")

    tokenizer.save('custom_tokenizer.pkl')
    with open('dataset_tokens.pkl', 'wb') as f: pickle.dump(tokens, f)

    # Показываем метрики
    if show_metrics and num_chars > 0:
        metrics = estimate_tokenizer_quality(tokenizer, cleaned_text[:5000])
        table = Table(box=box.ROUNDED, border_style=C_DIM)
        table.add_column("Метрика", style=f"bold {C_ACCENT}")
        table.add_column("Значение", style="bold white")
        table.add_row("Фертильность (токенов/слово)", f"{metrics['fertility']:.2f}")
        table.add_row("Коэфф. сжатия (байт/токен)", f"{metrics['compression_ratio']:.2f}")
        table.add_row("Всего токенов", f"{metrics['num_tokens']:,}")
        console.print(f"\n[{C_ACCENT}]📊 Качество токенизации:[/]")
        console.print(table)

    print_step("Глобальный токенизатор сохранен: [bold white]custom_tokenizer.pkl[/bold white]")
    print_step(f"Скомпилированные токены ({len(tokens):,} шт) сохранены: [bold white]dataset_tokens.pkl[/bold white]")
    Prompt.ask(f"\n[{C_DIM}]Нажмите Enter для продолжения...[/]")

# ==========================================
# 2. МЕНЮ ОБУЧЕНИЯ
# ==========================================
def menu_train_model():
    print_section("ТРЕНИРОВОЧНЫЙ ЦИКЛ", "⚙️", C_MODEL)
    if not os.path.exists('custom_tokenizer.pkl'):
        print_warn("Сначала подготовьте датасет (Пункт 1), чтобы создать базовый токенизатор!"); sleep(2); return

    dataset_file = interactive_file_selector("Выберите сжатые токены:", ['.pkl'], icon="📦")
    if not os.path.exists(dataset_file): return

    presets_info = {
        'nano': 'Ультра-легкая сеть. Для быстрых экспериментов на любых устройствах.',
        'mini': 'Ультра-легкая сеть. Идеальна для быстрых тестов на CPU.',
        'small': 'Базовая модель. Хороший баланс для быстрого обучения на GPU.',
        'chat': 'Модель с увеличенным окном контекста. Отлично подходит для диалогов.',
        'logic': 'Глубокая архитектура (больше слоев). Для сложных логических связей.',
        'medium': 'Продвинутая тяжелая модель. Требует мощной видеокарты (VRAM 8GB+).',
        'large': 'Максимальное качество. Требует VRAM 16GB+ и мощного GPU.',
        'xlarge': 'Экстремальный масштаб. Только для GPU 24GB+ (RTX 4090, A100).'
    }
    preset_table = Table(box=box.ROUNDED, border_style=C_DIM, header_style=f"bold {C_ACCENT}",
                         title=f"[bold {C_PURPLE}]Архитектурные пресеты[/]", title_style=C_PURPLE, padding=(0, 1))
    preset_table.add_column("Пресет", style=f"bold {C_GOLD}", justify="center", min_width=8)
    preset_table.add_column("Назначение и описание", style="white", ratio=1)
    for p_name, p_desc in presets_info.items():
        preset_table.add_row(f"[bold]{p_name}[/]", p_desc)
    console.print(preset_table)

    preset_choice = Prompt.ask(f"[{C_ACCENT}]⚙️ Конфигурация сети[/]", choices=list(presets_info.keys()), default="mini")
    config_dict = get_effective_config(preset_choice)

    # Опции оптимизатора
    console.print(f"\n[{C_ACCENT}]🔬 Оптимизации обучения:[/]")
    use_galore = Confirm.ask(f"[{C_ACCENT}]Использовать GaLore (экономия VRAM оптимизатора 82.5%)?[/]", default=False)
    use_8bit = False
    if not use_galore:
        use_8bit = Confirm.ask(f"[{C_ACCENT}]Использовать 8-bit AdamW (требует bitsandbytes)?[/]", default=False)
    use_speculative = Confirm.ask(f"[{C_ACCENT}]Добавить Speculative Decoding heads?[/]", default=False)
    kv_mode = Prompt.ask(f"[{C_ACCENT}]Режим KV-cache[/]", choices=['int8kv', 'xquant', 'full'], default='int8kv')

    with console.status(f"[bold {C_ACCENT}]Загрузка тензоров в VRAM...[/]"):
        with open(dataset_file, 'rb') as f: tokens_data = pickle.load(f)
        tensor_data = torch.tensor(tokens_data, dtype=torch.long)

    device = get_optimal_device()
    print_step(f"Ускоритель вычислений: [bold {C_SUCCESS}]{str(device).upper()}[/]")
    stats = get_system_stats()
    if stats.get('vram_total_gb'):
        console.print(f"[{C_DIM}]VRAM: {stats['vram_gb']:.1f}/{stats['vram_total_gb']:.1f} ГБ использовано[/]")

    tokenizer = BPETokenizer.load('custom_tokenizer.pkl')
    config = TrainingConfig(
        vocab_size=len(tokenizer.vocab), n_embd=config_dict['n_embd'], n_head=config_dict['n_head'],
        n_layer=config_dict['n_layer'], block_size=config_dict['block_size'],
        batch_size=config_dict.get('batch_size', 8), max_iters=config_dict.get('max_iters', 500),
        use_bf16=(device.type == 'cuda' and torch.cuda.is_bf16_supported()),
        use_galore=use_galore,
        galore_rank=64 if use_galore else 0,
        use_8bit_adam=use_8bit,
        use_onecycle=True,
        compile_model=False  # <--- Отключаем JIT-компиляцию
    )

    trainer = Trainer(TolstoyLLM_v5, config, device=device)
    model_name = Prompt.ask(f"\n[{C_ACCENT}]💾 Имя для сохранения (без .pth)[/]", default="tolstoy_v5_model")

    console.print(f"\n[bold {C_MODEL}]>>> 🚀 ЗАПУСК НЕЙРОСЕТЕВОГО ЦИКЛА <<<[/]")
    try:
        with Progress(
            SpinnerColumn(spinner_name="point", style=C_MODEL),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(style=C_DIM, complete_style=C_MODEL, pulse_style=C_ACCENT),
            TaskProgressColumn(),
            MofNCompleteColumn(),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=console
        ) as progress:
            task_train = progress.add_task(f"[{C_MODEL}]Инициализация графов...[/]", total=config.max_iters)
            progress.console.print(f"  [{C_DIM}]↳ \\[SYS_LOG] JIT-Компиляция и прогрев кэша...[/]")
            if use_galore:
                progress.console.print(f"  [{C_DIM}]↳ \\[SYS_LOG] GaLore rank={config.galore_rank}[/]")

            def trainer_progress_callback(i, max_iters, train_loss, val_loss, current_lr, early_stop=False):
                desc = f"[{C_MODEL}]Обучение сети...[/]"
                progress.update(task_train, completed=i+1, description=desc)
                log_msg = f"  [{C_DIM}]↳ \\[TRAIN_LOG][/] Шаг [bold white]{i+1:04d}[/]/[bold white]{max_iters}[/]"
                if train_loss is not None: log_msg += f" • [green]Train:[/] {train_loss:.4f}"
                if val_loss is not None: log_msg += f" • [yellow]Val:[/] {val_loss:.4f}"
                log_msg += f" • [cyan]LR:[/] {current_lr:.2e}"
                if early_stop: log_msg += f" • [bold red]EARLY STOP 🛑[/]"
                progress.console.print(log_msg)

            trainer.train(tensor_data, model_name=model_name, progress_callback=trainer_progress_callback)
            progress.update(task_train, completed=config.max_iters, description=f"[{C_SUCCESS}]Обучение завершено![/]")

        dedicated_tok_path = f"{model_name}_tokenizer.pkl"
        shutil.copyfile('custom_tokenizer.pkl', dedicated_tok_path)
        console.print(f"\n[{C_SUCCESS}]🔒 Токенизатор жестко привязан: [bold white]{dedicated_tok_path}[/][/]")

    except KeyboardInterrupt:
        print_warn("Обучение прервано оператором.")
    Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")

# ==========================================
# 3. МЕНЮ ЧАТА
# ==========================================
def menu_chat():
    print_section("СИНХРОНИЗАЦИЯ (ЧАТ)", "💬", C_ACCENT)
    model_path = interactive_file_selector("Выберите весовые коэффициенты (.pth):", ['.pth'], icon="🧠")
    if not os.path.exists(model_path): return

    dedicated_tokenizer_path = model_path.replace('.pth', '_tokenizer.pkl')
    fallback_tokenizer_path = 'custom_tokenizer.pkl'

    if os.path.exists(dedicated_tokenizer_path):
        tokenizer_path = dedicated_tokenizer_path
        console.print(f"[{C_SUCCESS}]✓ Найден родной токенизатор: [bold white]{escape(os.path.basename(tokenizer_path))}[/][/]")
    elif os.path.exists(fallback_tokenizer_path):
        tokenizer_path = fallback_tokenizer_path
        console.print(f"[{C_WARN} on #332b00] ⚠ ВНИМАНИЕ [/] Родной токенизатор не найден!")
        console.print(f"[{C_DIM}]Используется глобальный [bold white]{fallback_tokenizer_path}[/].[/]")
    else:
        print_warn("Ни одного токенизатора не найдено!"); sleep(2); return

    device = get_optimal_device()
    tokenizer = BPETokenizer.load(tokenizer_path)

    with console.status(f"[bold {C_SUCCESS}]Анализ архитектуры {str(device).upper()}...[/]", spinner="aesthetic"):
        conf = autodetect_model_architecture(model_path, len(tokenizer.vocab))
        sleep(0.5)

    console.print(f"[{C_DIM}]Архитектура: [bold cyan]Tolstoy v5[/] | [bold white]{conf['n_layer']}[/] слоев | "
                  f"[bold white]{conf['n_embd']}[/] embd | [bold white]{conf['num_experts']}[/] экспертов | "
                  f"KV: {conf.get('kv_cache_mode', 'int8kv')}[/]")

    # Показываем статистику системы
    stats = get_system_stats()
    if stats.get('vram_total_gb'):
        console.print(f"[{C_DIM}]VRAM: {stats['vram_gb']:.1f}/{stats['vram_total_gb']:.1f} ГБ[/]")

    with console.status(f"[bold {C_SUCCESS}]Загрузка весов в {str(device).upper()}...[/]", spinner="aesthetic"):
        model_kwargs = dict(
            vocab_size=conf['vocab_size'], n_embd=conf['n_embd'],
            n_head=conf['n_head'], n_layer=conf['n_layer'], block_size=conf['block_size'],
            num_experts=conf['num_experts'], num_shared_experts=conf['num_shared_experts'],
            use_speculative=conf.get('use_speculative', False),
            kv_cache_mode=conf.get('kv_cache_mode', 'int8kv')
        )
        model, err = load_model_safe(TolstoyLLM_v5, model_path, device=device, **model_kwargs)
    if err:
        print_warn(escape(str(err))); Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]"); return

    # Опции генерации
    use_spec = conf.get('use_speculative', False)
    gen_config = {
        'temperature': 0.4,  # Снижаем хаос в предсказаниях
        'top_p': 0.9,
        'repetition_penalty': 2.0,  # Агрессивно бьем модель по рукам за повторение токенов
        'use_speculative': False
    }
    if use_spec:
        gen_config['use_speculative'] = Confirm.ask(f"[{C_ACCENT}]Использовать Speculative Decoding?[/]", default=True)

    console.print(Panel(
        f"[bold {C_SUCCESS}]🔗 Соединение установлено[/]\n"
        f"[white]Модель: [bold]{escape(os.path.basename(model_path))}[/bold][/]\n"
        f"[{C_DIM}]Temp={gen_config['temperature']} │ TopP={gen_config['top_p']} │ 'exit' для выхода[/]",
        box=box.ROUNDED, border_style=C_SUCCESS, padding=(1, 3)))

    while True:
        user_input = Prompt.ask(f"\n[bold {C_USER}] 🧑 Вы[/]")
        if user_input.lower() in ['exit', 'выход', 'quit']: break
        if not user_input.strip(): continue

        console.print(Panel(f"[white]{escape(user_input)}[/]", title=f"[bold {C_USER}]🧑 Вы[/]",
                            title_align="left", border_style=C_USER, box=box.ROUNDED, width=80, padding=(0, 2)))

        with console.status(f"[bold {C_MODEL}]Толстой генерирует...[/]", spinner="dots3"):
            input_ids = tokenizer.encode(user_input)
            
            # [ИСПРАВЛЕНО] Убрана деструктивная логика с заменой на 32. 
            # BPE-токенизатор не производит OOV-индексов по дизайну, 
            # а проверка ломала индексы при динамическом изменении словаря.
            idx = torch.tensor([input_ids], dtype=torch.long).to(device)
            out_ids = model.generate(
                idx, max_new_tokens=150,
                temperature=gen_config['temperature'],
                top_p=gen_config['top_p'],
                repetition_penalty=gen_config['repetition_penalty'],
                use_speculative=gen_config['use_speculative']
            )
            generated_tokens = out_ids[0][len(input_ids):].tolist()
            response = tokenizer.decode(generated_tokens)

        animated_bot_response(response)

# ==========================================
# 4. СИСТЕМНАЯ ИНФОРМАЦИЯ
# ==========================================
def menu_system_info():
    print_section("СИСТЕМНАЯ ИНФОРМАЦИЯ", "ℹ️", C_ACCENT)
    stats = get_system_stats()
    fa_available, fa_info = check_flash_attention()
    table = Table(box=box.ROUNDED, border_style=C_DIM, header_style=f"bold {C_ACCENT}",
                  title=f"[bold {C_PURPLE}]Аппаратные ресурсы[/]", title_style=C_PURPLE, padding=(0, 1))
    table.add_column("Компонент", style=f"bold {C_ACCENT}", min_width=16)
    table.add_column("Статус", style="bold white", ratio=1)
    table.add_column("Инфо", style=f"{C_DIM}", justify="right")
    table.add_row("PyTorch", f"v{torch.__version__}", "Ядро")
    cuda_status = torch.cuda.get_device_name(0) if torch.cuda.is_available() else f"[{C_DIM}]Недоступен[/]"
    table.add_row("CUDA", cuda_status, "GPU")
    fa_text = f"[{C_SUCCESS}]✔ {fa_info}[/]" if fa_available else f"[{C_DIM}]✘ Недоступен[/]"
    table.add_row("FlashAttention", fa_text, "SDPA")
    compile_text = f"[{C_SUCCESS}]✔ Доступен[/]" if hasattr(torch, 'compile') else f"[{C_DIM}]✘ Недоступен[/]"
    table.add_row("torch.compile", compile_text, "JIT")
    ram_used, ram_total = stats.get('ram_gb', 0), stats.get('ram_total_gb', 0)
    ram_pct = f"{ram_used/ram_total*100:.0f}%" if ram_total else "—"
    table.add_row("CPU RAM", f"{ram_used:.1f} / {ram_total:.1f} ГБ", ram_pct)
    if stats.get('vram_total_gb'):
        vram_used, vram_total = stats['vram_gb'], stats['vram_total_gb']
        vram_pct = f"{vram_used/vram_total*100:.0f}%"
        table.add_row("GPU VRAM", f"{vram_used:.1f} / {vram_total:.1f} ГБ", vram_pct)
    table.add_row("CPU Потоки", str(optimize_cpu_threads()), "Threads")
    console.print(table)
    Prompt.ask(f"\n[{C_DIM}]Нажмите Enter для продолжения...[/]")

# ==========================================
# 5. МЕНЮ РАЗРАБОТЧИКА
# ==========================================
def menu_developer():
    while True:
        print_section("МЕНЮ РАЗРАБОТЧИКА", "💻", C_ACCENT)
        dev_table = Table(box=box.ROUNDED, show_header=False, border_style=C_DIM, padding=(0, 1), pad_edge=True)
        dev_table.add_column("Ключ", style=f"bold {C_GOLD}", justify="center", width=5)
        dev_table.add_column("Действие", style="bold white", min_width=28)
        
        dev_table.add_row("[1]", "🧪 Проверка токенизатора")
        dev_table.add_row("[2]", "📋 Проверка доступности функций")
        dev_table.add_row("[3]", "📈 Загрузка ресурсов ПК")
        dev_table.add_row("[4]", "💾 Память процесса")
        dev_table.add_row("[5]", "🧮 Бенчмарк производительности (Матрицы)")
        dev_table.add_row("[6]", "🔍 Инспекция архитектуры модели")
        dev_table.add_row("[7]", "🧹 Принудительная очистка памяти")
        dev_table.add_row("[8]", "📦 Инфо об окружении (Зависимости)")
        dev_table.add_row("[0]", f"[{C_DIM}]🔙 Назад[/]")
        
        console.print(Panel(dev_table, title=f"[bold {C_ACCENT}] DEV MENU [/]", border_style=C_ACCENT, box=box.ROUNDED, padding=(1, 2)))
        console.print()
        choice = Prompt.ask(f"[bold {C_ACCENT}]❯ Выберите действие[/]", choices=["0", "1", "2", "3", "4", "5", "6", "7", "8"])
        
        if choice == "0":
            break
            
        elif choice == "1":
            print_section("ТЕСТ ТОКЕНИЗАТОРА", "🧪", C_ACCENT)
            try:
                from scripts.tester import test_tokenizer
                tokenizer_name = Prompt.ask(f"[{C_ACCENT}]Имя токенизатора (без _tokenizer.pkl)[/]", default="custom")
                test_tokenizer(tokenizer_name)
            except Exception as e:
                print_warn(f"Ошибка при тестировании: {escape(str(e))}")
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")
            
        elif choice == "2":
            print_section("ПРОВЕРКА ФУНКЦИЙ", "📋", C_ACCENT)
            table = Table(box=box.ROUNDED, border_style=C_DIM)
            table.add_column("Компонент / Функция", style=f"bold {C_ACCENT}")
            table.add_column("Статус", style="bold white")
            table.add_column("Детали", style=C_DIM)

            # 1. Аппаратные бекенды
            cuda_avail = torch.cuda.is_available()
            table.add_row("CUDA (NVIDIA GPU)", f"[{C_SUCCESS}]Доступен[/]" if cuda_avail else f"[{C_DIM}]Нет[/]", f"v{torch.version.cuda}" if cuda_avail and torch.version.cuda else "")
            
            mps_avail = hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()
            table.add_row("MPS (Apple Silicon)", f"[{C_SUCCESS}]Доступен[/]" if mps_avail else f"[{C_DIM}]Нет[/]", "Metal Performance Shaders")
            
            xpu_avail = hasattr(torch, 'xpu') and torch.xpu.is_available()
            table.add_row("XPU (Intel GPU)", f"[{C_SUCCESS}]Доступен[/]" if xpu_avail else f"[{C_DIM}]Нет[/]", "Intel Extension for PyTorch")

            table.add_section()
            
            # 2. Форматы данных и оптимизации
            if cuda_avail:
                bf16_sup = torch.cuda.is_bf16_supported()
                table.add_row("BFloat16 (BF16)", f"[{C_SUCCESS}]Аппаратная поддержка[/]" if bf16_sup else f"[{C_DIM}]Программная эмуляция[/]", "Ускорение на архитектуре Ampere+")
                
                tf32_sup = torch.backends.cuda.matmul.allow_tf32
                table.add_row("TensorFloat-32 (TF32)", f"[{C_SUCCESS}]Включен[/]" if tf32_sup else f"[{C_DIM}]Выключен[/]", "Точность FP32 со скоростью FP16")
                
                cudnn_avail = torch.backends.cudnn.is_available()
                table.add_row("cuDNN", f"[{C_SUCCESS}]Доступен[/]" if cudnn_avail else f"[{C_DIM}]Нет[/]", f"v{torch.backends.cudnn.version()}" if cudnn_avail else "")

            # 3. Внимание и JIT
            fa_avail, fa_info = check_flash_attention()
            table.add_row("FlashAttention", f"[{C_SUCCESS}]Активен[/]" if fa_avail else f"[{C_DIM}]Неактивен[/]", escape(fa_info))
            
            compile_avail = hasattr(torch, 'compile')
            table.add_row("torch.compile (JIT)", f"[{C_SUCCESS}]Доступен[/]" if compile_avail else f"[{C_DIM}]Нет[/]", "Динамическая компиляция графа (Inductor)")

            table.add_section()
            
            # 4. Внешние библиотеки квантования и памяти
            try:
                import bitsandbytes
                table.add_row("bitsandbytes", f"[{C_SUCCESS}]Установлен[/]", "Поддержка 8-bit оптимизаторов памяти")
            except ImportError:
                table.add_row("bitsandbytes", f"[{C_DIM}]Не установлен[/]", "Оптимизаторы ограничены 32/16-bit")
                
            try:
                import xformers
                table.add_row("xformers", f"[{C_SUCCESS}]Установлен[/]", "Альтернативные Memory-Efficient ядра")
            except ImportError:
                table.add_row("xformers", f"[{C_DIM}]Не установлен[/]", "Используется встроенный SDPA (PyTorch)")

            console.print(table)
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")
            
        elif choice == "3":
            print_section("РЕСУРСЫ ПК", "📈", C_ACCENT)
            try:
                import psutil
                
                cpu_total = psutil.cpu_percent(interval=0.5)
                cpu_cores = psutil.cpu_percent(percpu=True)
                ram = psutil.virtual_memory()
                swap = psutil.swap_memory()
                disk = psutil.disk_usage(os.path.abspath(os.sep))
                
                table = Table(box=box.ROUNDED, border_style=C_DIM)
                table.add_column("Ресурс", style=f"bold {C_ACCENT}")
                table.add_column("График загрузки", justify="left")
                table.add_column("Детали", style="white")
                
                def make_bar(percent, width=20):
                    filled = int((percent / 100) * width)
                    color = "green" if percent < 60 else "yellow" if percent < 85 else "red"
                    bar = f"[{color}]" + "█" * filled + "[/]" + f"[{C_DIM}]" + "░" * (width - filled) + "[/]"
                    return bar, f"[{color}]{percent:5.1f}%[/]"
                
                b_cpu, p_cpu = make_bar(cpu_total)
                table.add_row("CPU (Процессор)", b_cpu, f"{p_cpu} [{C_DIM}]{psutil.cpu_count(logical=False)}C/{psutil.cpu_count(logical=True)}T[/]")
                
                b_ram, p_ram = make_bar(ram.percent)
                table.add_row("RAM (Оперативная)", b_ram, f"{p_ram} [{C_DIM}]Занято: {(ram.total - ram.available) / (1024**3):.1f} ГБ из {ram.total / (1024**3):.1f} ГБ[/]")
                
                b_swap, p_swap = make_bar(swap.percent)
                table.add_row("SWAP (Файл подкачки)", b_swap, f"{p_swap} [{C_DIM}]Занято: {swap.used / (1024**3):.1f} ГБ из {swap.total / (1024**3):.1f} ГБ[/]")
                
                b_disk, p_disk = make_bar(disk.percent)
                table.add_row("Disk (Осн. диск)", b_disk, f"{p_disk} [{C_DIM}]Свободно: {disk.free / (1024**3):.1f} ГБ[/]")
                
                if torch.cuda.is_available():
                    for i in range(torch.cuda.device_count()):
                        props = torch.cuda.get_device_properties(i)
                        vram_total = props.total_memory / (1024**3)
                        vram_alloc = torch.cuda.memory_allocated(i) / (1024**3)
                        vram_res = torch.cuda.memory_reserved(i) / (1024**3)
                        
                        percent = ((vram_alloc + vram_res) / vram_total) * 100 if vram_total > 0 else 0
                        b_gpu, p_gpu = make_bar(percent)
                        
                        table.add_row(f"GPU {i} (VRAM)", b_gpu, f"{p_gpu} [{C_DIM}]Аллоцировано: {vram_alloc:.1f}G / Кэш: {vram_res:.1f}G / Из: {vram_total:.1f}G[/]")
                
                console.print(table)
                
                show_cores = Prompt.ask(f"\n[{C_ACCENT}]Показать детализацию по потокам CPU?[/] (y/n)", choices=["y", "n"], default="n")
                if show_cores == "y":
                    core_table = Table(box=box.ROUNDED, border_style=C_DIM)
                    core_table.add_column("Поток", style=C_DIM)
                    core_table.add_column("График", justify="left")
                    for idx, core_pct in enumerate(cpu_cores):
                        b_c, p_c = make_bar(core_pct, width=15)
                        core_table.add_row(f"CPU {idx:02d}", f"{b_c} {p_c}")
                    console.print(core_table)
                
            except ImportError:
                print_warn("Библиотека psutil не установлена. Выполните: pip install psutil")
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")
            
        elif choice == "4":
            print_section("ПАМЯТЬ ПРОЦЕССА", "💾", C_ACCENT)
            try:
                import psutil
                import time
                process = psutil.Process()
                mem_info = process.memory_info()
                
                create_time = process.create_time()
                uptime = time.time() - create_time
                hours, rem = divmod(uptime, 3600)
                minutes, seconds = divmod(rem, 60)
                uptime_str = f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"
                
                table = Table(box=box.ROUNDED, border_style=C_DIM)
                table.add_column("Метрика / Тип памяти", style=f"bold {C_ACCENT}")
                table.add_column("Значение", style="bold white")
                table.add_column("Описание", style=C_DIM)
                
                table.add_row("Uptime (Время работы)", uptime_str, "Время жизни текущего процесса")
                table.add_row("Потоки (Threads)", str(process.num_threads()), "Кол-во активных потоков ОС (PyTorch + Системные)")
                try: table.add_row("Файловые дескрипторы", str(process.num_fds()), "Открытые файлы и сокеты Linux")
                except AttributeError: pass 
                try: table.add_row("Handles", str(process.num_handles()), "Открытые хэндлы Windows")
                except AttributeError: pass

                table.add_section()
                
                table.add_row("RSS (ОЗУ Процесса)", f"{mem_info.rss / (1024**2):.1f} МБ", "Физическая RAM, реально занятая программой")
                table.add_row("VMS (Вирт. Память)", f"{mem_info.vms / (1024**2):.1f} МБ", "Запрошенное виртуальное адресное пространство")
                
                table.add_section()
                
                if torch.cuda.is_available():
                    alloc = torch.cuda.memory_allocated() / (1024**2)
                    max_alloc = torch.cuda.max_memory_allocated() / (1024**2)
                    res = torch.cuda.memory_reserved() / (1024**2)
                    table.add_row("CUDA Allocated", f"{alloc:.1f} МБ", "Объем тензоров в VRAM (Только этот процесс)")
                    table.add_row("CUDA Reserved", f"{res:.1f} МБ", "Резервный кэш аллокатора PyTorch")
                    table.add_row("CUDA Peak Allocated", f"{max_alloc:.1f} МБ", "Исторический пик использования VRAM")
                else:
                    table.add_row("CUDA Память", "-", "GPU недоступен")
                
                console.print(table)
            except ImportError:
                print_warn("Библиотека psutil не установлена. Выполните: pip install psutil")
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")
            
        elif choice == "5":
            print_section("БЕНЧМАРК ПРОИЗВОДИТЕЛЬНОСТИ", "🧮", C_ACCENT)
            
            dev_choices = ["cpu"]
            if torch.cuda.is_available(): dev_choices.append("cuda")
            if hasattr(torch, 'xpu') and torch.xpu.is_available(): dev_choices.append("xpu")
            if torch.backends.mps.is_available(): dev_choices.append("mps")
            
            console.print(f"[{C_ACCENT}]Доступные устройства:[/] {', '.join(dev_choices)}")
            target_dev = Prompt.ask(f"[{C_ACCENT}]Выберите устройство для теста[/]", choices=dev_choices, default=dev_choices[-1])
            device = torch.device(target_dev)
            
            size = 4096 if target_dev != 'cpu' else 1024
            console.print(f"[{C_DIM}]Запуск комплексного теста на {device} (Матрицы {size}x{size})...[/]")
            
            try:
                import time
                table = Table(box=box.ROUNDED, border_style=C_DIM)
                table.add_column("Тест", style=f"bold {C_ACCENT}")
                table.add_column("Режим", style="white")
                table.add_column("Производительность", style="bold green")
                
                def measure_matmul(dtype, label):
                    try:
                        A = torch.randn(size, size, dtype=dtype, device=device)
                        B = torch.randn(size, size, dtype=dtype, device=device)
                        for _ in range(3): _ = torch.matmul(A, B)
                        if device.type == 'cuda': torch.cuda.synchronize()
                        
                        iters = 20
                        start = time.time()
                        for _ in range(iters): _ = torch.matmul(A, B)
                        if device.type == 'cuda': torch.cuda.synchronize()
                        end = time.time()
                        
                        duration = end - start
                        tflops = (2 * (size ** 3) * iters) / duration / 1e12
                        table.add_row(label, f"{str(dtype).split('.')[-1].upper()}", f"{tflops:.2f} TFLOPS")
                    except Exception as e:
                        table.add_row(label, f"{str(dtype).split('.')[-1].upper()}", f"[{C_ERROR}]Не поддерживается[/]")
                    finally:
                        if 'A' in locals(): del A
                        if 'B' in locals(): del B
                
                measure_matmul(torch.float32, "Умножение матриц (Одинарная точность)")
                measure_matmul(torch.float16, "Умножение матриц (Половинная точность)")
                measure_matmul(torch.bfloat16, "Умножение матриц (Мозговая точность)")
                
                # Тест пропускной способности памяти (Memory Bandwidth)
                mb_size = 256
                num_elements = (mb_size * 1024 * 1024) // 4
                try:
                    M1 = torch.randn(num_elements, dtype=torch.float32, device=device)
                    M2 = torch.empty_like(M1)
                    
                    M2.copy_(M1)
                    if device.type == 'cuda': torch.cuda.synchronize()
                    
                    bw_iters = 50
                    start = time.time()
                    for _ in range(bw_iters):
                        M2.copy_(M1)
                    if device.type == 'cuda': torch.cuda.synchronize()
                    end = time.time()
                    
                    total_gb = (2 * mb_size * bw_iters) / 1024
                    bw = total_gb / (end - start)
                    table.add_row("Пропускная способность памяти", f"Copy {mb_size} MB", f"{bw:.1f} GB/s")
                except Exception:
                    table.add_row("Пропускная способность памяти", f"Copy {mb_size} MB", f"[{C_ERROR}]Ошибка[/]")
                finally:
                    if 'M1' in locals(): del M1
                    if 'M2' in locals(): del M2
                
                console.print(table)
                
            except Exception as e:
                print_warn(f"Критическая ошибка тестирования: {escape(str(e))}")
            finally:
                import gc; gc.collect()
                if device.type == 'cuda': torch.cuda.empty_cache()
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")
            
        elif choice == "6":
            print_section("ИНСПЕКЦИЯ АРХИТЕКТУРЫ", "🔍", C_ACCENT)
            model_path = interactive_file_selector("Выберите веса модели (.pth):", ['.pth'], icon="🧠")
            if os.path.exists(model_path):
                try:
                    tokenizer_path = model_path.replace('.pth', '_tokenizer.pkl')
                    if not os.path.exists(tokenizer_path):
                        tokenizer_path = 'custom_tokenizer.pkl'
                    vocab_size = 0
                    if os.path.exists(tokenizer_path):
                        from tokenizers.bpe_tokenizer import BPETokenizer
                        tok = BPETokenizer.load(tokenizer_path)
                        vocab_size = len(tok.vocab)
                        
                    console.print(f"[{C_DIM}]Анализ конфигурации и чтение весов (mmap)...[/]")
                    conf = autodetect_model_architecture(model_path, vocab_size)
                    
                    file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
                    
                    # Загрузка словаря весов
                    try:
                        import warnings
                        with warnings.catch_warnings():
                            warnings.simplefilter("ignore")
                            # Использование mmap позволяет не забивать оперативную память
                            state_dict = torch.load(model_path, map_location='cpu', mmap=True, weights_only=True)
                    except Exception:
                        state_dict = torch.load(model_path, map_location='cpu')

                    exact_params = 0
                    exact_bytes = 0
                    first_dtype = None
                    
                    for k, v in state_dict.items():
                        num_elements = v.numel()
                        exact_params += num_elements
                        exact_bytes += num_elements * v.element_size()
                        if first_dtype is None:
                            first_dtype = v.dtype

                    dtype_str = str(first_dtype).replace("torch.", "") if first_dtype else "Неизвестно"
                    exact_params_m = exact_params / 1e6
                    vram_req_mb = exact_bytes / (1024 * 1024)
                    
                    v = conf.get('vocab_size', 0)
                    e = conf.get('n_embd', 0)
                    l = conf.get('n_layer', 0)
                    h = conf.get('n_head', 0)
                    x = conf.get('num_experts', 0)
                    
                    table = Table(box=box.ROUNDED, border_style=C_DIM)
                    table.add_column("Параметр", style=f"bold {C_ACCENT}")
                    table.add_column("Значение", style="bold white")
                    
                    table.add_row("Путь к файлу", os.path.basename(model_path))
                    table.add_row("Размер на диске", f"{file_size_mb:.1f} МБ")
                    table.add_row("Тип данных (Dtype)", dtype_str)
                    table.add_row("Чистый вес в VRAM", f"{vram_req_mb:.1f} МБ")
                    table.add_row("Точных параметров", f"{exact_params_m:.2f} M ({exact_params:,})")
                    
                    table.add_section()
                    table.add_row("Размер словаря (Vocab)", str(v))
                    table.add_row("Размер эмбеддинга (Emb)", str(e))
                    table.add_row("Кол-во слоев (Layers)", str(l))
                    table.add_row("Кол-во голов (Heads)", str(h))
                    table.add_row("Модель", "MoE (Mixture of Experts)" if x > 0 else "Плотная (Dense)")
                    if x > 0:
                        table.add_row("Кол-во экспертов", str(x))
                    table.add_row("KV Cache Mode", str(conf.get('kv_cache_mode', 'full')))
                    
                    console.print(table)
                    
                    show_tensors = Prompt.ask(f"\n[{C_ACCENT}]Показать архитектуру тензоров?[/] (y/n)", choices=["y", "n"], default="n")
                    if show_tensors == "y":
                        tensor_table = Table(box=box.ROUNDED, border_style=C_DIM)
                        tensor_table.add_column("№", style=C_DIM)
                        tensor_table.add_column("Имя тензора", style="cyan")
                        tensor_table.add_column("Форма (Shape)", style="yellow")
                        tensor_table.add_column("Параметры", style="green", justify="right")
                        
                        limit = 20
                        for i, (k, val) in enumerate(state_dict.items()):
                            if i >= limit: break
                            tensor_table.add_row(str(i+1), k, str(list(val.shape)), f"{val.numel():,}")
                        
                        console.print(tensor_table)
                        if len(state_dict) > limit:
                            console.print(f"[{C_DIM}]... и еще {len(state_dict) - limit} тензоров скрыто.[/]")
                            
                    del state_dict
                    
                except Exception as e:
                    print_warn(f"Не удалось проанализировать: {escape(str(e))}")
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")
            
        elif choice == "7":
            print_section("ОЧИСТКА ПАМЯТИ", "🧹", C_ACCENT)
            import gc
            gc.collect()
            device = get_optimal_device(verbose=False)
            if device.type == 'cuda':
                torch.cuda.empty_cache()
                torch.cuda.ipc_collect()
                console.print(f"[{C_SUCCESS}]Кэш CUDA очищен![/]")
            elif device.type == 'mps':
                torch.mps.empty_cache()
                console.print(f"[{C_SUCCESS}]Кэш MPS очищен![/]")
            console.print(f"[{C_SUCCESS}]Сборщик мусора Python (GC) выполнен![/]")
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")
            
        elif choice == "8":
            print_section("ИНФО ОБ ОКРУЖЕНИИ", "📦", C_ACCENT)
            import platform
            import importlib.metadata
            
            def get_pkg_version(pkg_name):
                try: return importlib.metadata.version(pkg_name)
                except importlib.metadata.PackageNotFoundError: return f"[{C_DIM}]Не установлен[/]"
            
            env_table = Table(box=box.ROUNDED, border_style=C_DIM)
            env_table.add_column("Компонент", style=f"bold {C_ACCENT}")
            env_table.add_column("Версия / Информация", style="bold white")
            
            env_table.add_row("[bold cyan]Система[/]", "")
            env_table.add_row("OS", platform.platform())
            env_table.add_row("Архитектура", platform.machine())
            try:
                env_table.add_row("Процессор", platform.processor())
            except: pass
            
            try:
                import psutil
                ram_gb = psutil.virtual_memory().total / (1024**3)
                env_table.add_row("Оперативная память", f"{ram_gb:.1f} ГБ")
            except: pass
            
            env_table.add_section()
            env_table.add_row("[bold cyan]Окружение Python[/]", "")
            env_table.add_row("Версия Python", sys.version.split()[0])
            env_table.add_row("Исполняемый файл", sys.executable)
            
            env_table.add_section()
            env_table.add_row("[bold cyan]Core ML Стек[/]", "")
            env_table.add_row("PyTorch", torch.__version__)
            env_table.add_row("TorchVision", get_pkg_version("torchvision"))
            env_table.add_row("TorchAudio", get_pkg_version("torchaudio"))
            env_table.add_row("Triton", get_pkg_version("triton"))
            
            env_table.add_section()
            env_table.add_row("[bold cyan]NLP & Токенизация[/]", "")
            env_table.add_row("Tokenizers", get_pkg_version("tokenizers"))
            env_table.add_row("Transformers", get_pkg_version("transformers"))
            env_table.add_row("TikToken", get_pkg_version("tiktoken"))
            env_table.add_row("Corus", get_pkg_version("corus"))
            
            env_table.add_section()
            env_table.add_row("[bold cyan]Оптимизация & Ядра[/]", "")
            env_table.add_row("Flash-Attention", get_pkg_version("flash_attn"))
            env_table.add_row("XFormers", get_pkg_version("xformers"))
            env_table.add_row("BitsAndBytes", get_pkg_version("bitsandbytes"))
            env_table.add_row("Accelerate", get_pkg_version("accelerate"))
            env_table.add_row("GaLore-Torch", get_pkg_version("galore_torch"))
            
            env_table.add_section()
            env_table.add_row("[bold cyan]Утилиты[/]", "")
            env_table.add_row("NumPy", get_pkg_version("numpy"))
            env_table.add_row("Rich", get_pkg_version("rich"))
            env_table.add_row("PSUtil", get_pkg_version("psutil"))
            
            console.print(env_table)
            Prompt.ask(f"\n[{C_DIM}]Нажмите Enter...[/]")

# ==========================================
# MAIN
# ==========================================
def main():
    print_banner(animate=True)
    while True:
        print_banner(animate=False)
        menu_table = Table(box=box.ROUNDED, show_header=False, border_style=C_DIM,
                          padding=(0, 1), pad_edge=True)
        menu_table.add_column("Ключ", style=f"bold {C_GOLD}", justify="center", width=5)
        menu_table.add_column("Действие", style="bold white", min_width=28)
        menu_table.add_column("Описание", style=f"italic {C_DIM}", ratio=1)
        menu_table.add_row("[1]", "📚  Подготовить датасет", "Загрузка, очистка и BPE-компиляция")
        menu_table.add_row("[2]", "🚀  Обучить нейросеть", "Тренировочный цикл с мониторингом")
        menu_table.add_row("[3]", "💬  Запустить чат", "Диалог с обученной моделью")
        menu_table.add_row("[4]", "📊  Системная информация", "GPU, VRAM, FlashAttention")
        menu_table.add_row("[5]", "💻  Меню разработчика", "Тесты, память, диагностика")
        menu_table.add_row("[6]", f"[{C_DIM}]❌  Выход[/]", f"[{C_DIM}]Завершить сеанс[/]")
        console.print(Panel(menu_table, title=f"[bold {C_ACCENT}] КОМАНДНЫЙ ЦЕНТР [/]",
                           border_style=C_ACCENT, box=box.ROUNDED, padding=(1, 2)))
        console.print()
        choice = Prompt.ask(f"[bold {C_ACCENT}]❯ Выберите команду[/]", choices=["1", "2", "3", "4", "5", "6"])
        if choice == '1': menu_prepare_data()
        elif choice == '2': menu_train_model()
        elif choice == '3': menu_chat()
        elif choice == '4': menu_system_info()
        elif choice == '5': menu_developer()
        elif choice == '6':
            console.print(Panel(
                f"[bold {C_ACCENT}]Сеанс завершён. До встречи![/]\n[{C_DIM}]Tolstoy AI Studio v8.0.0[/]",
                box=box.ROUNDED, border_style=C_DIM, padding=(1, 3)
            ))
            break

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: console.print(f"\n[bold {C_WARN}]Принудительный выход. ❌[/]")
