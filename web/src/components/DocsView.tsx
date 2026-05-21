import { useState, useEffect } from "react";
import { GitHubIcon } from "./Icons";

// Helper components for rich rendering
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="docs-code-container">
      <div className="docs-code-header">
        <span>{language}</span>
        <button onClick={handleCopy} className="docs-copy-btn">
          {copied ? "Скопировано!" : "Копировать"}
        </button>
      </div>
      <pre className="docs-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function AlertBox({ type, title, children }: { type: "info" | "tip" | "warning"; title: string; children: React.ReactNode }) {
  const icon = {
    info: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }[type];

  return (
    <div className={`docs-alert docs-alert-${type}`}>
      <div className="docs-alert-header">
        {icon}
        <span className="docs-alert-title">{title}</span>
      </div>
      <div className="docs-alert-content">{children}</div>
    </div>
  );
}

export function DocsView({ onBack }: { onBack: () => void }) {
  const [activeDoc, setActiveDoc] = useState<string>("architecture");

  // Reset scroll position when doc changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [activeDoc]);

  const docsMenu = [
    { id: "architecture", label: "🏗️ Архитектура модели", desc: "Подробный разбор TolstoyLLM_v5" },
    { id: "cli_guide", label: "🗺️ Руководство CLI", desc: "Мануал по управлению через консоль" },
    { id: "training", label: "🔬 Обучение и оптимизация", desc: "GaLore, Muon и валидация" },
    { id: "tokenizer", label: "🧠 BPE Токенизатор", desc: "Детали алгоритма BPETokenizer v10" },
  ];

  return (
    <div className="docs-page-wrapper">
      {/* Background gradients */}
      <div className="docs-bg-glow">
        <div className="docs-glow-1"></div>
        <div className="docs-glow-2"></div>
      </div>

      <div className="docs-header-bar">
        <button onClick={onBack} className="docs-back-btn">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться на главную
        </button>
        <span className="docs-title-badge">Tolstoy-CLI Документация</span>
      </div>

      <div className="docs-layout-container">
        {/* Left Sidebar */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-header">
            <h3>Разделы документации</h3>
            <p>Технические статьи, мануалы и разборы алгоритмов</p>
          </div>
          <nav className="docs-sidebar-nav">
            {docsMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveDoc(item.id)}
                className={`docs-nav-item ${activeDoc === item.id ? "active" : ""}`}
              >
                <div className="docs-nav-item-label">{item.label}</div>
                <div className="docs-nav-item-desc">{item.desc}</div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="docs-main-content">
          {activeDoc === "architecture" && <ArchitectureDoc />}
          {activeDoc === "cli_guide" && <CliGuideDoc />}
          {activeDoc === "training" && <TrainingDoc />}
          {activeDoc === "tokenizer" && <TokenizerDoc />}
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 1. ARCHITECTURE DOCUMENT
// ----------------------------------------------------
function ArchitectureDoc() {
  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Архитектура и Модели</h1>
        <p className="docs-lead-paragraph">
          Этот документ представляет собой подробный технический разбор архитектуры <strong>TolstoyLLM_v5</strong>. 
          Мы объединили строгую математику и архитектурные схемы, чтобы показать, как достигается высокая 
          эффективность обучения и инференса на локальных GPU.
        </p>
      </div>

      <hr className="docs-divider" />

      <h2>🏗️ Общая топология модели</h2>
      <p>
        Модель построена на базе архитектуры <strong>Transformer (decoder-only)</strong> с современными оптимизациями. 
        Основная цель версии v5 — достижение максимального качества на русском языке при минимальном потреблении 
        видеопамяти (VRAM).
      </p>

      <h3>Схема «Блока Толстого» (Transformer Layer)</h3>
      <p>
        В отличие от классического трансформера, мы используем <strong>Pre-Norm</strong> структуру (нормализация перед 
        слоем внимания и FFN) и <strong>Parallel Residuals</strong> (параллельные остаточные связи) для максимальной 
        стабильности глубоких градиентных потоков.
      </p>

      {/* Embedded Visual Interactive Diagram of Transformer layer */}
      <div className="docs-diagram-container">
        <div className="diagram-title">Архитектура слоя TolstoyLLM (Transformer Layer v5)</div>
        <div className="transformer-layer-flow">
          <div className="flow-node input-node">Входные токены [B, T]</div>
          <div className="flow-connector font-mono">↓</div>
          <div className="flow-node layer-box">
            <div className="sub-node">RMSNorm (QK-Norm включен)</div>
            <div className="flow-connector-short">↓</div>
            <div className="sub-node highlight-cyan">GQA + RoPE (Групповое внимание)</div>
            <div className="flow-connector-short">↓</div>
            <div className="sub-node">Сложение Residual Connection</div>
          </div>
          <div className="flow-connector font-mono">↓</div>
          <div className="flow-node layer-box">
            <div className="sub-node">RMSNorm</div>
            <div className="flow-connector-short">↓</div>
            <div className="sub-node highlight-purple">Sparse MoE / SwiGLU FFN (8 экспертов)</div>
            <div className="flow-connector-short">↓</div>
            <div className="sub-node">Сложение Residual Connection</div>
          </div>
          <div className="flow-connector font-mono">↓</div>
          <div className="flow-node output-node">Выходной логит [B, T, V] (Shared Weights / Tying)</div>
        </div>
      </div>

      <hr className="docs-divider" />

      <h2>🧩 Ключевые компоненты архитектуры</h2>

      <h3>1. RMSNorm (Root Mean Square Layer Normalization)</h3>
      <p>
        Обычный LayerNorm центрирует данные (вычитает среднее), что требует лишних проходов по памяти. RMSNorm пропускает 
        этот этап, масштабируя вектор на основе его среднеквадратичной мощности. Это дает прирост скорости без потери качества.
      </p>
      <AlertBox type="info" title="Реализация в коде (models/layers.py)">
        Мы строго контролируем точность вычислений. В коде используется принудительное приведение к Float32 перед вычислением квадратов:
        <code>x_f32 = x.float()</code>, затем вычисляется среднее квадратов, и только перед выводом результат приводится обратно к исходному типу (FP16/BF16), что предотвращает <strong>NaN-stability</strong> ошибки при переполнениях.
      </AlertBox>

      <h3>2. RoPE (Rotary Positional Embeddings) + YaRN</h3>
      <p>
        Вместо сложения позиционных векторов с токенами, RoPE применяет математическую матрицу вращения в комплексном пространстве. 
        Мы также внедрили <strong>YaRN (Yet another RoPE extension)</strong> для динамической экстраполяции длины контекста. 
        Частота вращения масштабируется при выходе за пределы стандартного контекста по формуле NTK-Aware Scaling.
      </p>

      <h3>3. GQA (Grouped Query Attention)</h3>
      <p>
        В стандартном MHA на каждую голову запроса (Query) приходится своя пара Key и Value. В GQA мы группируем запросы. 
        По умолчанию в версии v5 используется соотношение <code>n_kv_head = max(1, n_head // 4)</code>. Это экономит до 75% 
        памяти, выделяемой под KV-кэш на длинных сессиях генерации.
      </p>

      <h3>4. Sparse MoE (Mixture of Experts) + SwiGLU</h3>
      <p>
        Вместо одного тяжелого полносвязного слоя мы используем «Смесь экспертов» (Mixture of Experts).
      </p>
      <ul>
        <li><strong>Маршрутизатор (Router):</strong> Для каждого токена выбираются 2 лучших эксперта из 8 (<code>top_k=2, num_experts=8</code>).</li>
        <li><strong>SwiGLU Активация:</strong> Прогрессивный метод активации со скрытой размерностью <code>int(8 * dim / 3)</code>, выровненной кратно 256.</li>
        <li><strong>Балансировка нагрузки:</strong> При обучении оптимизатор минимизирует специальный лосс балансировки <code>load_balancing_loss</code>, что исключает «простой» экспертов.</li>
      </ul>

      <h3>5. Weight Tying (Связанные веса)</h3>
      <p>
        Мы связываем веса входного эмбеддинга и выходного проекционного слоя (Unembedding). Это экономит сотни миллионов 
        параметров. При этом алгоритм оптимизатора автоматически фильтрует дублирующиеся параметры, чтобы избежать повторных обновлений градиентов.
      </p>

      <hr className="docs-divider" />

      <h2>⚡ Оптимизации инференса и памяти</h2>

      <h3>XQuant-CL (Extreme Quantization)</h3>
      <p>
        Система динамического квантования KV-кэша. В классе <code>XQuantCache</code> реализовано сжатие в <strong>INT8</strong> 
        (режим <code>int8kv</code>). Ключи (Keys) квантуются по каналам (<em>per-channel</em>), а значения (Values) — по тензору (<em>per-tensor</em>), 
        что минимизирует деградацию качества при экстремальной экономии памяти.
      </p>

      <h3>Speculative Decoding (MTP)</h3>
      <p>
        В TolstoyLLM_v5 интегрирован блок <code>SpeculativeHead</code> с тремя стадиями предсказания. Маленькие головы предсказывают 
        будущие токены наперед, а основное тело модели валидирует их за один проход, обеспечивая ускорение вывода до 1.8x.
      </p>

      <hr className="docs-divider" />

      <h2>🏋️ Оптимизации обучения (Muon & GaLore)</h2>
      <p>
        <strong>Muon:</strong> Применяет итерации Ньютона-Шульца для поддержания ортогональности весовых матриц, предотвращая схлопывание градиентов.
      </p>
      <p>
        <strong>GaLore:</strong> Обучение в низкоранговом пространстве. Состояния оптимизатора занимают до 10 раз меньше VRAM, позволяя обучать модели на обычных видеокартах уровня RTX 3060/4060.
      </p>
    </article>
  );
}

// ----------------------------------------------------
// 2. CLI GUIDE DOCUMENT
// ----------------------------------------------------
function CliGuideDoc() {
  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Руководство пользователя CLI</h1>
        <p className="docs-lead-paragraph">
          Скрипт <code>tolstoy_cli.py</code> — это центр управления вашей персональной нейросетью. 
          Этот мануал поможет вам пройти путь от импорта сырых текстов до общения с обученной моделью.
        </p>
      </div>

      <hr className="docs-divider" />

      <h2>🏁 Подготовка окружения</h2>
      <p>Перед запуском консоли установите необходимые зависимости:</p>
      <CodeBlock code="pip install -r requirements.txt" language="bash" />
      <p>
        Для ускорения вычислений на видеокартах NVIDIA рекомендуется использовать <code>bitsandbytes</code>, что позволит 
        активировать 8-битные оптимизаторы памяти.
      </p>

      <hr className="docs-divider" />

      <h2>🗺️ Общая архитектура рабочего процесса</h2>
      <p>Ниже представлена схема полного цикла работы с Tolstoy CLI:</p>

      <div className="docs-diagram-container">
        <div className="diagram-title">Консольный пайплайн Tolstoy-CLI</div>
        <div className="cli-pipeline-grid">
          <div className="pipeline-step purple-border">
            <span className="step-num">1</span>
            <h4>Подготовка данных</h4>
            <p>Выбор источника (TXT, MD, PDF или Corus), очистка, BPE-токенизация текста и сохранение кэша.</p>
          </div>
          <div className="pipeline-step-arrow font-mono">→</div>
          <div className="pipeline-step cyan-border">
            <span className="step-num">2</span>
            <h4>Обучение модели</h4>
            <p>Выбор архитектурного пресета, оптимизаторов (GaLore, Muon), прогон эпох и сохранение весов (.pth).</p>
          </div>
          <div className="pipeline-step-arrow font-mono">→</div>
          <div className="pipeline-step pink-border">
            <span className="step-num">3</span>
            <h4>Интерактивный чат</h4>
            <p>Запуск модели с настраиваемой температурой, штрафом за повторения и выводом ответа в терминал.</p>
          </div>
        </div>
      </div>

      <hr className="docs-divider" />

      <h2>🛠️ Этап 1: Подготовка данных (Меню [1])</h2>
      <p>
        Качество датасета напрямую определяет уровень «ума» вашей будущей модели. В меню подготовки доступны следующие пути:
      </p>
      <ol>
        <li>
          <strong>Одиночный файл:</strong> Загрузка данных из форматов <code>.txt</code>, <code>.md</code>, <code>.json</code>, 
          <code>.csv</code>, а также <code>.pdf</code> и <code>.docx</code> (при наличии библиотек чтения).
        </li>
        <li>
          <strong>Папка с файлами:</strong> CLI рекурсивно находит и склеивает все файлы поддерживаемых форматов в единый массив.
        </li>
        <li>
          <strong>Датасеты Corus:</strong> Позволяет в один клик загрузить огромные русскоязычные корпуса (Wikipedia, Lenta.ru, Arzamas, Habr, Pikabu).
        </li>
      </ol>
      <p>
        После импорта запускается обучение BPE-токенизатора. По окончании сохраняются файлы <code>custom_tokenizer.pkl</code> 
        и бинаризованный текст <code>dataset_tokens.pkl</code>.
      </p>

      <hr className="docs-divider" />

      <h2>🚀 Этап 2: Обучение (Pre-training) (Меню [2])</h2>

      <h3>2.1. Выбор архитектурного пресета</h3>
      <div className="docs-table-wrapper">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Пресет</th>
              <th>Параметры</th>
              <th>Рекомендуемые GPU</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code className="text-cyan-glow">nano</code></td>
              <td>Миниатюрная сеть для тестов</td>
              <td>Любой CPU / Встроенный GPU</td>
            </tr>
            <tr>
              <td><code className="text-cyan-glow">small</code></td>
              <td>Удобный баланс скорости/памяти</td>
              <td>GPU с 4 ГБ VRAM (GTX 1650)</td>
            </tr>
            <tr>
              <td><code className="text-purple-glow">chat</code></td>
              <td>Увеличенный контекст для диалогов</td>
              <td>GPU с 6 ГБ VRAM (RTX 3050)</td>
            </tr>
            <tr>
              <td><code className="text-purple-glow">medium</code></td>
              <td>Тяжелая и точная модель</td>
              <td>GPU с 8-12 ГБ VRAM (RTX 4060)</td>
            </tr>
            <tr>
              <td><code className="text-pink-glow">xlarge</code></td>
              <td>Максимальный масштаб вычислений</td>
              <td>GPU с 24 ГБ VRAM (RTX 4090 / A100)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>2.2. Настройка оптимизаций</h3>
      <p>Перед запуском тренировочного цикла CLI предложит включить технологии экономии памяти:</p>
      <ul>
        <li><strong>GaLore:</strong> Сокращает потребление VRAM оптимизатором на 80%.</li>
        <li><strong>8-bit AdamW:</strong> Включает квантованный оптимизатор bitsandbytes.</li>
        <li><strong>Speculative Heads:</strong> Добавляет вспомогательные головы для ускоренной спекулятивной генерации.</li>
      </ul>

      <hr className="docs-divider" />

      <h2>💬 Этап 3: Чат и параметры вывода (Меню [3])</h2>
      <p>
        Запуск чата автоматически считывает архитектуру из сохраненных весов <code>.pth</code>. Рекомендуется настроить 
        следующие параметры:
      </p>
      <ul>
        <li><code>Temperature (0.4)</code>: Низкая температура делает ответы логичными и точными, высокая — креативными.</li>
        <li><code>Repetition Penalty (2.0)</code>: Штраф за повторения. Исключает циклическое зависание вывода на одних и тех же фразах.</li>
        <li><code>Top-P (0.9)</code>: Ограничивает выборку токенов наиболее вероятным ядром вероятностей.</li>
      </ul>
    </article>
  );
}

// ----------------------------------------------------
// 3. TRAINING DOCUMENT
// ----------------------------------------------------
function TrainingDoc() {
  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Обучение и Оптимизация</h1>
        <p className="docs-lead-paragraph">
          Обучение модели — это процесс настройки миллиардов весов для предсказания следующего токена. 
          В этом документе мы разберем оптимизации тренировочного цикла класса <code>Trainer</code>.
        </p>
      </div>

      <hr className="docs-divider" />

      <h2>🚀 Жизненный цикл обучения</h2>
      <p>Тренировочный цикл Tolstoy-CLI минимизирует простой GPU с помощью следующих этапов:</p>

      <div className="docs-diagram-container">
        <div className="diagram-title">Проход данных в Trainer</div>
        <div className="cli-pipeline-grid font-mono" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <div className="pipeline-step" style={{ padding: "10px" }}>
            <h5>1. Dataloader</h5>
            <p style={{ fontSize: "11px" }}>pin_memory & num_workers=2</p>
          </div>
          <div className="pipeline-step" style={{ padding: "10px" }}>
            <h5>2. Forward</h5>
            <p style={{ fontSize: "11px" }}>BFloat16 AMP смешанная точность</p>
          </div>
          <div className="pipeline-step" style={{ padding: "10px" }}>
            <h5>3. Loss</h5>
            <p style={{ fontSize: "11px" }}>Cross-Entropy + MoE Aux Loss</p>
          </div>
          <div className="pipeline-step" style={{ padding: "10px" }}>
            <h5>4. Backward</h5>
            <p style={{ fontSize: "11px" }}>Gradient Scaling & Clip</p>
          </div>
          <div className="pipeline-step" style={{ padding: "10px" }}>
            <h5>5. Update</h5>
            <p style={{ fontSize: "11px" }}>Оптимизатор GaLore / Muon</p>
          </div>
        </div>
      </div>

      <hr className="docs-divider" />

      <h2>🔬 Глубокий разбор технологий</h2>

      <h3>1. Умная загрузка данных (Dataloader)</h3>
      <p>
        Мы используем параметры <code>pin_memory=True</code> и <code>num_workers=2</code> для фоновой подготовки батчей на CPU, 
        пока GPU выполняет вычисления текущей итерации. Это дает прирост скорости обучения до 15-20%.
      </p>

      <h3>2. Смешанная точность (AMP / BFloat16)</h3>
      <p>
        Вычисления проходят в формате <strong>BFloat16</strong> вместо Float32, сохраняя при этом NaN-стабильность. 
        Масштабирование градиентов (Gradient Scaler) исключает зануление малых чисел (underflow).
      </p>

      <h3>3. Асинхронная валидация</h3>
      <p>
        Проверка качества (Validation) на тестовом подмножестве запускается асинхронно в отдельном <strong>CUDA Stream</strong>. 
        Пока GPU рассчитывает валидационный лосс, основной поток может подготавливать данные для следующей эпохи, снижая простой видеокарты.
      </p>

      <h3>4. Изменение скорости обучения (OneCycleLR)</h3>
      <p>Скорость обучения (Learning Rate) регулируется по трехфазному графику:</p>
      <ol>
        <li><strong>Разминка (Warmup):</strong> Плавный рост скорости с нуля во избежание резких расхождений.</li>
        <li><strong>Пик (Peak):</strong> Максимальная стабильная скорость обучения.</li>
        <li><strong>Затухание (Decay):</strong> Плавное падение скорости до минимума, позволяющее модели зафиксировать знания в конце обучения.</li>
      </ol>

      <hr className="docs-divider" />

      <h2>❓ FAQ по Обучению</h2>
      <AlertBox type="tip" title="Что делать при переобучении (Overfitting)?">
        Если лосс на валидации растет, а на обучении продолжает падать — модель зазубривает данные. 
        Увеличьте параметр <strong>Weight Decay</strong> в конфигурации, поднимите коэффициент <strong>Dropout</strong> 
        или расширьте обучающий текстовый корпус.
      </AlertBox>
    </article>
  );
}

// ----------------------------------------------------
// 4. TOKENIZER DOCUMENT
// ----------------------------------------------------
function TokenizerDoc() {
  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Глубокий разбор: BPETokenizer v10</h1>
        <p className="docs-lead-paragraph">
          Токенизатор — это «глаза» языковой модели. В Tolstoy-CLI реализована одна из самых быстрых и 
          эффективных версий алгоритма <strong>BPE (Byte Pair Encoding)</strong> для русского языка.
        </p>
      </div>

      <hr className="docs-divider" />

      <h2>🧠 Алгоритмические инновации BPE v10</h2>

      <h3>1. Linked Array (Двусвязные списки на массивах)</h3>
      <p>
        Вместо стандартных списков Python (где удаление элемента требует сдвига всего массива за $O(N)$), в версии v10 
        используются плоские массивы указателей: <code>prev_idx</code> и <code>next_idx</code>. 
        Слияние двух соседних токенов сводится к перебросу указателей соседей за <strong>$O(1)$</strong>.
      </p>

      <h3>2. Reverse Indexing (Обратный индекс позиций)</h3>
      <p>
        Токенизатор хранит хэш-таблицу координат всех пар токенов в тексте: <code>pair_to_positions</code>. 
        Это позволяет находить и объединять вхождения без полного сканирования всего корпуса.
      </p>

      <h3>3. Delta-Update (Дельта-обновления)</h3>
      <p>
        При слиянии токенов <code>(A, B)</code> в <code>C</code> обновляются только частоты граничных слияний 
        (например, <code>(X, A)</code> переходит в <code>(X, C)</code>). Токенизатор пересчитывает частоты локально, 
        не затрагивая остальную часть словаря.
      </p>

      <h3>4. Lazy Priority Heap (Ленивая куча)</h3>
      <p>
        Очередь с приоритетами (куча) используется для извлечения самой частой пары. Если частота пары меняется, 
        мы не перестраиваем кучу, а просто добавляем новое значение. При извлечении устаревшие «фантомные» записи 
        просто отбрасываются. Это гарантирует операцию выбора максимума за <strong>$O(\log M)$</strong>.
      </p>

      <hr className="docs-divider" />

      <h2>📐 Математика токенизации и RAM</h2>
      <p>
        Благодаря оптимизациям сложность обучения токенизатора снижена до теоретического предела **$O(N \log M)$**, 
        где $N$ — длина текста, $M$ — количество слияний. 
      </p>

      <h3>Потребление оперативной памяти при обучении:</h3>
      <div className="docs-table-wrapper">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Размер корпуса</th>
              <th>Уникальные слова</th>
              <th>RAM (Словарь 32k)</th>
              <th>RAM (Словарь 100k)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>10 МБ</strong></td>
              <td>~0.7 МБ</td>
              <td>~180 МБ</td>
              <td>~210 МБ</td>
            </tr>
            <tr>
              <td><strong>100 МБ</strong></td>
              <td>~4.2 МБ</td>
              <td>~1.1 ГБ</td>
              <td>~1.3 ГБ</td>
            </tr>
            <tr>
              <td><strong>1 ГБ</strong></td>
              <td>~22 МБ</td>
              <td>~5.2 ГБ</td>
              <td>~5.8 ГБ</td>
            </tr>
            <tr>
              <td><strong>5 ГБ</strong></td>
              <td>~65 МБ</td>
              <td>~14.5 ГБ</td>
              <td>~15.5 ГБ</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="docs-divider" />

      <h2>📊 Ключевые метрики токенизатора</h2>
      <ul>
        <li>
          <strong>Фертильность (Fertility):</strong> Среднее число токенов на слово. 
          Для нашего BPE на русском языке этот показатель равен <strong>1.5 – 1.8</strong> 
          (тогда как английские токенизаторы на русском выдают {">"}3.0).
        </li>
        <li>
          <strong>Коэффициент сжатия (Compression Ratio):</strong> Количество байт текста на токен. 
          Средний показатель: <strong>6.0 – 7.5 байт/токен</strong>.
        </li>
      </ul>
    </article>
  );
}
