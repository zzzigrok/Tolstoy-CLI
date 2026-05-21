import { useState, useEffect, useRef } from "react";
import { GitHubIcon } from "./Icons";

// KaTeX dynamic math renderer component
function Math({ formula, block = false }: { formula: string; block?: boolean }) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && (window as any).katex) {
      try {
        (window as any).katex.render(formula, containerRef.current, {
          displayMode: block,
          throwOnError: false
        });
      } catch (err) {
        console.error("KaTeX error:", err);
      }
    }
  }, [formula, block]);

  if (block) {
    return <div ref={containerRef} className="katex-block-container" />;
  }
  return <span ref={containerRef} className="katex-inline-container" />;
}

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
    { 
      category: "ОСНОВНОЕ",
      items: [
        { id: "architecture", label: "🏗️ Архитектура модели", desc: "Подробный разбор TolstoyLLM_v5" },
        { id: "cli_guide", label: "🗺️ Руководство CLI", desc: "Мануал по управлению через консоль" },
        { id: "training", label: "🔬 Обучение и оптимизация", desc: "GaLore, Muon и валидация" },
        { id: "tokenizer", label: "🧠 BPE Токенизатор", desc: "Детали алгоритма BPETokenizer v10" },
      ]
    },
    {
      category: "ТЕХНИЧЕСКИЕ РАЗБОРЫ",
      items: [
        { id: "rope_yarn", label: "🌀 RoPE & YaRN", desc: "Ротационные эмбеддинги и экстраполяция" },
        { id: "moe_swiglu", label: "🧩 Sparse MoE", desc: "Смесь экспертов и активация SwiGLU" },
        { id: "speculative", label: "🐣 Speculative Decoding", desc: "Ускорение через Multi-Token Prediction" },
      ]
    },
    {
      category: "ТУТОРИАЛЫ",
      items: [
        { id: "dataset_guide", label: "📂 Создание датасета", desc: "Стратегии сбора и очистки данных" },
        { id: "training_guide_doc", label: "🏋️ Мастер-класс обучения", desc: "Тюнинг параметров и мониторинг" },
      ]
    }
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
            {docsMenu.map((group) => (
              <div key={group.category} className="docs-nav-group">
                <div className="docs-nav-category-header">{group.category}</div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDoc(item.id)}
                    className={`docs-nav-item ${activeDoc === item.id ? "active" : ""}`}
                  >
                    <div className="docs-nav-item-label">{item.label}</div>
                    <div className="docs-nav-item-desc">{item.desc}</div>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="docs-main-content">
          {activeDoc === "architecture" && <ArchitectureDoc />}
          {activeDoc === "cli_guide" && <CliGuideDoc />}
          {activeDoc === "training" && <TrainingDoc />}
          {activeDoc === "tokenizer" && <TokenizerDoc />}
          {activeDoc === "rope_yarn" && <RoPEYaRNDoc />}
          {activeDoc === "moe_swiglu" && <MoEDoc />}
          {activeDoc === "speculative" && <SpeculativeDoc />}
          {activeDoc === "dataset_guide" && <DatasetTutorialDoc />}
          {activeDoc === "training_guide_doc" && <TrainingTutorialDoc />}
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
        этот этап, масштабируя вектор на основе его среднеквадратичной мощности. Это дает прирост скорости без потери качества:
      </p>

      <Math formula="a_i = \frac{x_i}{\text{RMS}(x)} g_i" block={true} />

      <p>где среднеквадратичное отклонение рассчитывается следующим образом:</p>

      <Math formula="\text{RMS}(x) = \sqrt{\frac{1}{d} \sum_{j=1}^d x_j^2 + \epsilon}" block={true} />

      <AlertBox type="info" title="Реализация в коде (models/layers.py)">
        Мы строго контролируем точность вычислений. В коде используется принудительное приведение к Float32 перед вычислением квадратов:
        <code>x_f32 = x.float()</code>, затем вычисляется среднее квадратов, и только перед выводом результат приводится обратно к исходному типу (FP16/BF16), что предотвращает <strong>NaN-stability</strong> ошибки при переполнениях.
      </AlertBox>

      <CodeBlock code={`class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x):
        x_f32 = x.float()
        norm = x_f32.pow(2).mean(-1, keepdim=True)
        output_f32 = (x_f32 * torch.rsqrt(norm + self.eps)) * self.weight.float()
        return output_f32.type_as(x)`} language="python" />

      <h3>2. RoPE (Rotary Positional Embeddings) + YaRN</h3>
      <p>
        Вместо сложения позиционных векторов с токенами, RoPE применяет математическую матрицу вращения в комплексном пространстве. 
        Вращение 2D-вектора на позиционном шаге <Math formula="m" /> вычисляется по формуле:
      </p>

      <Math formula="\begin{pmatrix} x'_1 \\ x'_2 \end{pmatrix} = \begin{pmatrix} \cos m\theta_i & -\sin m\theta_i \\ \sin m\theta_i & \cos m\theta_i \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}" block={true} />

      <p>
        Мы также внедрили <strong>YaRN (Yet another RoPE extension)</strong> для динамической экстраполяции длины контекста. 
        Частота вращения масштабируется при выходе за пределы стандартного контекста с помощью коэффициента <Math formula="s" />:
      </p>

      <Math formula="\theta_Y = \theta \cdot s^{\frac{d}{d-2}}" block={true} />

      <h3>3. GQA (Grouped Query Attention)</h3>
      <p>
        В стандартном MHA на каждую голову запроса (Query) приходится своя пара Key и Value. В GQA мы группируем запросы. 
        По умолчанию в версии v5 используется соотношение <Math formula="N_{\text{rep}} = N_{\text{head}} / N_{\text{kv\_head}}" />. 
        Если у нас 32 Query-головки и 8 KV-головок, коэффициент повторения <Math formula="N_{\text{rep}} = 4" />. Это экономит до 75% 
        памяти, выделяемой под KV-кэш на длинных сессиях генерации.
      </p>

      <div className="gqa-diagram-box">
        <div className="diagram-title">Группировка Query голов по KV головам (GQA)</div>
        <div className="gqa-groups-grid">
          <div className="gqa-group-card">
            <div className="gqa-kv-header">KV Head 1</div>
            <div className="gqa-queries-row">
              <div className="gqa-q-cell">Q1</div>
              <div className="gqa-q-cell">Q2</div>
              <div className="gqa-q-cell">Q3</div>
              <div className="gqa-q-cell">Q4</div>
            </div>
          </div>
          <div className="gqa-group-card">
            <div className="gqa-kv-header">KV Head 2</div>
            <div className="gqa-queries-row">
              <div className="gqa-q-cell">Q5</div>
              <div className="gqa-q-cell">Q6</div>
              <div className="gqa-q-cell">Q7</div>
              <div className="gqa-q-cell">Q8</div>
            </div>
          </div>
          <div className="gqa-group-card">
            <div className="gqa-kv-header">KV Head 3</div>
            <div className="gqa-queries-row">
              <div className="gqa-q-cell">Q9</div>
              <div className="gqa-q-cell">Q10</div>
              <div className="gqa-q-cell">Q11</div>
              <div className="gqa-q-cell">Q12</div>
            </div>
          </div>
          <div className="gqa-group-card">
            <div className="gqa-kv-header">KV Head 4</div>
            <div className="gqa-queries-row">
              <div className="gqa-q-cell">Q13</div>
              <div className="gqa-q-cell">Q14</div>
              <div className="gqa-q-cell">Q15</div>
              <div className="gqa-q-cell">Q16</div>
            </div>
          </div>
        </div>
      </div>

      <h3>4. Sparse MoE (Mixture of Experts) + SwiGLU</h3>
      <p>
        Вместо одного тяжелого полносвязного слоя мы используем «Смесь экспертов» (Mixture of Experts).
      </p>
      <ul>
        <li><strong>SwiGLU Активация:</strong> Прогрессивный метод активации со скрытой размерностью <Math formula="d_{\text{hidden}} = \text{round}_{256}(\frac{8}{3} d_{\text{model}})" />:
          <Math formula="\text{SwiGLU}(x) = (\text{SiLU}(x W_{\text{gate}}) \cdot x W_{\text{up}}) W_{\text{down}}" block={true} />
          где <Math formula="\text{SiLU}(x) = x \cdot \sigma(x) = \frac{x}{1 + e^{-x}}" /> — функция активации Swish.
        </li>
        <li><strong>Маршрутизатор (Router):</strong> Для каждого токена выбираются <Math formula="2" /> лучших эксперта из <Math formula="8" /> на основе распределения вероятностей:
          <Math formula="P_i(x) = \text{Softmax}(W_g x)_i" block={true} />
        </li>
        <li><strong>Балансировка нагрузки:</strong> При обучении оптимизатор минимизирует вспомогательный лосс:
          <Math formula="L_{\text{aux}} = \alpha \cdot N \sum_{i=1}^N f_i \cdot P_i" block={true} />
          что исключает «простой» экспертов и балансирует пропускную способность.
        </li>
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
        Система динамического квантования KV-кэша. В классе <code>XQuantCache</code> реализовано сжатие в <strong>INT8</strong>:
      </p>
      <Math formula="s = \frac{\max(|t|)}{127}, \quad t_q = \text{round}\left(\frac{t}{s}\right)" block={true} />
      <p>Деквантование производится обратным умножением:</p>
      <Math formula="t = t_q \cdot s" block={true} />
      <p>
        Ключи (Keys) квантуются по каналам, а значения (Values) — по тензору, что гарантирует высокую точность и экономию RAM.
      </p>

      <h3>Speculative Decoding (MTP)</h3>
      <p>
        В TolstoyLLM_v5 интегрирован блок <code>SpeculativeHead</code> с тремя стадиями предсказания. Маленькие головы предсказывают 
        будущие токены наперед, а основное тело модели валидирует их за один проход, обеспечивая ускорение вывода до 1.8x.
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
            <p>Выбор источника (TXT, MD, PDF или Corus), BPE-токенизация текста и сохранение кэша.</p>
          </div>
          <div className="pipeline-step-arrow font-mono">→</div>
          <div className="pipeline-step cyan-border">
            <span className="step-num">2</span>
            <h4>Обучение модели</h4>
            <p>Выбор пресета, оптимизаторов (GaLore, Muon), прогон эпох и сохранение весов (.pth).</p>
          </div>
          <div className="pipeline-step-arrow font-mono">→</div>
          <div className="pipeline-step pink-border">
            <span className="step-num">3</span>
            <h4>Интерактивный чат</h4>
            <p>Запуск модели с настраиваемой температурой, штрафом за повторения и выводом в терминал.</p>
          </div>
        </div>
      </div>

      <hr className="docs-divider" />

      <h2>🛠️ Инструкция по командам</h2>
      
      <h3>1. Импорт и очистка данных</h3>
      <p>Выполняется через интерактивное меню (пункт [1]) или напрямую:</p>
      <CodeBlock code="python tolstoy_cli.py prepare --input_path ./data/war_and_peace.txt" language="bash" />
      
      <h3>2. Запуск процесса обучения</h3>
      <p>Начать тренировку с параметрами GaLore и Muon:</p>
      <CodeBlock code="python tolstoy_cli.py train --preset small --use_galore --use_muon --epochs 5" language="bash" />

      <h3>3. Интерактивный запуск чата</h3>
      <p>Запустить модель в режиме диалога:</p>
      <CodeBlock code="python tolstoy_cli.py chat --checkpoint ./checkpoints/model_best.pth --temperature 0.7 --top_p 0.9" language="bash" />

      <hr className="docs-divider" />

      <h2>🚀 Архитектурные Пресеты</h2>
      <div className="docs-table-wrapper">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Пресет</th>
              <th>Размерность (dim)</th>
              <th>Слои (layers)</th>
              <th>Головы (heads)</th>
              <th>Рекомендуемые GPU</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code className="text-cyan-glow">nano</code></td>
              <td>256</td>
              <td>4</td>
              <td>8</td>
              <td>Любой CPU / Встроенный GPU</td>
            </tr>
            <tr>
              <td><code className="text-cyan-glow">small</code></td>
              <td>512</td>
              <td>8</td>
              <td>8</td>
              <td>GPU с 4 ГБ VRAM (GTX 1650)</td>
            </tr>
            <tr>
              <td><code className="text-purple-glow">chat</code></td>
              <td>768</td>
              <td>12</td>
              <td>12</td>
              <td>GPU с 6 ГБ VRAM (RTX 3050)</td>
            </tr>
            <tr>
              <td><code className="text-purple-glow">medium</code></td>
              <td>1024</td>
              <td>16</td>
              <td>16</td>
              <td>GPU с 8-12 ГБ VRAM (RTX 4060)</td>
            </tr>
            <tr>
              <td><code className="text-pink-glow">xlarge</code></td>
              <td>2048</td>
              <td>24</td>
              <td>32</td>
              <td>GPU с 24 ГБ VRAM (RTX 4090 / A100)</td>
            </tr>
          </tbody>
        </table>
      </div>
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

      <h2>🔬 Глубокий разбор технологий оптимизации памяти</h2>

      <h3>1. GaLore (Gradient Low-Rank Projection)</h3>
      <p>
        GaLore минимизирует требования к памяти, проецируя градиент весов <Math formula="G" /> в низкоранговое пространство:
      </p>
      <Math formula="G_{\text{proj}} = U^T G V" block={true} />
      <p>Оптимизатор Adam обновляет состояния в сжатом виде:</p>
      <Math formula="P_{t+1} = \text{Adam}(G_{\text{proj}})" block={true} />
      <p>Итоговый весовой шаг реконструируется обратной проекцией:</p>
      <Math formula="\Delta W = U P_{t+1} V^T" block={true} />

      <div className="galore-flow-container">
        <div className="diagram-title">Этапы сжатия GaLore</div>
        <div className="galore-grid">
          <div className="galore-step">
            <h4>1. Проекция градиента</h4>
            <p><Math formula="G_{\text{proj}} = U^T G V" block={false} /></p>
            <p>Сжатие градиента в низкоранговую форму</p>
          </div>
          <div className="galore-arrow">→</div>
          <div className="galore-step">
            <h4>2. Оптимизация AdamW</h4>
            <p><Math formula="P_{t+1} = \text{Adam}(G_{\text{proj}})" block={false} /></p>
            <p>Накопление моментов в сжатом пространстве (VRAM -80%)</p>
          </div>
          <div className="galore-arrow">→</div>
          <div className="galore-step">
            <h4>3. Реконструкция</h4>
            <p><Math formula="\Delta W = U P_{t+1} V^T" block={false} /></p>
            <p>Обратное проецирование для обновления весов W</p>
          </div>
        </div>
      </div>

      <h3>2. Muon (Ньютон-Шульц ортогонализация весов)</h3>
      <p>
        Оптимизатор Muon применяет итерационный метод Ньютона-Шульца для получения ортогональных весовых матриц, 
        что ускоряет сходимость. Инициализация первого шага:
      </p>
      <Math formula="V_0 = \frac{G}{\|G\|_F}" block={true} />
      <p>Каждая последующая итерация (всего 5-6 шагов) вычисляется как:</p>
      <Math formula="V_{k+1} = \frac{1}{2} V_k (3I - V_k^T V_k)" block={true} />

      <div className="muon-cycle-container">
        <div className="muon-node">
          <strong>Шаг 1: Инициализация</strong>
          <Math formula="V_0 = \frac{G}{\|G\|_F}" block={false} />
        </div>
        <div className="muon-arrow">→</div>
        <div className="muon-node">
          <strong>Шаг 2: Масштабирование</strong>
          <Math formula="V_k \times (3I - V_k^T V_k)" block={false} />
        </div>
        <div className="muon-arrow">→</div>
        <div className="muon-node">
          <strong>Шаг 3: Итерация Ньютона</strong>
          <Math formula="V_{k+1} = \frac{1}{2} V_{k+1}" block={false} />
        </div>
        <div className="muon-arrow">↺</div>
      </div>

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
        Вместо стандартных списков Python (где удаление элемента требует сдвига всего массива за <Math formula="O(N)" />), в версии v10 
        используются плоские массивы указателей: <code>prev_idx</code> и <code>next_idx</code>. 
        Слияние двух соседних токенов сводится к перебросу указателей соседей за <strong><Math formula="O(1)" /></strong>.
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
        просто отбрасываются. Это гарантирует операцию выбора максимума за <strong><Math formula="O(\log M)" /></strong>.
      </p>

      <hr className="docs-divider" />

      <h2>📐 Математика токенизации и RAM</h2>
      <p>
        Благодаря оптимизациям сложность обучения токенизатора снижена до теоретического предела <strong><Math formula="O(N \log M)" /></strong>, 
        где <Math formula="N" /> — длина текста, <Math formula="M" /> — количество слияний. 
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

// ----------------------------------------------------
// 5. RoPE & YaRN DOCUMENT
// ----------------------------------------------------
function RoPEYaRNDoc() {
  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>RoPE & YaRN: Ротационные Позиционные Эмбеддинги</h1>
        <p className="docs-lead-paragraph">
          В TolstoyLLM_v5 мы используем <strong>RoPE (Rotary Positional Embeddings)</strong> для кодирования позиций и 
          <strong>YaRN (Yet another RoPE extension)</strong> для динамической экстраполяции длины контекста.
        </p>
      </div>

      <hr className="docs-divider" />

      <h2>🌀 Суть метода RoPE</h2>
      <p>
        Вместо сложения векторов, мы вращаем их в 2D-плоскостях. Это позволяет модели естественным образом улавливать 
        относительные расстояния между токенами через угол поворота.
      </p>

      <Math formula="\mathbf{R}_{\Theta, m}^d \mathbf{x} = \begin{pmatrix} \cos m\theta_1 & -\sin m\theta_1 & 0 & 0 \\ \sin m\theta_1 & \cos m\theta_1 & 0 & 0 \\ 0 & 0 & \cos m\theta_2 & -\sin m\theta_2 \\ 0 & 0 & \sin m\theta_2 & \cos m\theta_2 \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \\ x_3 \\ x_4 \end{pmatrix}" block={true} />

      <h3>Почему это лучше абсолютных позиций?</h3>
      <ul>
        <li><strong>Относительность:</strong> Скалярное произведение двух векторов зависит только от разности их позиций <Math formula="m-n" />.</li>
        <li><strong>Затухание:</strong> С увеличением расстояния корреляция между токенами плавно затухает, что соответствует лингвистической логике.</li>
      </ul>

      <hr className="docs-divider" />

      <h2>🚀 Экстраполяция через YaRN</h2>
      <p>
        YaRN позволяет модели работать с контекстом, превышающим тренировочный (например, с 2048 до 8192 токенов), 
        без катастрофической потери качества.
      </p>

      <AlertBox type="info" title="NTK-Aware Scaling">
        Мы не просто растягиваем позиции, а применяем "умное" масштабирование частот, сохраняя высокую точность на близких 
        расстояниях и расширяя горизонт на дальних.
      </AlertBox>

      <CodeBlock code={`def precompute_freqs_cis(dim, end, theta=10000.0, scaling_factor=1.0):
    if scaling_factor > 1.0:
        # NTK-Aware Scaling для YaRN
        theta = theta * (scaling_factor ** (dim / (dim - 2)))
    
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2)[: (dim // 2)].float() / dim))
    t = torch.arange(end, device=freqs.device)
    freqs = torch.outer(t, freqs).float()
    return torch.polar(torch.ones_like(freqs), freqs)`} language="python" />
    </article>
  );
}
