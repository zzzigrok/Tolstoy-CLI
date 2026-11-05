import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function TrainingTutorialDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🏋️ Туториал: Запуск и мониторинг обучения</h2>
          <p>
            Обучение собственной языковой модели — это захватывающий процесс балансирования между 
            пропускной способностью тензорных ядер (TFLOPS) и объемом доступной видеопамяти (VRAM).
          </p>
          <p>
            Благодаря внедрению современных технологий <strong>GaLore</strong>, <strong>Muon</strong>, 
            <strong>BFloat16 AMP</strong> и <strong>Sparse MoE</strong> в Tolstoy AI Studio, 
            обучение качественной модели класса 88M–350M параметров теперь доступно на домашнем компьютере 
            с видеокартами уровня GeForce RTX 3060, RTX 4060 или RTX 4070.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Маршрут предварительного обучения (Pre-training)</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Выбор токенизированного корпуса: dataset_tokens.pkl</div>
              <div className="flow-connector font-mono">↓ Выбор архитектурного пресета</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">Конфигурация сети: Chat (8 слоев, 512 dim, 16 голов, 2048 контекст)</div>
                <div className="flow-connector-short">↓ Настройка оптимизаций</div>
                <div className="sub-node highlight-purple">Включение GaLore (Rank=128) + BFloat16 AMP + Speculative Heads</div>
                <div className="flow-connector-short">↓ Тренировочный цикл</div>
                <div className="sub-node">5 Эпох • Cosine Warmup • Асинхронный расчет Validation Perplexity</div>
              </div>
              <div className="flow-connector font-mono">↓ Автосохранение чекпоинтов</div>
              <div className="flow-node output-node">Итог: checkpoints/tolstoy_chat_best.pth + привязанный словарь .bpe</div>
            </div>
          </div>

          <AlertBox type="tip" title="Золотые правила стабильного обучения">
            <ul>
              <li><strong>Не завышайте Batch Size:</strong> Если видеокарта перегружена, уменьшите мини-батч до 2 или 4 и включите аккумулирование градиентов (<code>grad_accum = 4</code> или <code>8</code>).</li>
              <li><strong>Используйте Warmup:</strong> Первые 5% шагов скорость обучения должна плавно расти от нуля, чтобы весовые матрицы инициализировались без градиентных ударов.</li>
              <li><strong>Следите за Validation Loss:</strong> Как только проверочный лосс начинает расти — немедленно останавливайте обучение (модель начинает заучивать текст).</li>
            </ul>
          </AlertBox>

          <h3>Матрица архитектурных пресетов Tolstoy</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Пресет</th>
                  <th>Слои</th>
                  <th>Dim</th>
                  <th>Голов</th>
                  <th>Контекст</th>
                  <th>Параметры</th>
                  <th>Рекомендуемый GPU</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>nano</code></td>
                  <td>2</td>
                  <td>128</td>
                  <td>4</td>
                  <td>256</td>
                  <td>~4.2M</td>
                  <td>Любой процессор / Встройка</td>
                </tr>
                <tr>
                  <td><code>mini</code></td>
                  <td>4</td>
                  <td>256</td>
                  <td>8</td>
                  <td>512</td>
                  <td>~15.8M</td>
                  <td>GTX 1650 / 1060 (4 GB)</td>
                </tr>
                <tr>
                  <td><code>small</code></td>
                  <td>6</td>
                  <td>384</td>
                  <td>12</td>
                  <td>1,024</td>
                  <td>~48.5M</td>
                  <td>RTX 2060 / 3050 (6–8 GB)</td>
                </tr>
                <tr>
                  <td><strong>chat (Хит)</strong></td>
                  <td><strong>8</strong></td>
                  <td><strong>512</strong></td>
                  <td><strong>16</strong></td>
                  <td><strong>2,048</strong></td>
                  <td><strong>~88.2M</strong></td>
                  <td><strong>RTX 3060 12GB / 4060</strong></td>
                </tr>
                <tr>
                  <td><code>medium</code></td>
                  <td>12</td>
                  <td>768</td>
                  <td>12</td>
                  <td>2,048</td>
                  <td>~142M</td>
                  <td>RTX 3060 12GB / 4070</td>
                </tr>
                <tr>
                  <td><code>large</code></td>
                  <td>16</td>
                  <td>1,024</td>
                  <td>16</td>
                  <td>2,048</td>
                  <td>~350M</td>
                  <td>RTX 3090 / 4080 (16–24 GB)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "walkthrough",
      label: "ПОШАГОВЫЙ ЗАПУСК",
      content: (
        <>
          <h2>🚀 Запуск процесса обучения через CLI</h2>

          <h3>Шаг 1: Выбор режима в главном меню</h3>
          <CodeBlock
            code={`$ python tolstoy_cli.py
...
Выберите действие > 2
[*] Загрузка датасета...
[1] Найдено: dataset_tokens.pkl (Токенов: 3,544,120)
[2] Выбрать другой файл .pkl
Выберите файл > 1`}
            language="bash"
            filename="Terminal Prompt"
          />

          <h3>Шаг 2: Конфигурация модели и оптимизаторов</h3>
          <CodeBlock
            code={`[?] Выберите архитектурный пресет:
    [1] nano   [2] mini   [3] small   [4] chat   [5] medium   [6] large
Ваш выбор > 4 (chat)

[?] Включить низкоранговый оптимизатор GaLore? (y/n) > y
    [i] GaLore Rank установлен: 128 (Экономия VRAM: ~82%)

[?] Включить спекулятивные головы (Speculative Decoding)? (y/n) > y
    [i] Добавлено 3 головы MTP (+1, +2, +3 токена)

[?] Размер микро-батча (по умолчанию 4) > 4
[?] Шагов аккумуляции градиента (по умолчанию 4, эффективный батч = 16) > 4
[?] Количество эпох (по умолчанию 5) > 5`}
            language="bash"
            filename="Configuration Dialog"
          />

          <h3>Шаг 3: Мониторинг в реальном времени</h3>
          <CodeBlock
            code={`[*] Инициализация TolstoyLLM_v7 (Chat Preset | 88.2M Params)...
[*] Загрузка весов в VRAM NVIDIA GeForce RTX 3060 (12288 MB)...
[*] Запуск тренировочного цикла...

Epoch 1/5 [Step 250/2215]
├── Training Loss: 4.8210 (PPL: 124.08)
├── Learning Rate: 2.45e-04 [Cosine Warmup: Step 250/500]
├── Gradient Norm: 0.82 (Max: 1.0)
├── VRAM Usage: 6.42 / 12.00 GB (53.5%)
├── Speed: 15,480 tokens/sec (ETA: 00:18:42)
└── CUDA Stream: Async Validation Loss: 4.9120`}
            language="bash"
            filename="Live Training Telemetry"
          />
        </>
      ),
    },
    {
      id: "curves",
      label: "АНАЛИЗ КРИВЫХ LOSS",
      content: (
        <>
          <h2>📉 Как читать график потерь (Loss) и перплексии</h2>

          <div className="faq-card">
            <h4>🟢 Здоровая динамика обучения</h4>
            <p>
              В начале первой эпохи лосс быстро падает с <strong>~8.5–9.0</strong> (состояние случайного угадывания) 
              до <strong>~4.0–4.5</strong>. К концу 3–5 эпохи лосс качественной модели должен плавно снизиться до 
              <strong>~2.2–2.6</strong>, а перплексия (PPL) составить от <strong>9.0 до 14.0</strong>. 
              Проверочный <code>val_loss</code> должен идти параллельно тренировочному с небольшим отставанием (+0.1–0.2).
            </p>
          </div>

          <div className="faq-card">
            <h4>🔴 Переобучение (Overfitting)</h4>
            <p>
              <code>train_loss</code> падает ниже 1.5, а <code>val_loss</code> сначала замирает, 
              а затем начинает расти (например, подскакивает с 2.8 до 3.5).
            </p>
            <p><strong>Что делать:</strong> Немедленно прервите обучение комбинацией <code>Ctrl + C</code>. Модель сохранит чекпоинт с лучшим результатом валидации (<code>best_model.pth</code>).</p>
          </div>

          <div className="faq-card">
            <h4>🔴 Недообучение (Underfitting)</h4>
            <p>
              Лосс застрял в районе 5.0–6.0 и не снижается даже после 2 эпох.
            </p>
            <p><strong>Причины:</strong> Слишком низкий Learning Rate, слишком маленький пресет модели или в датасет попал нераспознанный мусор/код.</p>
          </div>
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h2>❓ Частые вопросы об обучении</h2>

          <div className="faq-card">
            <h4>🚨 Можно ли продолжить прерванное обучение с чекпоинта?</h4>
            <p>
              Да! При запуске меню <code>[2] Обучить нейросеть</code> CLI автоматически проверит наличие 
              сохраненных файлов <code>checkpoint_epoch_*.pth</code> и предложит продолжить обучение с момента остановки, 
              сохранив состояния оптимизатора и счетчик шагов планировщика LR.
            </p>
          </div>

          <div className="faq-card">
            <h4>🚨 Сколько времени занимает обучение на RTX 3060?</h4>
            <p>
              Для пресета <strong>chat (88M)</strong> на корпусе в 15 МБ (~3.5 млн токенов) одна эпоха 
              занимает около <strong>18–22 минут</strong>. Полный цикл из 3 эпох завершается примерно за 1 час.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="cyan" />;
}
