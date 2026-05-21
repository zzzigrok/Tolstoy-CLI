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
// 1. ARCHITECTURE DOCUMENT (MAX EXPANDED)
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
            Мы объединили аналогии для новичков, строгую математику и архитектурные диаграммы, чтобы объяснить, как достигается высокая эффективность модели.
          </p>
          <p>
            В отличие от классического трансформера, мы используем <strong>Pre-Norm</strong> структуру (нормализация перед 
            слоем внимания и FFN) и <strong>Parallel Residuals</strong> (параллельные остаточные связи).
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
                <div className="sub-node highlight-purple">Sparse MoE / SwiGLU FFN (8 экспертов)</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">Сложение Residual Connection</div>
              </div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node output-node">Выходной логит [B, T, V]</div>
            </div>
          </div>
          
          <h3>Ключевые фишки v5:</h3>
          <ul>
            <li><strong>Weight Tying:</strong> Общая матрица для входных эмбеддингов и выходной проекции.</li>
            <li><strong>Parallel Residuals:</strong> Сигнал проходит сквозь 30+ слоев без затухания.</li>
            <li><strong>XQuant-CL:</strong> Экстремальное квантование KV-кэша в INT8.</li>
          </ul>

          <h3>Как читать архитектуру на практике</h3>
          <p>
            Каждый слой решает две независимые задачи: attention ищет связи между токенами, а FFN/MoE преобразует найденный контекст
            в новые признаки. Остаточные связи сохраняют исходный сигнал, поэтому даже глубокая модель не теряет информацию из ранних слоев.
          </p>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Компонент</th><th>Что делает</th><th>Почему важен локально</th></tr>
              </thead>
              <tbody>
                <tr><td>RMSNorm</td><td>Стабилизирует масштаб активаций</td><td>Меньше NaN и резких скачков loss</td></tr>
                <tr><td>GQA</td><td>Делит KV-головы между несколькими Query</td><td>Сильно снижает память KV-кэша</td></tr>
                <tr><td>MoE</td><td>Включает только часть экспертов на токен</td><td>Больше параметров без линейного роста FLOPs</td></tr>
                <tr><td>Weight Tying</td><td>Связывает embedding и output head</td><td>Экономит параметры и улучшает согласованность словаря</td></tr>
              </tbody>
            </table>
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
          <p>Реализация в <code>models/layers.py</code> с защитой от переполнения дисперсии (NaN-stability).</p>
          <CodeBlock code={`class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x):
        x_f32 = x.float() # Принудительное Float32 для точности
        norm = x_f32.pow(2).mean(-1, keepdim=True)
        output_f32 = (x_f32 * torch.rsqrt(norm + self.eps)) * self.weight.float()
        return output_f32.type_as(x)`} language="python" />
          
          <h3>2. GQA (Grouped Query Attention)</h3>
          <p>Экономия до 75% памяти KV-кэша. На 4 головы Query приходится 1 голова Key/Value.</p>
          <CodeBlock code={`# В MultiheadSelfAttention.__init__
self.n_kv_head = n_kv_head if n_kv_head is not None else max(1, n_head // 4)
self.n_rep = self.n_head // self.n_kv_head

# В MultiheadSelfAttention.forward
if self.n_rep > 1:
    k = k.repeat_interleave(self.n_rep, dim=1)
    v = v.repeat_interleave(self.n_rep, dim=1)
y = F.scaled_dot_product_attention(q, k, v, is_causal=is_causal)`} language="python" />

          <h3>3. Weight Tying без двойного обновления</h3>
          <p>Входные и выходные веса физически указывают на одну матрицу. Оптимайзер должен видеть ее один раз, иначе градиент будет применяться дважды.</p>
          <CodeBlock code={`# В TolstoyLLM_v5.__init__
self.tok_embeddings = nn.Embedding(vocab_size, n_embd)
self.output = nn.Linear(n_embd, vocab_size, bias=False)
self.output.weight = self.tok_embeddings.weight

# В configure_optimizers
unique_params = {id(p): p for p in self.parameters()}
optimizer = AdamW(unique_params.values(), lr=learning_rate)`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Математика RMSNorm</h3>
          <p>Вместо центрирования данных, RMSNorm масштабирует вектор на основе его среднеквадратичной мощности:</p>
          <Math formula="a_i = \frac{x_i}{\text{RMS}(x)} g_i, \quad \text{RMS}(x) = \sqrt{\frac{1}{d} \sum_{j=1}^d x_j^2 + \epsilon}" block={true} />
          
          <h3>XQuant-CL (INT8 KV Cache)</h3>
          <p>Динамическое квантование по каналам для Ключей и по тензору для Значений:</p>
          <Math formula="s = \frac{\max(|t|)}{127}, \quad t_q = \text{round}\left(\frac{t}{s}\right), \quad t = t_q \cdot s" block={true} />
          
          <h3>Grouped Query Attention (GQA)</h3>
          <Math formula="N_{\text{rep}} = N_{\text{head}} / N_{\text{kv\_head}}" block={true} />

          <h3>Цена словаря и связанный выход</h3>
          <p>Без Weight Tying модель хранит две большие матрицы: embedding и LM head. Связывание весов убирает одну из них:</p>
          <Math formula="\text{Params}_{saved} = |V| \cdot d_{model}" block={true} />
          <p>Для словаря 32k и скрытого размера 2048 это около 65 млн параметров, которые не нужно хранить и обновлять отдельно.</p>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Зачем нужна Pre-Norm структура?</h3>
          <p>Pre-Norm делает градиентные потоки более стабильными, позволяя обучать глубокие сети без сложного подбора Learning Rate и прогрева (warmup).</p>
          
          <h3>Как GQA влияет на качество?</h3>
          <p>Потеря качества составляет менее 1%, при этом потребление памяти падает в 4 раза. Это критично для запуска длинных контекстов (8k+) на локальных GPU.</p>
          
          <h3>Что такое QK-Norm?</h3>
          <p>Это новейшая практика применения RMSNorm к проекциям Query и Key до применения RoPE. Это предотвращает взрыв логитов внимания на больших моделях.</p>

          <h3>Когда стоит отключать MoE?</h3>
          <p>Для самых маленьких пресетов и CPU-экспериментов dense-режим проще диагностировать. Для GPU-обучения и больших корпусов MoE обычно выгоднее: он добавляет емкость без такого же роста времени инференса.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Архитектура и Модели</h1>
        <p className="docs-lead-paragraph">Глубокое погружение в архитектуру Transformer Layer v5, RMSNorm, GQA и Weight Tying.</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 2. CLI GUIDE DOCUMENT (MAX EXPANDED)
// ----------------------------------------------------
export function CliGuideDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🗺️ Архитектура рабочего процесса</h2>
          <p>Скрипт <code>tolstoy_cli.py</code> — это центр управления вашей персональной нейросетью. Пайплайн разделен на 4 этапа.</p>
          
          <div className="docs-diagram-container">
            <div className="diagram-title">Консольный пайплайн Tolstoy-CLI</div>
            <div className="cli-pipeline-grid">
              <div className="pipeline-step purple-border">
                <span className="step-num">1</span>
                <h4>Подготовка данных</h4>
                <p>Выбор источника (TXT, MD, PDF), BPE-токенизация и сохранение кэша.</p>
              </div>
              <div className="pipeline-step-arrow font-mono">→</div>
              <div className="pipeline-step cyan-border">
                <span className="step-num">2</span>
                <h4>Обучение модели</h4>
                <p>Выбор пресета, запуск GaLore/Muon и сохранение весов (.pth).</p>
              </div>
              <div className="pipeline-step-arrow font-mono">→</div>
              <div className="pipeline-step pink-border">
                <span className="step-num">3</span>
                <h4>Интерактивный чат</h4>
                <p>Запуск модели с настраиваемой температурой и Speculative Decoding.</p>
              </div>
            </div>
          </div>

          <h3>Системный монитор (Меню [4])</h3>
          <p>Отображает: Версию PyTorch, статус CUDA, поддержку FlashAttention, JIT-компиляцию, а также использование RAM/VRAM.</p>

          <h3>Какие файлы появляются после каждого этапа</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Этап</th><th>Артефакты</th><th>Для чего нужны</th></tr>
              </thead>
              <tbody>
                <tr><td>Подготовка данных</td><td><code>custom_tokenizer.pkl</code>, <code>dataset_tokens.pkl</code></td><td>Словарь и уже закодированный корпус</td></tr>
                <tr><td>Обучение</td><td><code>model.pth</code>, <code>*_tokenizer.pkl</code></td><td>Веса модели и привязанный токенизатор</td></tr>
                <tr><td>Чат</td><td>История консольной сессии</td><td>Проверка качества, температуры и повторов</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "data",
      label: "ДАННЫЕ",
      content: (
        <>
          <h3>1. Выбор источника данных</h3>
          <ul>
            <li><strong>Одиночный файл:</strong> .txt, .md, .json, .csv, .pdf, .docx.</li>
            <li><strong>Папка с файлами:</strong> Рекурсивный обход и объединение всех текстов.</li>
            <li><strong>Архив Corus:</strong> Доступ к 21 датасету в один клик (Wikipedia, Lenta.ru, Habr).</li>
          </ul>
          <AlertBox type="info" title="Нормализация">При импорте автоматически работает очистка от Unicode-мусора и нормализация пробелов.</AlertBox>
          <p>
            Для JSON и XML CLI извлекает строковые значения рекурсивно, поэтому можно импортировать экспорт мессенджера,
            дамп статей или вложенную коллекцию документов без предварительного превращения в TXT.
          </p>
          <AlertBox type="warning" title="PDF со сканами">PDF без текстового слоя не распознается автоматически. Перед импортом такого файла нужен OCR.</AlertBox>
          <CodeBlock code="python tolstoy_cli.py prepare --input_path ./data/books/" language="bash" />
        </>
      )
    },
    {
      id: "training",
      label: "ОБУЧЕНИЕ",
      content: (
        <>
          <h3>2. Архитектурные Пресеты</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Пресет</th><th>Параметры</th><th>Контекст</th><th>VRAM</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>nano</strong></td><td>~5M</td><td>128</td><td>{"<"} 1 ГБ</td></tr>
                <tr><td><strong>small</strong></td><td>~100M</td><td>512</td><td>2-4 ГБ</td></tr>
                <tr><td><strong>chat</strong></td><td>~150M</td><td>2048</td><td>6 ГБ</td></tr>
                <tr><td><strong>medium</strong></td><td>~350M</td><td>1024</td><td>8-12 ГБ</td></tr>
                <tr><td><strong>xlarge</strong></td><td>~3B+</td><td>2048+</td><td>24 ГБ</td></tr>
              </tbody>
            </table>
          </div>
          <h3>Какие оптимизации включать</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Опция</th><th>Когда включать</th><th>Компромисс</th></tr>
              </thead>
              <tbody>
                <tr><td>GaLore</td><td>Модель не помещается по optimizer state</td><td>Небольшая настройка rank/update_proj_gap</td></tr>
                <tr><td>Muon</td><td>Нужна стабильная сходимость матриц</td><td>Оверхед матричных операций</td></tr>
                <tr><td>Speculative heads</td><td>Планируется быстрый чат</td><td>Около 15% доп. работы при обучении</td></tr>
                <tr><td>int8kv</td><td>Длинный контекст при инференсе</td><td>Минимальная ошибка квантования KV</td></tr>
              </tbody>
            </table>
          </div>
          <CodeBlock code="python tolstoy_cli.py train --preset chat --use_galore --use_muon --epochs 5" language="bash" />
        </>
      )
    },
    {
      id: "troubleshooting",
      label: "FAQ",
      content: (
        <>
          <h3>RuntimeError: CUDA out of memory</h3>
          <p>1. Включите <strong>GaLore</strong> или <strong>8-bit AdamW</strong>.<br/>2. Выберите пресет поменьше.<br/>3. Проверьте режим KV-кэша (int8kv).</p>
          
          <h3>Ошибка чтения файлов</h3>
          <p>Убедитесь, что кодировка UTF-8 или CP1251. Для PDF/DOCX должны быть установлены библиотеки <code>PyPDF2</code> и <code>python-docx</code>.</p>

          <h3>Модель отвечает бессвязно после обучения</h3>
          <p>Сначала проверьте, что чат загрузил токенизатор, созданный вместе с конкретным чекпоинтом. Затем снизьте <code>temperature</code> до 0.4 и увеличьте объем чистого корпуса.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Руководство пользователя CLI</h1>
        <p className="docs-lead-paragraph">Центр управления вашей персональной нейросетью — от сырого текста до умного чата.</p>
      </div>
      <DocTabs tabs={tabs} accent="purple" />
    </article>
  );
}

// ----------------------------------------------------
// 3. TRAINING DOCUMENT (MAX EXPANDED)
// ----------------------------------------------------
export function TrainingDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🚀 Жизненный цикл обучения</h2>
          <p>Тренировочный цикл оптимизирован для максимальной загрузки GPU и минимального простоя (zero bottleneck).</p>
          
          <div className="docs-diagram-container">
            <div className="diagram-title">Этапы прохода градиентов</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Батч токенов [B, T]</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">Forward Pass (BFloat16 AMP)</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">Loss (Cross-Entropy) + Scaler</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node highlight-purple">Optim: GaLore / Muon / AdamW</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node output-node">Weight Update + Step Scheduler</div>
            </div>
          </div>

          <h3>Что происходит на одном шаге обучения</h3>
          <ol>
            <li>DataLoader заранее подготавливает батч токенов и переносит его в pinned memory.</li>
            <li>Forward pass считает логиты и auxiliary loss от MoE, если эксперты включены.</li>
            <li>Cross-Entropy сравнивает предсказания со следующими токенами корпуса.</li>
            <li>Gradient clipping ограничивает экстремальные градиенты перед optimizer step.</li>
            <li>Scheduler обновляет learning rate по фазе OneCycleLR.</li>
          </ol>
        </>
      )
    },
    {
      id: "optim",
      label: "ОПТИМИЗАТОРЫ",
      content: (
        <>
          <h3>1. GaLore (Gradient Low-Rank Projection)</h3>
          <p>GaLore проецирует градиент в низкоранговое пространство, экономя до 82.5% VRAM на состояниях оптимизатора.</p>
          <div className="galore-flow-container">
            <div className="galore-grid">
              <div className="galore-step"><h4>1. SVD Проекция</h4><p>G_proj = U^T G V</p></div>
              <div className="galore-arrow">→</div>
              <div className="galore-step"><h4>2. Adam Step</h4><p>Update в сжатом виде</p></div>
              <div className="galore-arrow">→</div>
              <div className="galore-step"><h4>3. Back Project</h4><p>dW = U P V^T</p></div>
            </div>
          </div>

          <h3>2. Muon (Orthogonalization)</h3>
          <p>Итерации Ньютона-Шульца поддерживают ортогональность весовых матриц, предотвращая коллапс градиентов.</p>
          <CodeBlock code={`# 5 шагов ортогонализации Muon
for _ in range(ns_steps):
    V = (3.0 * V - V @ V.T @ V) * 0.5`} language="python" />

          <h3>Как выбрать GaLore rank</h3>
          <p>Rank управляет размером подпространства, в котором оптимизируется градиент. Малый rank сильнее экономит память, большой rank точнее повторяет AdamW.</p>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Сценарий</th><th>Rank</th><th>Комментарий</th></tr>
              </thead>
              <tbody>
                <tr><td>Экстренная экономия VRAM</td><td>64</td><td>Хорошо для первых экспериментов</td></tr>
                <tr><td>Баланс качества и памяти</td><td>128</td><td>Безопасный дефолт</td></tr>
                <tr><td>Большой корпус и мощная GPU</td><td>256</td><td>Ближе к полному AdamW</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "efficiency",
      label: "ЭФФЕКТИВНОСТЬ",
      content: (
        <>
          <h3>Асинхронная валидация</h3>
          <p>Мы запускаем проверку <code>val_loss</code> в отдельном <strong>CUDA Stream</strong>. Пока GPU считает лосс на тестах, основной поток готовит данные для следующей эпохи.</p>
          
          <h3>Mixed Precision (BFloat16)</h3>
          <p>Обучение в BFloat16 сохраняет динамический диапазон Float32, занимая в 2 раза меньше памяти и ускоряя расчеты на тензорных ядрах.</p>
          
          <h3>OneCycleLR Scheduler</h3>
          <ul>
            <li><strong>Warmup:</strong> Рост скорости для стабилизации.</li>
            <li><strong>Peak:</strong> Максимальная скорость обучения.</li>
            <li><strong>Decay:</strong> Затухание до нуля для фиксации знаний.</li>
          </ul>
          <h3>DataLoader без простоя GPU</h3>
          <p><code>pin_memory=True</code> и несколько workers позволяют CPU готовить следующий батч, пока GPU занят текущим. Это уменьшает паузы между итерациями и делает ETA более честным.</p>

          <h3>Gradient Clipping</h3>
          <p>Ограничение нормы градиента защищает от редких, но разрушительных всплесков loss. Особенно полезно при маленьких корпусах и высоком learning rate.</p>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему Val Loss выше Train Loss?</h3>
          <p>На обучении модель видит данные много раз и может их «зазубрить». Валидация — это экзамен на новых текстах. Если разрыв растет — наступил Overfitting.</p>
          
          <h3>Что такое Gradient Accumulation?</h3>
          <p>Способ имитации большого батча на маленькой GPU: мы складываем градиенты за N шагов и обновляем веса только один раз.</p>
          
          <h3>Влияет ли torch.compile на качество?</h3>
          <p>Нет, только на скорость. Это JIT-компиляция, переписывающая код под конкретную видеокарту.</p>

          <h3>Когда останавливать обучение вручную?</h3>
          <p>Если <code>val_loss</code> не улучшается несколько проверок подряд, а примеры генерации становятся более повторяющимися, продолжение эпох обычно только усиливает переобучение.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Tolstoy AI Studio: Обучение и Оптимизация</h1>
        <p className="docs-lead-paragraph">Глубокое погружение в технологии Trainer, GaLore, Muon и стратегии управления Learning Rate.</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 4. TOKENIZER DOCUMENT (MAX EXPANDED)
// ----------------------------------------------------
export function TokenizerDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🏛️ Эволюция к O(N log M)</h2>
          <p>Токенизатор — это «глаза» модели. В версии v10 мы достигли теоретически минимальной сложности алгоритма BPE.</p>
          
          <h3>Алгоритмические инновации:</h3>
          <ul>
            <li><strong>Linked Array:</strong> Двусвязные списки на массивах превращают слияние в <strong><Math formula="O(1)" /></strong>.</li>
            <li><strong>Reverse Indexing:</strong> Хэш-таблица координат всех пар токенов для мгновенного поиска.</li>
            <li><strong>Delta-Update:</strong> Локальный пересчет частот без сканирования всего корпуса.</li>
            <li><strong>Lazy Priority Heap:</strong> Очередь с «фантомными» записями для выбора максимума за <Math formula="O(\log M)" />.</li>
          </ul>
          <h3>Эволюция версий</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Поколение</th><th>Идея</th><th>Главная проблема</th></tr>
              </thead>
              <tbody>
                <tr><td>v1-v3</td><td>Посимвольная токенизация</td><td>Слишком длинные последовательности</td></tr>
                <tr><td>v4-v6</td><td>Классический BPE</td><td>Повторный полный проход по корпусу</td></tr>
                <tr><td>v7-v9</td><td>Regex и индексация</td><td>Переаллокации Python-списков</td></tr>
                <tr><td>v10</td><td>Linked arrays + lazy heap</td><td>Ограничение в основном скоростью диска</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Пре-токенизация (RU_PATTERN)</h3>
          <p>Мы используем Regex для сохранения смысловых блоков и предотвращения склеивания мусора.</p>
          <CodeBlock code={`RU_PATTERN = re.compile(
    r""" ?[а-яА-ЯёЁa-zA-Z]+-[а-яА-ЯёЁa-zA-Z]+| ?\\w+| ?[^\\s\\w]+|\\s+(?!\\S)|\\s+"""
)`} language="python" />
          
          <h3>Цикл слияния (The Merge Loop)</h3>
          <CodeBlock code={`# Мутация in-place через Linked Array
for p1 in positions:
    p2 = next_idx[p1]
    tokens[p1] = new_id
    tokens[p2] = -1 # "Убиваем" токен
    next_idx[p1] = next_p
    if next_p != -1: prev_idx[next_p] = p1`} language="python" />

          <h3>Эффективное кодирование слова</h3>
          <p>Во время инференса BPE не перебирает весь словарь. Он кладет возможные слияния слова в min-heap по рангу и применяет самые ранние merge-операции.</p>
          <CodeBlock code={`def _encode_word(self, word):
    heap = build_rank_heap(word)
    while heap:
        rank, i = heapq.heappop(heap)
        if pair_is_still_alive(i):
            merge_pair_in_place(i)
            push_new_neighbor_pairs(i, heap)
    return collect_alive_tokens()`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Метрики качества</h3>
          <p><strong>Фертильность (Fertility):</strong> <Math formula="F = \sum T_i / W" />. Идеал для русского языка: 1.1 – 1.6.</p>
          <p><strong>Коэффициент сжатия:</strong> Отношение байт текста к токенам. Наш результат: 6.0 – 7.5 байт/токен.</p>

          <h3>Влияние vocab size на модель</h3>
          <p>Слишком маленький словарь удлиняет последовательность, слишком большой раздувает embedding и output head.</p>
          <Math formula="\text{Params}_{vocab} = |V| \cdot d_{model}" block={true} />
          
          <h3>Потребление RAM (est.)</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Корпус</th><th>RAM (32k)</th><th>RAM (100k)</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>100 МБ</strong></td><td>~1.1 ГБ</td><td>~1.3 ГБ</td></tr>
                <tr><td><strong>1 ГБ</strong></td><td>~5.2 ГБ</td><td>~5.8 ГБ</td></tr>
                <tr><td><strong>5 ГБ</strong></td><td>~14.5 ГБ</td><td>~15.5 ГБ</td></tr>
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
          <h3>Что такое "фантомные" записи?</h3>
          <p>Это записи в куче, частота которых устарела. Вместо медленного удаления из середины кучи, мы просто игнорируем их при встрече. Это ускоряет выбор максимума.</p>
          
          <h3>Есть ли токен [UNK]?</h3>
          <p>Нет. Мы используем <strong>Byte-level BPE</strong>. Базовый словарь — это все 256 байт UTF-8. Любой символ гарантированно кодируется.</p>
          
          <h3>Зачем нужен dataset_tokens.pkl?</h3>
          <p>Это «переваренный» text. Нейросеть начинает обучение мгновенно, не тратя время на токенизацию при каждом запуске.</p>

          <h3>Как понять, что vocab size выбран плохо?</h3>
          <p>Если фертильность выше 3.0, словарь слишком мал или корпус прочитан с ошибками. Если словарь огромный, а корпус маленький, редкие токены почти не обучатся и будут шуметь в генерации.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Глубокий разбор: BPETokenizer v10</h1>
        <p className="docs-lead-paragraph">Промышленный стандарт токенизации для русского языка со сложностью O(N log M).</p>
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
            <strong>RoPE (Rotary Positional Embeddings)</strong> работает как стрелка компаса: оно <strong>поворачивает</strong> вектор слова. 
            Слово на позиции 1 повернуто на 10°, на позиции 2 — на 20°, и так далее.
          </p>
          <p>
            Когда механизм «Внимания» сравнивает два слова, он смотрит на <strong>разницу углов</strong> между ними. 
            Разница между 1-м и 3-м словом точно такая же, как между 10-м и 12-м. Это позволяет модели понимать структуру предложений любой длины.
          </p>
          <AlertBox type="tip" title="Преимущество">
            В отличие от обычных позиций, RoPE сохраняет относительную дистанцию, что феноменально улучшает понимание лингвистики.
          </AlertBox>
          <h3>Где RoPE особенно заметен</h3>
          <ul>
            <li><strong>Диалоги:</strong> модель лучше связывает реплики с предыдущим контекстом.</li>
            <li><strong>Код и списки:</strong> сохраняются вложенность, порядок аргументов и структура блоков.</li>
            <li><strong>Длинная проза:</strong> персонажи и события меньше «плывут» на дальних позициях.</li>
          </ul>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Реализация в TolstoyLLM_v5</h3>
          <p>Предрасчет частот <code>precompute_freqs_cis</code> выполняется один раз при старте:</p>
          <CodeBlock code={`def precompute_freqs_cis(dim, end=2048, theta=10000.0, rope_scaling=None):
    if rope_scaling is not None and rope_scaling > 1.0:
        # NTK-Aware Scaling для YaRN
        theta = theta * (rope_scaling ** (dim / (dim - 2)))
        
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2).float() / dim))
    t = torch.arange(end)
    freqs = torch.outer(t, freqs).float()
    return torch.polar(torch.ones_like(freqs), freqs)`} language="python" />
          <p>Умножение комплексных чисел в <code>apply_rotary_emb</code> вращает векторы Query и Key в 2D-плоскостях.</p>
          <CodeBlock code={`def apply_rotary_emb(q, k, freqs_cis):
    q_complex = torch.view_as_complex(q.float().reshape(*q.shape[:-1], -1, 2))
    k_complex = torch.view_as_complex(k.float().reshape(*k.shape[:-1], -1, 2))
    q_out = torch.view_as_real(q_complex * freqs_cis).flatten(-2)
    k_out = torch.view_as_real(k_complex * freqs_cis).flatten(-2)
    return q_out.type_as(q), k_out.type_as(k)`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Формула вращения</h3>
          <Math formula="\mathbf{R}_{\Theta, m}^d \mathbf{x} = \begin{pmatrix} \cos m\theta & -\sin m\theta \\ \sin m\theta & \cos m\theta \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}" block={true} />
          
          <h3>YaRN Экстраполяция</h3>
          <p>Позволяет читать длинные документы (до 8k-32k) без дообучения, сжимая углы вращения:</p>
          <Math formula="\theta_Y = \theta \cdot s^{\frac{d}{d-2}}" block={true} />
          <p>Attention фактически видит относительную разность позиций:</p>
          <Math formula="\langle R_m q, R_n k \rangle = f(q, k, m-n)" block={true} />
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему theta = 10000?</h3>
          <p>Это эмпирическая база, обеспечивающая оптимальное затухание корреляций. Слишком большая база «забывает» порядок, слишком маленькая — путает соседние слова.</p>
          
          <h3>Можно ли использовать RoPE на CPU?</h3>
          <p>Да, наши функции <code>apply_rotary_emb</code> оптимизированы и работают на любом устройстве, поддерживающем PyTorch.</p>
          
          <h3>Что такое NTK-Aware Scaling?</h3>
          <p>Это метод изменения частот RoPE так, чтобы высокие частоты (короткие связи) сохранялись точно, а низкие (длинный контекст) плавно растягивались.</p>

          <h3>Как выбирать rope_scaling?</h3>
          <p>Начинайте с 1.0 для обычного контекста. Для экспериментов с 8k+ увеличивайте scaling постепенно и проверяйте качество на длинных документах, а не только на коротких промптах.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>RoPE & YaRN: Ротационные Эмбеддинги</h1>
        <p className="docs-lead-paragraph">Механизмы позиционного кодирования и методы динамической экстраполяции контекста.</p>
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
          <h2>🧩 Смесь экспертов (Sparse MoE)</h2>
          <p>
            Вместо одного огромного слоя мы используем 8 маленьких «экспертов». Для каждого токена 
            <strong>Маршрутизатор (Router)</strong> выбирает только 2 наиболее подходящих.
          </p>
          <div className="docs-diagram-container">
            <div className="diagram-title">Принцип работы Sparse MoE</div>
            <div className="moe-visual-flow">
              <div className="moe-token">Входной токен</div>
              <div className="moe-router-box">Router (Top-2 Routing)</div>
              <div className="moe-split">
                <div className="moe-expert-path active">Эксперт 2 (Weight 0.7)</div>
                <div className="moe-expert-path active">Эксперт 5 (Weight 0.3)</div>
              </div>
              <div className="moe-merge">Σ Взвешенное сложение</div>
            </div>
          </div>
          <AlertBox type="tip" title="Масштабируемость">Модель может иметь в 4 раза больше знаний, сохраняя скорость инференса маленькой сети.</AlertBox>
          <h3>Dense FFN против Sparse MoE</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Подход</th><th>Память весов</th><th>FLOPs на токен</th><th>Когда использовать</th></tr>
              </thead>
              <tbody>
                <tr><td>Dense</td><td>Ниже</td><td>Все нейроны активны</td><td>Малые пресеты и CPU</td></tr>
                <tr><td>Sparse MoE</td><td>Выше</td><td>Только top-k экспертов</td><td>GPU и большой корпус</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Fused SwiGLU FFN</h3>
          <p>Мы используем «сплавленную» реализацию, которая работает быстрее за счет Chunk-операции.</p>
          <CodeBlock code={`class FeedForward(nn.Module):
    def __init__(self, dim):
        super().__init__()
        hidden_dim = int(8 * dim / 3)
        hidden_dim = 256 * ((hidden_dim + 255) // 256)
        self.gate_up_proj = nn.Linear(dim, 2 * hidden_dim, bias=False)
        self.w2 = nn.Linear(hidden_dim, dim, bias=False)

    def forward(self, x):
        gate, up = self.gate_up_proj(x).chunk(2, dim=-1)
        return self.w2(F.silu(gate) * up)`} language="python" />

          <h3>Маршрутизация top-k экспертов</h3>
          <CodeBlock code={`router_logits = self.gate(x)
router_probs = F.softmax(router_logits, dim=-1)
topk_weight, topk_idx = torch.topk(router_probs, k=2, dim=-1)
topk_weight = topk_weight / topk_weight.sum(dim=-1, keepdim=True)

# Каждый выбранный эксперт получает только свои токены
for expert_id in range(num_experts):
    mask = topk_idx == expert_id
    expert_output = self.experts[expert_id](x[mask.any(dim=-1)])`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Активация SwiGLU</h3>
          <Math formula="\text{SwiGLU}(x) = (\text{SiLU}(x W) \cdot x V) G" block={true} />
          
          <h3>Load Balancing Loss</h3>
          <p>Штрафует за неравномерное распределение нагрузки между экспертами:</p>
          <Math formula="L_{\text{aux}} = \alpha \cdot N \sum_{i=1}^N f_i \cdot P_i" block={true} />
          <p>Где <Math formula="f_i" /> — доля токенов, а <Math formula="P_i" /> — уверенность маршрутизатора.</p>
          <p>Без этого штрафа маршрутизатор быстро находит «любимого» эксперта и перестает использовать остальные, что снижает фактическую емкость модели.</p>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему скрытая размерность 8/3?</h3>
          <p>Доказано в статье Llama: для сохранения числа параметров при использовании GLU-функций нужен коэффициент 2/3 * 4 = 8/3. Это дает более «умную» активацию без оверхеда.</p>
          
          <h3>Что такое Expert Collapse?</h3>
          <p>Это ситуация, когда все токены идут к одному эксперту. Мы предотвращаем это с помощью <strong>Load Balancing Loss</strong>.</p>
          
          <h3>Сколько VRAM ест MoE?</h3>
          <p>Веса всех 8 экспертов должны быть в памяти, но вычислительная нагрузка (FLOPs) остается как у маленькой модели.</p>

          <h3>Почему top-2, а не top-1?</h3>
          <p>Top-1 быстрее, но делает маршрутизацию хрупкой. Top-2 дает второму эксперту шанс компенсировать ошибку роутера и обычно улучшает качество без большого замедления.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Sparse MoE & SwiGLU</h1>
        <p className="docs-lead-paragraph">Разбор реализации смеси экспертов и современных функций активации.</p>
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
          <h2>🐣 Помощник-предсказатель (MTP)</h2>
          <p>
            Основная модель — умная, но медленная. Мы даем ей «спекулятивные головы», которые 
            быстро набрасывают догадки о следующих словах.
          </p>
          <p>
            Маленькая голова «угадывает» 3-4 токена вперед, а большая модель проверяет их за <strong>один проход</strong>. 
            Это ускоряет генерацию в <strong>1.8x – 2.4x</strong> без потери качества.
          </p>
          <AlertBox type="info" title="Zero-cost Quality">Если головы ошибаются, основная модель просто исправляет их. Качество всегда остается эталонным.</AlertBox>
          <h3>Жизненный цикл одного шага</h3>
          <ol>
            <li>Основная модель строит скрытое состояние текущего контекста.</li>
            <li>MTP-головы предлагают цепочку следующих токенов.</li>
            <li>Основная модель проверяет предложенную цепочку параллельно.</li>
            <li>Принятые токены добавляются в ответ, первый неверный заменяется эталонным выбором.</li>
          </ol>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Архитектура SpeculativeHead</h3>
          <p>Каждая голова нацелена на разное расстояние в будущее из одного скрытого вектора.</p>
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
          <h3>Forward для нескольких горизонтов</h3>
          <CodeBlock code={`def forward(self, hidden_states):
    # hidden_states: [batch, time, n_embd]
    stage_logits = []
    for head in self.heads:
        stage_logits.append(head(hidden_states))
    return stage_logits  # predictions for t+1, t+2, t+3`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Параллельная верификация</h3>
          <p>За один Forward Pass мы вычисляем вероятности для всей цепочки догадок:</p>
          <Math formula="P_{main}(y_k | x_1, \dots, y_{k-1}) > \text{threshold}" block={true} />
          <p>Мы принимаем токены до тех пор, пока догадки совпадают с тем, что выбрала бы основная модель.</p>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Насколько это увеличивает время обучения?</h3>
          <p>Оверхед на обучение спекулятивных голов составляет всего около 15%, так как они очень легкие.</p>
          
          <h3>Почему это ускоряет вывод?</h3>
          <p>LLM ограничены скоростью чтения весов из памяти (Memory Bandwidth). Спекуляция позволяет читать веса 1 раз, а получать сразу 4 результата.</p>
          
          <h3>Можно ли использовать это на слабом GPU?</h3>
          <p>Да, это одна из лучших оптимизаций для ускорения инференса на домашних видеокартах.</p>

          <h3>Нужно ли обучать модель заново?</h3>
          <p>Да, чтобы использовать встроенные MTP-головы, их нужно включить во время обучения. Старые чекпоинты без таких голов можно запускать как обычно, но без ускорения.</p>
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
          <p>Качество данных — это «потолок» вашей модели. Лучше 100 МБ идеального текста, чем 1 ГБ «шума».</p>
          
          <h3>Правило золотой пропорции (70/20/10)</h3>
          <ul>
            <li><strong>70% Фундамент:</strong> Википедия, новости, классика. Учит грамматике и базе.</li>
            <li><strong>20% Душа:</strong> Ваши личные тексты, логи чатов. Придает индивидуальность.</li>
            <li><strong>10% Логика:</strong> Код, стихи, задачи. Учит структурному мышлению.</li>
          </ul>
          <h3>Матрица объема и пресета</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Пресет</th><th>Данные</th><th>Vocab</th><th>Цель</th></tr>
              </thead>
              <tbody>
                <tr><td>Nano/Mini</td><td>50-200 КБ</td><td>1024-2048</td><td>Быстрый sanity-check</td></tr>
                <tr><td>Small/Chat</td><td>1-5 МБ</td><td>4096-8192</td><td>Диалоги и стиль</td></tr>
                <tr><td>Medium/Large</td><td>10-100 МБ</td><td>8192-16384</td><td>Устойчивое качество</td></tr>
                <tr><td>XLarge</td><td>500 МБ+</td><td>32000+</td><td>Масштабный pretrain</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "sources",
      label: "ИСТОЧНИКИ",
      content: (
        <>
          <h3>Поддерживаемые форматы</h3>
          <p>CLI автоматически извлекает текст из:</p>
          <ul>
            <li><strong>PDF:</strong> Постраничное извлечение (через PyPDF2).</li>
            <li><strong>JSON:</strong> Рекурсивный поиск строковых полей (идеально для Telegram/WhatsApp).</li>
            <li><strong>DOCX, CSV, MD:</strong> Структурированное извлечение.</li>
          </ul>
          <h3>Категории данных и навыки</h3>
          <ul>
            <li><strong>Формальные тексты:</strong> грамматика, факты, нейтральный стиль.</li>
            <li><strong>Художественная проза:</strong> метафоры, ритм, длинные зависимости.</li>
            <li><strong>Разговорные логи:</strong> естественный диалог и короткие ответы.</li>
            <li><strong>Технические документы:</strong> структура, причинность, списки и код.</li>
          </ul>
          <AlertBox type="tip" title="Corus">Используйте Меню [1]-&gt;[3] для скачивания Wikipedia или Lenta.ru в один клик.</AlertBox>
        </>
      )
    },
    {
      id: "cleaning",
      label: "ОЧИСТКА",
      content: (
        <>
          <h3>Алгоритм clean_text</h3>
          <ol>
            <li><strong>Sanitization:</strong> Удаление Unicode-мусора (ASCII 0-31).</li>
            <li><strong>Normalization:</strong> Множественные пробелы ➔ один пробел.</li>
            <li><strong>Дедупликация:</strong> Удаление повторяющихся файлов и кусков текста.</li>
          </ol>
          <AlertBox type="warning" title="OCR ошибки">Текст со сканера с ошибками типа «пpивeт» (английская 'p') может сломать токенизатор.</AlertBox>
          <h3>Чего не стоит оставлять в корпусе</h3>
          <ul>
            <li>Повторяющиеся футеры страниц, рекламные вставки и навигационные меню.</li>
            <li>Смешение языков без цели: модель начнет случайно переключаться между алфавитами.</li>
            <li>Слишком много одного жанра: стиль станет узким и навязчивым.</li>
          </ul>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Сколько данных нужно?</h3>
          <p>Для пресета <strong>Small</strong> достаточно 1-5 МБ текста. Для <strong>Medium</strong> — 10-100 МБ. Для <strong>XLarge</strong> — от 500 МБ.</p>
          
          <h3>Нужна ли дедупликация?</h3>
          <p>Да! Если один текст встречается 100 раз, модель решит, что это самая важная истина во вселенной и будет его повторять.</p>
          
          <h3>Что такое дистилляция?</h3>
          <p>Использование ChatGPT для генерации «идеальных» примеров для вашей маленькой модели.</p>

          <h3>Можно ли дообучить модель новым стилем?</h3>
          <p>Да, но добавляйте новый стиль как часть смешанного корпуса. Если обучать только на узкой подборке, модель быстро забудет общий русский язык.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Туториал 1: Создание датасета</h1>
        <p className="docs-lead-paragraph">Гайд по сбору, очистке и подготовке текстового корпуса для обучения.</p>
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
          <p>Обучение модели — это танец между скоростью вычислений и доступной памятью.</p>
          
          <div className="muon-cycle-container">
            <div className="muon-node"><strong>Warmup</strong>Старт LR</div>
            <div className="muon-arrow">→</div>
            <div className="muon-node"><strong>Peak</strong>Максимум</div>
            <div className="muon-arrow">→</div>
            <div className="muon-node"><strong>Decay</strong>Затухание</div>
          </div>
          <p>Мы используем <strong>OneCycleLR</strong>: сначала плавный разогрев, затем работа на пике и затухание для фиксации знаний.</p>
          <h3>Выбор стартовой конфигурации</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Железо</th><th>Пресет</th><th>Опции</th></tr>
              </thead>
              <tbody>
                <tr><td>CPU / iGPU</td><td>nano</td><td>Короткий контекст, без MoE</td></tr>
                <tr><td>RTX 3060 12GB</td><td>small/chat</td><td>GaLore + int8kv</td></tr>
                <tr><td>RTX 3090/4090</td><td>medium/large</td><td>GaLore + Muon + speculative</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "monitoring",
      label: "ЗДОРОВЬЕ",
      content: (
        <>
          <h3>Анализ кривых Loss</h3>
          <ul>
            <li><strong>Train Loss:</strong> Насколько хорошо модель усваивает ваш текст. Должен плавно падать.</li>
            <li><strong>Val Loss:</strong> Самая важная метрика. Показывает понимание на новых данных.</li>
          </ul>
          <AlertBox type="warning" title="Overfitting!">Если Train Loss падает, а Val Loss начал расти — модель начала «зубрить». Немедленно остановите обучение!</AlertBox>
          <p>Система <strong>Early Stopping</strong> сделает это автоматически при достижении лимита терпения.</p>
          <h3>Как читать динамику</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Симптом</th><th>Вероятная причина</th><th>Действие</th></tr>
              </thead>
              <tbody>
                <tr><td>Loss скачет вверх-вниз</td><td>LR слишком высок</td><td>Снизить learning rate</td></tr>
                <tr><td>Train падает, Val растет</td><td>Переобучение</td><td>Остановить или добавить данных</td></tr>
                <tr><td>Оба loss стоят</td><td>Мало емкости или плохой корпус</td><td>Проверить токенизацию и пресет</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "tuning",
      label: "ТЮНИНГ",
      content: (
        <>
          <h3>Параметры инференса (Чат)</h3>
          <ul>
            <li><strong>Temperature:</strong> 0.1 (строго) ➔ 0.7 (баланс) ➔ 1.5 (хаос).</li>
            <li><strong>Top-P:</strong> Фильтр мусора. 0.9 — стандарт.</li>
            <li><strong>Repetition Penalty:</strong> Ставьте 1.5 - 2.0 для борьбы с зацикливанием.</li>
          </ul>
          <h3>Команды для типовых запусков</h3>
          <CodeBlock code={`# Экономный запуск для 12GB VRAM
python tolstoy_cli.py train --preset chat --use_galore --kv_cache int8kv

# Более агрессивный запуск для 24GB VRAM
python tolstoy_cli.py train --preset medium --use_galore --use_muon --use_speculative`} language="bash" />
          <CodeBlock code="python tolstoy_cli.py chat --temperature 0.4 --repetition_penalty 2.0" language="bash" />
        </>
      )
    },
    {
      id: "hardware",
      label: "ЖЕЛЕЗО",
      content: (
        <>
          <h3>Рекомендации</h3>
          <ul>
            <li><strong>RTX 3060 (12GB):</strong> Пресет Small/Chat + GaLore.</li>
            <li><strong>RTX 3090/4090 (24GB):</strong> Пресет Medium/Large + Speculative.</li>
          </ul>
          <AlertBox type="warning" title="Windows Pagefile">Убедитесь, что файл подкачки не менее 32 ГБ, иначе PyTorch может вылететь при загрузке тензоров.</AlertBox>
          <p>Используйте MSI Afterburner для ограничения Power Limit (70-80%), чтобы снизить нагрев на 15°C.</p>
          <p>На CPU стоит уменьшить <code>block_size</code> и batch size: обучение будет медленным, но полезным для проверки корпуса и токенизатора.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Мастер-класс обучения</h1>
        <p className="docs-lead-paragraph">Настройка параметров, мониторинг лоссов и рекомендации по железу.</p>
      </div>
      <DocTabs tabs={tabs} accent="purple" />
    </article>
  );
}

// ----------------------------------------------------
// 10. OPTIMIZERS DOCUMENT (GaLore & Muon)
// ----------------------------------------------------
export function OptimizersDoc() {
  const tabs = [
    {
      id: "galore",
      label: "GALORE",
      content: (
        <>
          <h2>🛡️ GaLore: Обучение в низком ранге</h2>
          <p>
            GaLore (Gradient Low-Rank Projection) — это прорывная технология, позволяющая обучать огромные модели 
            на обычных видеокартах. Она сжимает состояния оптимизатора (моментум, дисперсия) на 80-90%.
          </p>
          <div className="galore-flow-container">
            <div className="diagram-title">Процесс сжатия градиента</div>
            <div className="galore-grid">
              <div className="galore-step">
                <h4>1. Проекция</h4>
                <p><Math formula="G_{\text{proj}} = U^T G V" /></p>
                <p>Сжатие в ядро rank x rank</p>
              </div>
              <div className="galore-arrow">→</div>
              <div className="galore-step">
                <h4>2. Оптимизация</h4>
                <p><Math formula="P_{t+1} = \text{Adam}(G_{\text{proj}})" /></p>
                <p>AdamW работает в сжатом виде</p>
              </div>
              <div className="galore-arrow">→</div>
              <div className="galore-step">
                <h4>3. Реконструкция</h4>
                <p><Math formula="\Delta W = U P V^T" /></p>
                <p>Обновление весов модели</p>
              </div>
            </div>
          </div>
          <AlertBox type="tip" title="Q-GaLore">В Tolstoy-CLI реализовано квантование самих матриц проекции U и V в 8-bit, что еще сильнее снижает потребление VRAM.</AlertBox>
          <h3>Сравнение с обычным AdamW</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Оптимизатор</th><th>Память</th><th>Сильная сторона</th></tr>
              </thead>
              <tbody>
                <tr><td>AdamW</td><td>Высокая</td><td>Простой и предсказуемый baseline</td></tr>
                <tr><td>8-bit AdamW</td><td>Средняя</td><td>Быстрая экономия без смены логики</td></tr>
                <tr><td>GaLore</td><td>Низкая</td><td>Обучение больших матриц в низком ранге</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: "muon",
      label: "MUON",
      content: (
        <>
          <h2>🧠 Muon: Костоправ для весов</h2>
          <p>
            Вместо AdamW для больших матриц мы используем Muon. Он применяет итерации Ньютона-Шульца 
            для поддержания <strong>ортогональности</strong> весов.
          </p>
          <div className="muon-cycle-container">
            <div className="muon-node"><strong>Нормализация</strong>V = G / ||G||</div>
            <div className="muon-arrow">→</div>
            <div className="muon-node"><strong>Ньютон-Шульц</strong>V = 0.5 * V * (3I - V^T V)</div>
            <div className="muon-arrow">→</div>
            <div className="muon-node"><strong>Rescale</strong>W = W - LR * V</div>
          </div>
          <p>
            <strong>Результат:</strong> Модель учится на 30-40% быстрее, а нейроны учат уникальные признаки, 
            не дублируя работу друг друга.
          </p>
          <AlertBox type="info" title="Область применения">Muon применяется к 2D-матрицам Linear-слоев. Bias, embedding и нормализации остаются на AdamW, потому что для них ортогонализация не имеет смысла.</AlertBox>
        </>
      )
    },
    {
      id: "code",
      label: "КОД",
      content: (
        <>
          <h3>Реализация итерации Muon</h3>
          <CodeBlock code={`# 5 шагов ортогонализации Ньютона-Шульца
for _ in range(5):
    V = (3.0 * V - V @ V.T @ V) * 0.5

# Восстановление масштаба градиента
V = V * (g_norm_final / V_norm_final)`} language="python" />
          <p>Muon применяется только к 2D-матрицам весов слоев Linear.</p>
          <CodeBlock code={`muon_params = []
adamw_params = []
for name, p in model.named_parameters():
    if p.ndim == 2 and "tok_embeddings" not in name:
        muon_params.append(p)
    else:
        adamw_params.append(p)`} language="python" />
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Зачем использовать GaLore и Muon вместе?</h3>
          <p>GaLore экономит память, а Muon ускоряет сходимость. Это идеальный тандем для обучения моделей 7B+ на одной домашней видеокарте.</p>
          <h3>Замедляет ли Muon обучение?</h3>
          <p>На современных GPU RTX 30/40 оверхед от матричных умножений в Muon практически незаметен на фоне общего времени шага обучения.</p>
          <h3>Какой rank выбрать для GaLore?</h3>
          <p>Для первого запуска используйте 128. Если VRAM все еще не хватает, снижайте до 64; если качество хуже baseline и память позволяет, повышайте до 256.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Продвинутые Оптимизаторы</h1>
        <p className="docs-lead-paragraph">Разбор GaLore и Muon — технологий, делающих обучение больших моделей доступным на локальном железе.</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 11. TOKENIZATION TUTORIAL (MAX EXPANDED)
// ----------------------------------------------------
export function TokenizationTutorialDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🔄 Как работает BPE (Byte-Pair Encoding)?</h2>
          <p>BPE — это итеративный алгоритм сжатия, находящий «золотую середину» между буквами и целыми словами.</p>
          <div className="docs-diagram-container">
            <div className="diagram-title">Процесс слияния токенов</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Сырой текст (UTF-8 байты)</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">Поиск самой частой пары (например, 'о' + 'в')</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node layer-box">Создание нового токена 'ов'</div>
              <div className="flow-connector font-mono">↓</div>
              <div className="flow-node output-node">Итог: Оптимизированный словарь</div>
            </div>
          </div>
          <h3>Мини-пример слияний</h3>
          <p>Если в корпусе часто встречается слово «модель», BPE сначала выучит частые пары вроде <code>мо</code>, затем <code>дел</code>, а после нескольких итераций сможет хранить крупные осмысленные фрагменты.</p>
        </>
      )
    },
    {
      id: "vocab",
      label: "СЛОВАРЬ",
      content: (
        <>
          <h3>Калькулятор Vocab Size</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Объем данных</th><th>Vocab Size</th><th>Влияние на VRAM</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>{"<"} 50 КБ</strong></td><td>1024</td><td>Минимальное</td></tr>
                <tr><td><strong>200 КБ - 1 МБ</strong></td><td>4096</td><td>~100 МБ</td></tr>
                <tr><td><strong>{" > "} 10 МБ</strong></td><td>16384+</td><td>~500 МБ+</td></tr>
              </tbody>
            </table>
          </div>
          <AlertBox type="warning" title="Опасная зона">Слишком маленький словарь ({"<"}512) сделает последовательности чисел слишком длинными, и модель быстро исчерпает окно контекста.</AlertBox>
          <h3>Специальные токены</h3>
          <p>Служебные маркеры вроде начала текста, конца текста или разделителя диалога должны быть закреплены до обучения BPE, чтобы модель видела их как стабильные команды формата.</p>
        </>
      )
    },
    {
      id: "quality",
      label: "КАЧЕСТВО",
      content: (
        <>
          <h3>Красные флаги при анализе</h3>
          <ul>
            <li><strong>Фертильность &gt; 3.0:</strong> Проверьте кодировку! Вероятно, текст считался некорректно.</li>
            <li><strong>Сжатие &lt; 1.5:</strong> Ваш словарь бесполезен, модель работает практически «по буквам».</li>
          </ul>
          <p><strong>Фертильность</strong> показывает среднее число токенов на слово, а <strong>compression ratio</strong> показывает, сколько байт текста упаковано в один токен.</p>
          <p><strong>Совет:</strong> Если в датасете много английского (код, термины), увеличьте словарь на 15%, чтобы BPE успел выучить латинские слоги.</p>
        </>
      )
    },
    {
      id: "debug",
      label: "ОТЛАДКА",
      content: (
        <>
          <h3>Увидеть глазами модели</h3>
          <p>Вы можете проверить разбивку фразы в Python-консоли:</p>
          <CodeBlock code={`from tokenizers.bpe_tokenizer import BPETokenizer
tok = BPETokenizer.load('custom_tokenizer.pkl')
text = "Привет, как дела?"
ids = tok.encode(text)
print(f"ID токенов: {ids}")
print(f"Разбивка: {[tok.decode([i]) for i in ids]}")`} language="python" />
          <p>Если слово "Привет" разбито как <code>['П', 'ри', 'в', 'ет']</code>, стоит увеличить словарь.</p>
          <AlertBox type="tip" title="Быстрая проверка">Проверьте 10-20 слов из вашей предметной области. Если термины разваливаются на одиночные буквы, корпус или vocab size нужно пересмотреть.</AlertBox>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Туториал 3: Токенизация</h1>
        <p className="docs-lead-paragraph">Создание фундаментального языка, на котором ваша модель будет «думать».</p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}

// ----------------------------------------------------
// 12. INTERACTION TUTORIAL (MAX EXPANDED)
// ----------------------------------------------------
export function InteractionTutorialDoc() {
  const tabs = [
    {
      id: "tuning",
      label: "ТЮНИНГ",
      content: (
        <>
          <h2>⚙️ Настройка параметров чата</h2>
          <ul>
            <li><strong>Temperature:</strong> Хаос. 0.1 (строгая логика) ➔ 0.7 (баланс) ➔ 1.5 (творчество).</li>
            <li><strong>Top-P:</strong> Фильтр мусора. Отсекает маловероятные варианты (рекомендуется 0.9).</li>
            <li><strong>Repetition Penalty:</strong> Борьба с «заеданием». Ставьте 1.5 – 2.0 для чистого вывода.</li>
          </ul>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr><th>Задача</th><th>Temperature</th><th>Top-P</th><th>Penalty</th></tr>
              </thead>
              <tbody>
                <tr><td>Факты и пересказ</td><td>0.2-0.4</td><td>0.85</td><td>1.6</td></tr>
                <tr><td>Диалог</td><td>0.5-0.8</td><td>0.9</td><td>1.5</td></tr>
                <tr><td>Проза и стихи</td><td>0.8-1.1</td><td>0.95</td><td>1.2</td></tr>
              </tbody>
            </table>
          </div>
          <AlertBox type="info" title="Speculative Decoding">Если модель обучалась со спекулятивными головами, включите их в чате для ускорения вывода до 2.4x.</AlertBox>
        </>
      )
    },
    {
      id: "prompting",
      label: "ПРОМПТИНГ",
      content: (
        <>
          <h2>✍️ Искусство Prompt Engineering</h2>
          <p>Ваша модель — это <strong>продолжатель текста</strong>, а не исполнитель команд.</p>
          <table className="docs-table">
            <thead>
              <tr><th>Подход</th><th>Пример (Ввод)</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>❌ Приказ</strong></td><td>"Напиши стихотворение о весне."</td></tr>
              <tr><td><strong>✅ Начало</strong></td><td>"Тихо капает капель, на дворе стоит апрель,"</td></tr>
            </tbody>
          </table>
          <p>Вы задаете ритм и тему — модель обязана продолжить в том же стиле.</p>
          <CodeBlock code={`Диалог в стиле русской классической прозы.
Пользователь: Почему герой не отвечает прямо?
Ассистент: Потому что он боится назвать мысль, которая уже стала для него очевидной:`} language="text" />
        </>
      )
    },
    {
      id: "advanced",
      label: "ТЕХНИКИ",
      content: (
        <>
          <h3>Продвинутые приемы</h3>
          <p><strong>1. Few-Shot:</strong> Дайте 2-3 примера формата (Фрукт: Яблоко | Цвет: Красный...).</p>
          <p><strong>2. Roleplay:</strong> Опишите ситуацию: "Диалог профессора и студента в 19 веке...".</p>
          <p><strong>3. Chain of Thought:</strong> Заставьте модель рассуждать по шагам ("Задача: ... Решение: Сначала... Затем...").</p>
          <p><strong>4. Задание формата:</strong> Начните JSON, таблицу или нумерованный список, если хотите получить структурированный вывод.</p>
        </>
      )
    },
    {
      id: "troubleshooting",
      label: "FAQ",
      content: (
        <>
          <h3>Модель обрывает фразу?</h3>
          <p>Увеличьте параметр <code>max_new_tokens</code> в настройках чата.</p>
          <h3>Текст превращается в кашу?</h3>
          <p>Снизьте <code>Temperature</code> до 0.4 - 0.5. Высокие значения делают модель слишком непредсказуемой.</p>
          <h3>Отвечает на другом языке?</h3>
          <p>Это признак «загрязнения» датасета. Проверьте чистоту обучающих данных.</p>
          <h3>Повторяет одну и ту же фразу?</h3>
          <p>Поднимите <code>repetition_penalty</code>, снизьте <code>temperature</code> и проверьте, не было ли в корпусе большого количества повторяющихся шаблонов.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Туториал 4: Секреты общения</h1>
        <p className="docs-lead-paragraph">Инференс — это искусство настройки параметров, превращающее случайные числа в глубокие мысли.</p>
      </div>
      <DocTabs tabs={tabs} accent="pink" />
    </article>
  );
}
