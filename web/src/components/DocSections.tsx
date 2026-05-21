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
        Основная цель версии v5 — достижение максимального качества на русском языке при минимальном потреблению 
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
    </article>
  );
}

// ----------------------------------------------------
// 2. CLI GUIDE DOCUMENT
// ----------------------------------------------------
export function CliGuideDoc() {
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
    </article>
  );
}

// ----------------------------------------------------
// 3. TRAINING DOCUMENT
// ----------------------------------------------------
export function TrainingDoc() {
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
        GaLore минимизирует требования к памяти, проецируя градиент весов <Math formula="G" /> в низкоранговое пространство.
      </p>

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
    </article>
  );
}

// ----------------------------------------------------
// 4. TOKENIZER DOCUMENT
// ----------------------------------------------------
export function TokenizerDoc() {
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
        Вместо стандартных списков Python, в версии v10 используются плоские массивы указателей: <code>prev_idx</code> и <code>next_idx</code>. 
        Слияние двух соседних токенов сводится к перебросу указателей соседей за <strong><Math formula="O(1)" /></strong>.
      </p>
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
