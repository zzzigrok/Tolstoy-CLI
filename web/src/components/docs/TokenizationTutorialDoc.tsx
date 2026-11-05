import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function TokenizationTutorialDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>✂️ Практикум по обучению BPE-токенизатора</h2>
          <p>
            Токенизация — это фундамент, определяющий "словарь мышления" будущей нейросети. 
            Если токенизатор нарежет слова слишком мелко (по одной букве), модели придется тратить все внимание 
            на склеивание слогов. Если сделать словарь слишком большим, видеопамять будет занята гигантской 
            матрицей эмбеддингов, а редкие слова останутся "недоученными".
          </p>
          <p>
            В этом руководстве мы разберем практический процесс обучения кастомного 
            <strong>Byte-Pair Encoding (BPE)</strong> словаря в Tolstoy AI Studio от сырого текстового файла 
            до готового бинарного файла <code>custom_tokenizer.bpe</code>.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Пошаговый процесс BPE-сжатия русского текста</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Слова: "корова", "ворона", "воровство"</div>
              <div className="flow-connector font-mono">↓ Базовый уровень: 256 байтов UTF-8</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">
                  Итерация 1: Частая пара ('в', 'о') → Создание токена 'во'
                </div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">
                  Итерация 2: Частая пара ('во', 'р') → Создание токена 'вор'
                </div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node highlight-purple">
                  Итерация 3: Частая пара ('вор', 'ов') → Создание токена 'воров'
                </div>
              </div>
              <div className="flow-connector font-mono">↓ Результат сжатия</div>
              <div className="flow-node output-node">
                Сжатый вектор: ['вор', 'она'], ['ко', 'рова'], ['воров', 'ство']
              </div>
            </div>
          </div>

          <AlertBox type="tip" title="Золотое правило размера словаря (Vocab Size)">
            Словарь должен соответствовать размеру вашего датасета:
            <ul>
              <li><strong>Датасет &lt; 5 МБ:</strong> <code>vocab_size = 2048 - 4096</code>.</li>
              <li><strong>Датасет 5–50 МБ:</strong> <code>vocab_size = 8192</code>.</li>
              <li><strong>Датасет &gt; 100 МБ:</strong> <code>vocab_size = 16384 - 32768</code>.</li>
            </ul>
          </AlertBox>

          <h3>Влияние размера словаря на ресурсы системы</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Размер словаря</th>
                  <th>Размер таблицы эмбеддингов (Hidden=768)</th>
                  <th>Фертильность (токенов/слово)</th>
                  <th>Сжатие (байт/токен)</th>
                  <th>Эффективность контекста</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1,024</td>
                  <td>~3.1 МБ</td>
                  <td>~2.85 (слишком мелко)</td>
                  <td>~1.85 байт</td>
                  <td>Низкая (контекст 1024 вмещает 350 слов)</td>
                </tr>
                <tr>
                  <td>4,096</td>
                  <td>~12.5 МБ</td>
                  <td>~1.62</td>
                  <td>~3.15 байт</td>
                  <td>Хорошая для малых моделей</td>
                </tr>
                <tr>
                  <td><strong>8,192 (Оптимум)</strong></td>
                  <td><strong>~25.1 МБ</strong></td>
                  <td><strong>~1.32</strong></td>
                  <td><strong>~3.95 байт</strong></td>
                  <td><strong>Высокая (контекст 1024 вмещает 780 слов)</strong></td>
                </tr>
                <tr>
                  <td>32,768</td>
                  <td>~100.6 МБ</td>
                  <td>~1.15</td>
                  <td>~4.40 байт</td>
                  <td>Максимальная (для больших датасетов)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "workflow",
      label: "ИНСТРУКЦИЯ CLI",
      content: (
        <>
          <h2>🚀 Обучение токенизатора через терминал</h2>

          <h3>Шаг 1: Запуск меню подготовки</h3>
          <p>
            В терминале запустите CLI и выберите пункт <code>[1] Подготовить датасет</code>:
          </p>
          <CodeBlock
            code={`$ python tolstoy_cli.py

============================================================
           TOLSTOY AI STUDIO - CONTROL CENTER               
============================================================
[1] Подготовить датасет (Извлечение, Очистка, BPE-Токенизация)
[2] Обучить нейросеть (Pre-training)
[3] Запустить интерактивный чат
[4] Системная телеметрия и аппаратный статус
[0] Выход
Выберите действие > 1`}
            language="bash"
            filename="Terminal Prompt"
          />

          <h3>Шаг 2: Выбор источника данных</h3>
          <p>
            Укажите путь к вашему текстовому файлу или директории:
          </p>
          <CodeBlock
            code={`[1] Одиночный файл (.txt, .md, .pdf, .docx, .json)
[2] Папка с файлами (Рекурсивное объединение)
[3] Загрузка проверенного архива через Corus
Выберите вариант > 1
Введите путь к файлу > data/tolstoy_complete_works.txt`}
            language="bash"
            filename="Data Selection"
          />

          <h3>Шаг 3: Выбор размера словаря</h3>
          <p>
            CLI проанализирует объем текста и предложит рекомендуемый размер словаря:
          </p>
          <CodeBlock
            code={`[*] Анализ корпуса: 14,250,890 символов (~14.2 МБ)
[?] Рекомендуемый размер словаря: 8192
Введите vocab_size (по умолчанию 8192) > 8192

[*] Запуск Rust BPE Core (Rayon параллелизм: 16 потоков)...
[████████████████████████████████] 100% | 8192/8192 Merges [00:42, 185 merge/s]

[+] Токенизатор успешно обучен!
    - Фертильность корпуса: 1.31 токена / слово
    - Коэффициент сжатия: 4.02 байта / токен
    - Сохранено: custom_tokenizer.bpe (Bincode Binary)
    - Векторизованный датасет: dataset_tokens.pkl (3,544,120 токенов)`}
            language="bash"
            filename="Rust BPE Training Output"
          />
        </>
      ),
    },
    {
      id: "inspection",
      label: "ИНСПЕКЦИЯ ТОКЕНОВ",
      content: (
        <>
          <h2>🔬 Скрипт проверки разбиения слов на токены</h2>
          <p>
            Чтобы убедиться, что токенизатор выучил правильные морфологические корни и суффиксы русского языка, 
            запустите скрипт инспекции:
          </p>

          <CodeBlock
            code={`from tokenizers.bpe_tokenizer import BPETokenizer

# Загрузка бинарного словаря BPE
tokenizer = BPETokenizer.load_bincode("custom_tokenizer.bpe")

test_phrases = [
    "Все счастливые семьи похожи друг на друга.",
    "Высокотехнологичный искусственный интеллект.",
    "Недоперевыполнить пятилетний план."
]

for phrase in test_phrases:
    tokens = tokenizer.encode(phrase)
    decoded_pieces = [tokenizer.decode([t]) for t in tokens]
    
    print(f"\\nИсходный текст: '{phrase}'")
    print(f"Количество токенов: {len(tokens)}")
    print(f"Разбиение на субслова: {decoded_pieces}")`}
            language="python"
            filename="inspect_tokenizer.py"
          />

          <h3>Пример вывода инспекции:</h3>
          <CodeBlock
            code={`Исходный текст: 'Все счастливые семьи похожи друг на друга.'
Количество токенов: 8
Разбиение на субслова: ['Все', ' счастливые', ' семьи', ' похожи', ' друг', ' на', ' друга', '.']

Исходный текст: 'Недоперевыполнить пятилетний план.'
Количество токенов: 5
Разбиение на субслова: ['Недо', 'пере', 'выполнить', ' пятилетний', ' план.']`}
            language="text"
            filename="Inspection Results"
          />
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h2>❓ Частые вопросы о токенизации</h2>

          <div className="faq-card">
            <h4>🚨 Что произойдет, если обучить модель с одним токенизатором, а генерировать с другим?</h4>
            <p>
              Произойдет полная рассинхронизация семантики! Число <code>452</code> в одном словаре может 
              означать слово <em>"человек"</em>, а в другом — букву <em>"я"</em>. Модель будет выдавать 
              бессмысленный набор символов. Именно поэтому Tolstoy CLI <strong>всегда привязывает и сохраняет 
              копию токенизатора рядом с весами модели</strong> (например, <code>model_v7_tokenizer.bpe</code>).
            </p>
          </div>

          <div className="faq-card">
            <h4>🚨 Как конвертировать старый словарь .pkl в быстрый .bpe?</h4>
            <p>
              Tolstoy CLI выполняет автоконвертацию. При запуске скрипт проверяет наличие <code>.bpe</code>, 
              и если найден только устаревший <code>.pkl</code>, он моментально пересохраняет его в нативный 
              бинарный формат Bincode.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="purple" />;
}
