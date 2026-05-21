import { useState } from "react";
import { Math, CodeBlock, AlertBox } from "./DocsView";

// Generic Tab component
export function DocTabs({ tabs, accent = "cyan" }: { 
  tabs: { id: string; label: string; content: React.ReactNode }[],
  accent?: "cyan" | "purple" | "pink"
}) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className={`doc-tabs-container accent-${accent}`}>
      <div className="doc-tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`doc-tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="doc-tab-content">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 1. ARCHITECTURE DOCUMENT
// ----------------------------------------------------
export function ArchitectureDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🏗️ Общая топология модели</h2>
          <p>
            <strong>TolstoyLLM_v5</strong> — это современная языковая модель на базе архитектуры <strong>Transformer (decoder-only)</strong>. 
            Основная цель версии v5 — достижение максимального качества на русском языке при минимальном потреблении 
            видеопамяти (VRAM).
          </p>
          <p>
            В отличие от классического трансформера, мы используем <strong>Pre-Norm</strong> структуру (нормализация перед 
            слоем внимания и FFN) и <strong>Parallel Residuals</strong> (параллельные остаточные связи) для максимальной 
            стабильности глубоких градиентных потоков.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Архитектура слоя Transformer v5</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Входные токены [B, T]</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">
                <div className="sub-node">RMSNorm (QK-Norm включен)</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node highlight-cyan">GQA + RoPE Attention</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">Сложение Residual Connection</div>
              </div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">
                <div className="sub-node">RMSNorm</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node highlight-purple">Sparse MoE / SwiGLU FFN</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">Сложение Residual Connection</div>
              </div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node output-node">Выходной логит [B, T, V]</div>
            </div>
          </div>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>1. RMSNorm (Root Mean Square Layer Normalization)</h3>
          <p>Мы используем Float32 для промежуточных вычислений нормализации, что предотвращает ошибки NaN при переполнениях.</p>
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
          
          <h3>2. GQA (Grouped Query Attention)</h3>
          <p>Для экономии памяти KV-кэша мы группируем запросы. На 4 Query-головки приходится 1 голова Key/Value.</p>
          <CodeBlock code={`# В MultiheadSelfAttention.forward
keys = repeat_interleave(keys, n_rep)
values = repeat_interleave(values, n_rep)
# Используем оптимизированный SDPA
output = F.scaled_dot_product_attention(queries, keys, values, mask)`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Формула RMSNorm</h3>
          <Math formula="a_i = \frac{x_i}{\text{RMS}(x)} g_i, \quad \text{RMS}(x) = \sqrt{\frac{1}{d} \sum_{j=1}^d x_j^2 + \epsilon}" block={true} />
          
          <h3>Grouped Query Attention (GQA)</h3>
          <p>Коэффициент повторения KV-голов:</p>
          <Math formula="N_{\text{rep}} = N_{\text{head}} / N_{\text{kv\_head}}" block={true} />
          
          <h3>Связанные веса (Weight Tying)</h3>
          <p>Мы связываем веса входного эмбеддинга и выходного проекционного слоя:</p>
          <Math formula="W_{\text{out}} = W_{\text{emb}}^T" block={true} />
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему SwiGLU лучше ReLU?</h3>
          <p>SwiGLU не имеет "мертвых зон" и плавно активируется, что позволяет градиентам течь свободнее, улучшая обучение глубоких сетей.</p>
          
          <h3>Что такое QK-Norm?</h3>
          <p>Это применение RMSNorm к Query и Key до вычисления внимания. Это предотвращает взрыв логитов и делает обучение более стабильным.</p>
          
          <h3>Можно ли отключить MoE?</h3>
          <p>Да, установите <code>num_experts=1</code> в конфигурации. Модель превратится в классическую "плотную" сеть.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Архитектура и Модели</h1>
        <p className="docs-lead-paragraph">Подробный технический разбор архитектуры TolstoyLLM_v5.</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 2. CLI GUIDE DOCUMENT
// ----------------------------------------------------
export function CliGuideDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🗺️ Рабочий процесс CLI</h2>
          <p>Скрипт <code>tolstoy_cli.py</code> — это центр управления вашей персональной нейросетью.</p>
          
          <div className="docs-diagram-container">
            <div className="diagram-title">Консольный пайплайн Tolstoy-CLI</div>
            <div className="cli-pipeline-grid">
              <div className="pipeline-step purple-border">
                <span className="step-num">1</span>
                <h4>Датасет</h4>
                <p>Выбор источника, BPE-токенизация и сохранение кэша.</p>
              </div>
              <div className="pipeline-step-arrow font-mono">→</div>
              <div className="pipeline-step cyan-border">
                <span className="step-num">2</span>
                <h4>Обучение</h4>
                <p>Выбор пресета, запуск оптимизаторов и сохранение весов.</p>
              </div>
              <div className="pipeline-step-arrow font-mono">→</div>
              <div className="pipeline-step pink-border">
                <span className="step-num">3</span>
                <h4>Чат</h4>
                <p>Интерактивное общение с обученной моделью.</p>
              </div>
            </div>
          </div>

          <h3>Системный монитор (Меню [4])</h3>
          <p>Встроенный монитор отображает статус CUDA, поддержку FlashAttention, а также использование RAM и VRAM в реальном времени.</p>
        </>
      )
    },
    {
      id: "commands",
      label: "КОМАНДЫ",
      content: (
        <>
          <h3>Основные команды</h3>
          <p>1. Подготовка датасета:</p>
          <CodeBlock code="python tolstoy_cli.py prepare --input_path ./data/war_and_peace.txt" language="bash" />
          
          <p>2. Запуск обучения:</p>
          <CodeBlock code="python tolstoy_cli.py train --preset small --use_galore --use_muon" language="bash" />
          
          <p>3. Интерактивный чат:</p>
          <CodeBlock code="python tolstoy_cli.py chat --checkpoint ./checkpoints/model_best.pth --temperature 0.7" language="bash" />
        </>
      )
    },
    {
      id: "presets",
      label: "ПРЕСЕТЫ",
      content: (
        <>
          <h3>Архитектурные Пресеты</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Пресет</th><th>Слои</th><th>Головы</th><th>Рекомендуемая GPU</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>nano</strong></td><td>4</td><td>8</td><td>CPU / Встроенный GPU</td></tr>
                <tr><td><strong>small</strong></td><td>8</td><td>8</td><td>GTX 1650 (4 ГБ)</td></tr>
                <tr><td><strong>chat</strong></td><td>12</td><td>12</td><td>RTX 3050 (6 ГБ)</td></tr>
                <tr><td><strong>medium</strong></td><td>16</td><td>16</td><td>RTX 4060 (8-12 ГБ)</td></tr>
                <tr><td><strong>xlarge</strong></td><td>24</td><td>32</td><td>RTX 4090 (24 ГБ)</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "troubleshooting",
      label: "FAQ",
      content: (
        <>
          <h3>CUDA Out of Memory</h3>
          <p>Убедитесь, что включили <strong>GaLore</strong> или выберите пресет поменьше. Также попробуйте режим <code>int8kv</code> для KV-кэша.</p>
          
          <h3>Ошибка чтения файлов</h3>
          <p>Убедитесь, что файлы имеют кодировку UTF-8. Для PDF/DOCX требуются установленные библиотеки <code>PyPDF2</code> и <code>python-docx</code>.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Руководство пользователя CLI</h1>
        <p className="docs-lead-paragraph">Мануал по управлению вашей персональной нейросетью через консоль.</p>
      </div>
      <DocTabs tabs={tabs} accent="purple" />
    </article>
  );
}

// ----------------------------------------------------
// 3. TRAINING DOCUMENT
// ----------------------------------------------------
export function TrainingDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🚀 Жизненный цикл обучения</h2>
          <p>Обучение модели — это процесс настройки миллиардов весов для предсказания следующего токена.</p>
          
          <div className="docs-diagram-container">
            <div className="diagram-title">Пайплайн обучения</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Батч токенов [B, T]</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">Forward Pass (Loss Calculation)</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">Backward Pass (AMP Gradient Scaling)</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node highlight-purple">Оптимизаторы: GaLore / Muon / AdamW</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node output-node">Обновление весов + Step Scheduler</div>
            </div>
          </div>
        </>
      )
    },
    {
      id: "tech",
      label: "ТЕХНОЛОГИИ",
      content: (
        <>
          <h3>1. Умная загрузка данных</h3>
          <p>Использование <code>pin_memory</code> и <code>num_workers</code> позволяет готовить данные на CPU, пока GPU занят расчетами. Прирост скорости: 15-20%.</p>
          
          <h3>2. Смешанная точность (BFloat16)</h3>
          <p>BFloat16 сохраняет динамический диапазон Float32, но занимает в 2 раза меньше памяти, ускоряя обучение на тензорных ядрах NVIDIA.</p>
          
          <h3>3. Асинхронная валидация</h3>
          <p>Запуск проверки качества в отдельном CUDA Stream позволяет не останавливать процесс обучения, снижая простой GPU на 10%.</p>
        </>
      )
    },
    {
      id: "scheduler",
      label: "ONE CYCLE",
      content: (
        <>
          <h3>Управление скоростью обучения</h3>
          <p>Мы используем стратегию <strong>OneCycleLR</strong>:</p>
          <ol>
            <li><strong>Warmup:</strong> Плавный рост LR во избежание резких расхождений.</li>
            <li><strong>Peak:</strong> Максимальная стабильная скорость обучения.</li>
            <li><strong>Decay:</strong> Затухание до минимума для фиксации знаний.</li>
          </ol>
          <AlertBox type="tip" title="Early Stopping">Тренер автоматически остановит обучение, если лосс на валидации начнет расти.</AlertBox>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Что такое Gradient Accumulation?</h3>
          <p>Это способ имитации большого батча на маленькой видеокарте путем сложения градиентов за несколько шагов перед обновлением весов.</p>
          
          <h3>Почему Val Loss выше Train Loss?</h3>
          <p>Это нормально. На обучении модель видит данные много раз. Если разрыв критический — увеличьте <strong>Weight Decay</strong> или <strong>Dropout</strong>.</p>
          
          <h3>Влияет ли torch.compile на качество?</h3>
          <p>Нет, только на скорость. Это JIT-компиляция, ускоряющая процесс на 15-30%.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Обучение и Оптимизация</h1>
        <p className="docs-lead-paragraph">Глубокое погружение в процессы тренировки нейросети.</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 4. TOKENIZER DOCUMENT
// ----------------------------------------------------
export function TokenizerDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🧠 Алгоритмические инновации BPE v10</h2>
          <p>Токенизатор — это «глаза» языковой модели. Мы реализовали версию BPE со сложностью <strong><Math formula="O(N \log M)" /></strong>.</p>
          
          <ul>
            <li><strong>Linked Array:</strong> Двусвязные списки на плоских массивах превращают слияние в <Math formula="O(1)" />.</li>
            <li><strong>Reverse Indexing:</strong> Хэш-таблица координат пар для мгновенного поиска вхождений.</li>
            <li><strong>Delta-Update:</strong> Локальный пересчет частот при слиянии без сканирования всего корпуса.</li>
            <li><strong>Lazy Priority Heap:</strong> Очередь с приоритетами для выбора лучшей пары за <Math formula="O(\log M)" />.</li>
          </ul>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Пре-токенизация (Regex)</h3>
          <p>Мы используем регулярное выражение для сохранения слов с дефисами как единых блоков:</p>
          <CodeBlock code={`RU_PATTERN = re.compile(
    r""" ?[а-яА-ЯёЁa-zA-Z]+-[а-яА-ЯёЁa-zA-Z]+| ?\\w+| ?[^\\s\\w]+|\\s+(?!\\S)|\\s+"""
)`} language="python" />
          
          <h3>Иерархическое слияние по рангу</h3>
          <p>Во время инференса используется <strong>Rank-based Merge</strong> со сложностью <Math formula="O(L \log L)" />.</p>
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Метрики качества</h3>
          <p><strong>Фертильность (Fertility):</strong> Среднее число токенов на слово. Идеал для русского языка: 1.1 – 1.6.</p>
          <Math formula="F = \frac{\sum T_i}{W}" block={true} />
          
          <h3>Потребление RAM (est.)</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Корпус</th><th>Уникальные слова</th><th>RAM (32k)</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>100 МБ</strong></td><td>4.2 МБ</td><td>~1.1 ГБ</td></tr>
                <tr><td><strong>1 ГБ</strong></td><td>22 МБ</td><td>~5.2 ГБ</td></tr>
                <tr><td><strong>5 ГБ</strong></td><td>65 МБ</td><td>~14.5 ГБ</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему не SentencePiece?</h3>
          <p>Наша реализация на чистом Python с оптимизациями показывает сопоставимую скорость, оставаясь прозрачной и легкой для модификации морфологических правил.</p>
          
          <h3>Зачем нужен dataset_tokens.pkl?</h3>
          <p>Это "переваренный" текст. Модель начинает обучение мгновенно, не тратя время на токенизацию при каждом запуске.</p>
          
          <h3>Есть ли токен [UNK]?</h3>
          <p>Нет. Мы используем Byte-level BPE, гарантирующий кодирование любого символа UTF-8 через базовые байты.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Глубокий разбор: BPETokenizer v10</h1>
        <p className="docs-lead-paragraph">Реализация промышленного стандарта BPE для русского языка.</p>
      </div>
      <DocTabs tabs={tabs} accent="purple" />
    </article>
  );
}

// ----------------------------------------------------
// 5. RoPE & YaRN (Expanded Tabbed)
// ----------------------------------------------------
export function RoPEYaRNDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🌀 Суть метода RoPE</h2>
          <p>
            Представьте, что вы читаете предложение: <em>"Кошка поймала мышку"</em>. 
            <strong>RoPE (Роторное позиционное кодирование)</strong> работает как стрелка компаса: оно <strong>поворачивает</strong> вектор слова. 
            Слово на позиции 1 повернуто на 10°, на позиции 2 — на 20°, и так далее.
          </p>
          <p>
            Когда модель сравнивает два слова, она смотрит на <strong>разницу углов</strong> между ними. 
            Это позволяет понимать структуру предложений любой длины, сохраняя относительные расстояния.
          </p>
          <AlertBox type="tip" title="Преимущество">
            В отличие от обычных позиций, RoPE позволяет модели лучше обобщать знания на длинные тексты.
          </AlertBox>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Реализация в TolstoyLLM_v5</h3>
          <p>Функция <code>precompute_freqs_cis</code> рассчитывает частоты вращения заранее:</p>
          <CodeBlock code={`def precompute_freqs_cis(dim, end=2048, theta=10000.0, rope_scaling=None):
    if rope_scaling is not None and rope_scaling > 1.0:
        # NTK-Aware Scaling для YaRN
        theta = theta * (rope_scaling ** (dim / (dim - 2)))
        
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2).float() / dim))
    t = torch.arange(end)
    freqs = torch.outer(t, freqs).float()
    return torch.polar(torch.ones_like(freqs), freqs)`} language="python" />
          <p>Умножение комплексных чисел в <code>apply_rotary_emb</code> автоматически вращает векторы Query и Key.</p>
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Формула вращения</h3>
          <p>Вращение 2D-вектора на шаге <Math formula="m" /> вычисляется как:</p>
          <Math formula="\mathbf{R}_{\Theta, m}^d \mathbf{x} = \begin{pmatrix} \cos m\theta & -\sin m\theta \\ \sin m\theta & \cos m\theta \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}" block={true} />
          <h3>YaRN Экстраполяция</h3>
          <p>Для расширения контекста мы масштабируем базу <Math formula="\theta" />:</p>
          <Math formula="\theta_Y = \theta \cdot s^{\frac{d}{d-2}}" block={true} />
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему theta = 10000?</h3>
          <p>Это эмпирически подобранная константа, которая обеспечивает оптимальное затухание корреляций на больших расстояниях.</p>
          <h3>Влияет ли RoPE на скорость?</h3>
          <p>Практически нет. Благодаря векторным операциям в PyTorch и использованию комплексных чисел, накладные расходы составляют менее 1% времени инференса.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>RoPE & YaRN: Ротационные Эмбеддинги</h1>
        <p className="docs-lead-paragraph">Глубокое погружение в механизмы позиционного кодирования и методы расширения контекста.</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 6. MoE & SwiGLU (Expanded Tabbed)
// ----------------------------------------------------
export function MoEDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🧩 Смесь экспертов (MoE)</h2>
          <p>
            Представьте огромную поликлинику. Раньше каждый токен (пациент) должен был обойти всех врачей. 
            В <strong>Sparse MoE</strong> пациент идет к Маршрутизатору, который выбирает только 2 нужных специалиста из 8.
          </p>
          <div className="docs-diagram-container">
            <div className="diagram-title">Принцип работы Sparse MoE</div>
            <div className="moe-visual-flow">
              <div className="moe-token">Входной токен</div>
              <div className="moe-router-box">Router (Терапевт)</div>
              <div className="moe-split">
                <div className="moe-expert-path active">Эксперт 2 (0.8)</div>
                <div className="moe-expert-path active">Эксперт 5 (0.2)</div>
              </div>
              <div className="moe-merge">Σ Сложение</div>
            </div>
          </div>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Реализация SwiGLU</h3>
          <CodeBlock code={`class FeedForward(nn.Module):
    def __init__(self, dim, hidden_dim):
        super().__init__()
        self.gate_up_proj = nn.Linear(dim, 2 * hidden_dim, bias=False)
        self.w2 = nn.Linear(hidden_dim, dim, bias=False)

    def forward(self, x):
        gate, up = self.gate_up_proj(x).chunk(2, dim=-1)
        return self.w2(F.silu(gate) * up)`} language="python" />
          <p>Мы используем "сплавленный" слой для ускорения вычислений на GPU.</p>
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Лосс балансировки</h3>
          <p>Чтобы эксперты не "простаивали", мы минимизируем вспомогательную функцию потерь:</p>
          <Math formula="L_{\text{aux}} = \alpha \cdot N \sum_{i=1}^N f_i \cdot P_i" block={true} />
          <p>Где <Math formula="f_i" /> — доля токенов, отправленных эксперту <Math formula="i" />, а <Math formula="P_i" /> — уверенность маршрутизатора.</p>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Сколько экспертов лучше?</h3>
          <p>В TolstoyLLM_v5 выбрано 8 экспертов как золотая середина между эффективностью и сложностью обучения. Большее количество требует очень мощных систем для синхронизации градиентов.</p>
          <h3>Растет ли потребление VRAM?</h3>
          <p>Да, веса всех экспертов должны находиться в памяти, но вычислительная нагрузка (FLOPs) остается как у маленькой модели.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Sparse MoE & SwiGLU</h1>
        <p className="docs-lead-paragraph">Разбор масштабируемых архитектур и современных функций активации.</p>
      </div>
      <DocTabs tabs={tabs} accent="purple" />
    </article>
  );
}

// ----------------------------------------------------
// 7. SPECULATIVE DECODING (Expanded Tabbed)
// ----------------------------------------------------
export function SpeculativeDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🐣 Помощник-предсказатель</h2>
          <p>
            Основная модель — умная, но медленная. Мы даем ей помощника (спекулятивные головы), который 
            быстро набрасывает догадки о следующих словах.
          </p>
          <AlertBox type="info" title="Zero-cost Quality">
            Если помощник ошибся, основная модель просто исправляет его. Качество текста всегда остается 
            на уровне основной модели, но скорость растет.
          </AlertBox>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Структура SpeculativeHead</h3>
          <CodeBlock code={`class SpeculativeHead(nn.Module):
    def __init__(self, n_embd, vocab_size, num_stages=3):
        super().__init__()
        self.heads = nn.ModuleList([
            nn.Sequential(
                RMSNorm(n_embd),
                nn.Linear(n_embd, n_embd),
                nn.GELU(),
                nn.Linear(n_embd, vocab_size)
            ) for _ in range(num_stages)
        ])`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Верификация догадок</h3>
          <p>За один проход основной модели мы проверяем сразу <Math formula="N" /> токенов:</p>
          <Math formula="P_{main}(y_k | x_1, \dots, y_{k-1}) > \text{threshold}" block={true} />
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему это ускоряет вывод?</h3>
          <p>LLM ограничены скоростью чтения из памяти. Спекуляция позволяет читать веса модели 1 раз, а получать 3-4 токена за раз.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Speculative Decoding</h1>
        <p className="docs-lead-paragraph">Ускорение генерации через параллельную верификацию догадок.</p>
      </div>
      <DocTabs tabs={tabs} accent="pink" />
    </article>
  );
}

// ----------------------------------------------------
// 8. DATASET TUTORIAL (Expanded Tabbed)
// ----------------------------------------------------
export function DatasetTutorialDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>📂 Искусство создания датасета</h2>
          <p>Качество данных — это "потолок" вашей модели. Мы рекомендуем собирать корпус из разных источников для баланса знаний.</p>
          <table className="docs-table">
            <thead>
              <tr><th>Источник</th><th>Процент</th><th>Навык</th></tr>
            </thead>
            <tbody>
              <tr><td>Wikipedia/Новости</td><td>70%</td><td>Факты и грамматика</td></tr>
              <tr><td>Личные тексты</td><td>20%</td><td>Стиль и душа</td></tr>
              <tr><td>Код/Логика</td><td>10%</td><td>Структурное мышление</td></tr>
            </tbody>
          </table>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Очистка текста в CLI</h3>
          <p>Функция <code>clean_text</code> применяет следующие шаги:</p>
          <ul>
            <li>Sanitization (ASCII 0-31)</li>
            <li>Whitespace Normalization</li>
            <li>Leading/Trailing strip</li>
          </ul>
        </>
      )
    },
    {
      id: "math",
      label: "МАТРИЦА",
      content: (
        <>
          <h3>Объем vs Мозг</h3>
          <p>Рекомендуемые объемы данных для разных пресетов:</p>
          <ul>
            <li><strong>Nano:</strong> 50 КБ - 200 КБ</li>
            <li><strong>Small:</strong> 1 МБ - 5 МБ</li>
            <li><strong>Medium:</strong> 10 МБ - 100 МБ</li>
          </ul>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Нужна ли дедупликация?</h3>
          <p>Да, обязательно. Если один текст встречается 100 раз, модель решит, что это самая важная истина во вселенной.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Создание датасета</h1>
        <p className="docs-lead-paragraph">Гайд по сбору и подготовке текстового корпуса.</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 9. TRAINING TUTORIAL (Expanded Tabbed)
// ----------------------------------------------------
export function TrainingTutorialDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🏋️ Мастер-класс обучения</h2>
          <p>Обучение — это танец между скоростью и памятью. Мы используем OneCycleLR для плавной настройки весов.</p>
          <div className="muon-cycle-container">
            <div className="muon-node"><strong>Warmup</strong>Разогрев LR</div>
            <div className="muon-arrow">→</div>
            <div className="muon-node"><strong>Peak</strong>Максимум</div>
            <div className="muon-arrow">→</div>
            <div className="muon-node"><strong>Decay</strong>Затухание</div>
          </div>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Запуск GaLore</h3>
          <CodeBlock code={`python tolstoy_cli.py train --use_galore --rank 128 --update_proj_gap 200`} language="bash" />
          <p>GaLore позволяет сэкономить до 80% VRAM за счет низкоранговых проекций градиентов.</p>
        </>
      )
    },
    {
      id: "math",
      label: "МЕТРИКИ",
      content: (
        <>
          <h3>Кривые потерь (Loss)</h3>
          <ul>
            <li><strong>Train Loss:</strong> Насколько хорошо модель зубрит.</li>
            <li><strong>Val Loss:</strong> Насколько хорошо модель понимает.</li>
          </ul>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Что делать при перегреве?</h3>
          <p>Ограничьте Power Limit видеокарты через MSI Afterburner до 70-80%. Это снизит температуру на 15°C при потере скорости всего в 5%.</p>
          <AlertBox type="warning" title="Windows Pagefile">Убедитесь, что файл подкачки не менее 32 ГБ!</AlertBox>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Мастер-класс обучения</h1>
        <p className="docs-lead-paragraph">Тюнинг параметров и мониторинг здоровья модели.</p>
      </div>
      <DocTabs tabs={tabs} accent="purple" />
    </article>
  );
}
