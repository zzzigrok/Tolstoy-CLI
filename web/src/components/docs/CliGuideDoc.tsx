import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function CliGuideDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🧭 Tolstoy CLI Studio: Руководство оператора</h2>
          <p>
            Консольный интерфейс <code>tolstoy_cli.py</code> представляет собой единый командный центр 
            для полного жизненного цикла языковых моделей семейства <strong>TolstoyLLM</strong>: от извлечения 
            сырого корпуса и бинарного BPE-токенизирования до квантованного обучения с GaLore/Muon и аппаратного инференса с KV-кэшем.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Архитектура пайплайна Tolstoy CLI</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Запуск: python tolstoy_cli.py [Флаги CLI / Интерактивный режим]</div>
              <div className="flow-connector font-mono">↓ Выбор рабочего режима</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">[1] Data Pipeline: Сборка корпуса (Corus / Text / PDF / DOCX) → NFC Очистка</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node highlight-purple">[2] Rust BPE Core: Обучение словаря (O(N log M)) → .bpe + dataset_tokens.pkl</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node highlight-cyan">[3] Pre-training: Выбор пресета (Nano–XLarge) + Оптимизаторы (GaLore / Muon)</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">[4] Inference Engine: Интерактивный терминальный чат + XQuant-CL + Спекуляция</div>
              </div>
              <div className="flow-connector font-mono">↓ Сохранение артефактов</div>
              <div className="flow-node output-node">Готовые чекпоинты models/*.pth + model_tokenizer.bpe</div>
            </div>
          </div>

          <AlertBox type="tip" title="Интерактивный и пакетный режим">
            <ul>
              <li><strong>Интерактивное меню:</strong> Запуск без аргументов отображает стилизованное TUI-меню с автоопределением аппаратных ускорителей CUDA / ROCm / MPS и доступной видеопамяти.</li>
              <li><strong>Headless / Batch режим:</strong> Скрипт поддерживает передачу аргументов командной строки для запуска распределенных или фоновых экспериментов в tmux / screen.</li>
              <li><strong>Строгая изоляция артефактов:</strong> Каждая обученная модель автоматически связывается со своим уникальным бинарным файлом словаря <code>*_tokenizer.bpe</code> во избежание десинхронизации токенов.</li>
            </ul>
          </AlertBox>

          <h3>Аппаратные пресеты и требования к памяти</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Пресет</th>
                  <th>Параметры</th>
                  <th>Слои</th>
                  <th>Hidden Dim</th>
                  <th>Heads (Q/KV)</th>
                  <th>Block Size</th>
                  <th>Мин. VRAM (Обучение)</th>
                  <th>Целевой GPU</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>nano</code></td>
                  <td>~4.2M</td>
                  <td>2</td>
                  <td>128</td>
                  <td>4 / 2</td>
                  <td>256</td>
                  <td>~1.2 GB</td>
                  <td>CPU / Встроенный GPU</td>
                </tr>
                <tr>
                  <td><code>mini</code></td>
                  <td>~15.8M</td>
                  <td>4</td>
                  <td>256</td>
                  <td>8 / 4</td>
                  <td>512</td>
                  <td>~2.4 GB</td>
                  <td>GTX 1650 / 1060 (4-6 GB)</td>
                </tr>
                <tr>
                  <td><code>small</code></td>
                  <td>~48.5M</td>
                  <td>6</td>
                  <td>384</td>
                  <td>12 / 4</td>
                  <td>1,024</td>
                  <td>~4.5 GB</td>
                  <td>RTX 2060 / 3050 (6-8 GB)</td>
                </tr>
                <tr>
                  <td><code>chat</code></td>
                  <td>~88.2M</td>
                  <td>8</td>
                  <td>512</td>
                  <td>16 / 4</td>
                  <td>2,048</td>
                  <td>~6.8 GB</td>
                  <td>RTX 3060 / 4060 (8-12 GB)</td>
                </tr>
                <tr>
                  <td><code>medium</code></td>
                  <td>~142M</td>
                  <td>12</td>
                  <td>768</td>
                  <td>12 / 4</td>
                  <td>2,048</td>
                  <td>~9.5 GB (GaLore)</td>
                  <td>RTX 3060 12GB / 4070</td>
                </tr>
                <tr>
                  <td><code>large</code></td>
                  <td>~350M</td>
                  <td>16</td>
                  <td>1,024</td>
                  <td>16 / 4</td>
                  <td>2,048</td>
                  <td>~14.5 GB (GaLore)</td>
                  <td>RTX 3090 / 4080 (16-24 GB)</td>
                </tr>
                <tr>
                  <td><code>xlarge</code></td>
                  <td>~1.1B</td>
                  <td>24</td>
                  <td>1,536</td>
                  <td>24 / 8</td>
                  <td>4,096</td>
                  <td>~22.0 GB (GaLore 8-bit)</td>
                  <td>RTX 4090 / A100 (24-80 GB)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "commands",
      label: "КОМАНДЫ И ФЛАГИ",
      content: (
        <>
          <h2>⌨️ Флаги запуска и консольные команды</h2>
          <p>
            <code>tolstoy_cli.py</code> принимает набор флагов командной строки для автоматизации обучения, 
            пакетного скоринга и экспорта чекпоинтов.
          </p>

          <CodeBlock
            code={`# 1. Запуск интерактивного меню (по умолчанию)
python tolstoy_cli.py

# 2. Пакетная подготовка датасета из локальной директории с обучением BPE словаря
python tolstoy_cli.py --mode data \\
  --data-dir ./raw_texts \\
  --vocab-size 8192 \\
  --output-tokenized dataset_tokens.pkl

# 3. Автоматический запуск предварительного обучения на GPU
python tolstoy_cli.py --mode train \\
  --preset medium \\
  --dataset dataset_tokens.pkl \\
  --batch-size 8 \\
  --grad-accum 4 \\
  --optimizer galore \\
  --galore-rank 128 \\
  --lr 3e-4 \\
  --epochs 10 \\
  --save-dir ./checkpoints

# 4. Запуск инференс-чата с квантованным KV-кэшем
python tolstoy_cli.py --mode chat \\
  --checkpoint ./checkpoints/model_medium_best.pth \\
  --kv-cache-mode xquant \\
  --temperature 0.4 \\
  --top-p 0.9 \\
  --repetition-penalty 1.25`}
            language="bash"
            filename="Terminal Bash Commands"
          />

          <h3>Сводная таблица параметров CLI</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Флаг CLI</th>
                  <th>Тип</th>
                  <th>По умолчанию</th>
                  <th>Описание</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>--mode</code></td>
                  <td><code>string</code></td>
                  <td><code>interactive</code></td>
                  <td>Режим работы: <code>interactive</code>, <code>data</code>, <code>train</code>, <code>chat</code>, <code>benchmark</code>.</td>
                </tr>
                <tr>
                  <td><code>--preset</code></td>
                  <td><code>string</code></td>
                  <td><code>chat</code></td>
                  <td>Архитектурный пресет: <code>nano</code>, <code>mini</code>, <code>small</code>, <code>chat</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>.</td>
                </tr>
                <tr>
                  <td><code>--optimizer</code></td>
                  <td><code>string</code></td>
                  <td><code>adamw</code></td>
                  <td>Алгоритм оптимизации: <code>adamw</code>, <code>galore</code>, <code>muon</code>, <code>adamw_8bit</code>.</td>
                </tr>
                <tr>
                  <td><code>--galore-rank</code></td>
                  <td><code>int</code></td>
                  <td><code>128</code></td>
                  <td>Ранг низкоранговой проекции градиентов для оптимизатора GaLore (r ∈ [64, 256]).</td>
                </tr>
                <tr>
                  <td><code>--kv-cache-mode</code></td>
                  <td><code>string</code></td>
                  <td><code>xquant</code></td>
                  <td>Формат хранения KV-кэша: <code>fp16</code>, <code>int8kv</code>, <code>xquant</code> (блочное INT8 квантование).</td>
                </tr>
                <tr>
                  <td><code>--speculative-heads</code></td>
                  <td><code>flag</code></td>
                  <td><code>False</code></td>
                  <td>Включение дополнительных голов многотокенного прогнозирования (MTP) для спекулятивного декодирования.</td>
                </tr>
                <tr>
                  <td><code>--temperature</code></td>
                  <td><code>float</code></td>
                  <td><code>0.4</code></td>
                  <td>Коэффициент температурного масштабирования распределения Softmax при генерации.</td>
                </tr>
                <tr>
                  <td><code>--repetition-penalty</code></td>
                  <td><code>float</code></td>
                  <td><code>1.2</code></td>
                  <td>Штраф за повторение ранее сгенерированных токенов для исключения зацикливания.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "pipeline",
      label: "ПРОЦЕСС РАБОТЫ",
      content: (
        <>
          <h2>⚙️ Пошаговый пайплайн оператора</h2>
          
          <h3>Шаг 1: Подготовка сырых корпусов и Corus</h3>
          <p>
            Встроенный загрузчик датасетов поддерживает 21 готовый корпус библиотеки <strong>Corus</strong> 
            (включая <em>Taiga, Lenta.ru, Wikipedia RU, Habr, Мошков Библиотека</em>), а также локальные папки с документами.
          </p>
          <CodeBlock
            code={`# Интеграция с Corus в tolstoy_cli.py
from corus import load_lenta2, load_taiga_proza

def ingest_corpus(corpus_type: str, max_samples: int = 100_000):
    text_buffer = []
    if corpus_type == "lenta":
        records = load_lenta2("corus_archive/lenta-ru-news.csv.gz")
        for record in records:
            text_buffer.append(f"{record.title}\\n{record.text}")
            if len(text_buffer) >= max_samples:
                break
    return clean_and_normalize_corpus(text_buffer)`}
            language="python"
            filename="data_ingestion.py"
          />

          <h3>Шаг 2: Компиляция BPE-токенизатора</h3>
          <p>
            После сбора корпуса CLI вызывает высокоскоростное Rust-ядро <code>rust-bpe-tokenizer</code>, 
            которое выполняет параллельное слияние пар байтов и генерирует бинарный файл <code>custom_tokenizer.bpe</code>.
          </p>

          <AlertBox type="note" title="Структура бинарного формата Bincode (.bpe)">
            Файл токенизатора сериализуется в нативном формате Rust Bincode, исключающем медленный JSON-парсинг. 
            Загрузка словаря из 32 768 токенов занимает всего <strong>2.8 миллисекунды</strong> вместо 180 мс у стандартного JSON.
          </AlertBox>

          <h3>Шаг 3: Запуск и мониторинг тренера</h3>
          <p>
            Тренировочный цикл отображает расширенный интерактивный прогресс-бар с телеметрией в реальном времени:
          </p>
          <CodeBlock
            code={`[Epoch 1/5 | Step 1420/5000]
Loss: 2.8412 | Perplexity: 17.13 | LR: 2.85e-04
VRAM: 8.42 / 12.0 GB (Allocated: 6.91 GB) | Tok/sec: 14,820
Gradient Norm: 0.84 | Muon Orthogonality Error: 3.2e-4
CUDA Stream: Async Validation In-Flight...`}
            language="bash"
            filename="Console Live Telemetry"
          />
        </>
      ),
    },
    {
      id: "troubleshooting",
      label: "ТРАБЛШУТИНГ",
      content: (
        <>
          <h2>🛠️ Решение типовых проблем CLI</h2>

          <div className="faq-card">
            <h4>🚨 Ошибка: CUDA Out of Memory (OOM) на этапе forward / backward</h4>
            <p><strong>Причина:</strong> Слишком большой размер локального мини-батча или активаций FFN при текущем контексте.</p>
            <p><strong>Решение:</strong></p>
            <ol>
              <li>Уменьшите <code>--batch-size</code> до 2 или 4 и пропорционально увеличьте <code>--grad-accum</code> (например, батч 2 и аккумулирование 8 дают эффективный батч 16).</li>
              <li>Переключите оптимизатор на GaLore с флагом <code>--optimizer galore --galore-rank 128</code>. Это снизит потребление памяти состояниями AdamW на 82%.</li>
              <li>Включите режим смешанной точности <code>bfloat16</code>.</li>
            </ol>
          </div>

          <div className="faq-card">
            <h4>🚨 Ошибка: "Corrupted BPE vocabulary magic header"</h4>
            <p><strong>Причина:</strong> Попытка загрузить устаревший файл словаря <code>.pkl</code> через бинарный парсер Bincode.</p>
            <p><strong>Решение:</strong></p>
            <p>
              CLI автоматически выполняет обратную совместимость. Если вы переобучаете модель, перезапустите шаг 
              [1] подготовки датасета, чтобы токенизатор скомпилировался в формате <code>.bpe</code>.
            </p>
          </div>

          <div className="faq-card">
            <h4>🚨 Генерация зацикливается или выдает бесконечные повторы строк</h4>
            <p><strong>Причина:</strong> Недостаточный штраф за повторение или слишком низкая температура выборки.</p>
            <p><strong>Решение:</strong></p>
            <p>
              Установите <code>--repetition-penalty 1.25</code> или <code>1.3</code> и используйте <code>--temperature 0.4</code>. 
              Также убедитесь, что при инференсе токен конца последовательности <code>&lt;|endoftext|&gt;</code> корректно распознается моделью.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="cyan" />;
}
