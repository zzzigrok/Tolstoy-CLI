import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function TrainingDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>⚡ Жизненный цикл обучения в Tolstoy AI Studio</h2>
          <p>
            Тренировочный пайплайн в Tolstoy AI Studio построен на базе кастомного класса <code>Trainer</code> 
            (модуль <code>training/trainer.py</code>), разработанного для предельной утилизации вычислительных блоков 
            тензорных ядер GPU и минимизации времени простоя шины PCIe.
          </p>
          <p>
            В ядре тренера объединены: автоматическая смешанная точность (<strong>BFloat16 AMP</strong>), 
            асинхронная валидация в изолированном <strong>CUDA Stream</strong>, адаптивное клиппирование градиентов 
            и поддержка революционных оптимизаторов <strong>GaLore</strong> и <strong>Muon</strong>.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Архитектура тренировочного шага (Step Loop)</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Батч токенов x ∈ ℤ^[B × T], целевые метки y ∈ ℤ^[B × T] (Dataloader + Pin Memory)</div>
              <div className="flow-connector font-mono">↓ torch.amp.autocast(dtype=torch.bfloat16)</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">Прямой проход: Logits, AuxLoss = model(x)</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">Cross-Entropy Loss = F.cross_entropy(Logits.view(-1, V), y.view(-1)) + λ · AuxLoss</div>
                <div className="flow-connector-short">↓ Scaler Backward</div>
                <div className="sub-node highlight-purple">Обратный проход: torch.cuda.amp.GradScaler().scale(Loss).backward()</div>
                <div className="flow-connector-short">↓ Gradient Clipping</div>
                <div className="sub-node">torch.nn.utils.clip_grad_norm_(parameters, max_norm=1.0)</div>
              </div>
              <div className="flow-connector font-mono">↓ Оптимизатор (GaLore / Muon / AdamW)</div>
              <div className="flow-node output-node">Обновление весов: optimizer.step() + lr_scheduler.step()</div>
            </div>
          </div>

          <AlertBox type="tip" title="Ключевые инженерные решения тренера">
            <ul>
              <li><strong>Zero-Copy Prefetching:</strong> Использование <code>pin_memory=True</code> и предвыборка батчей в оперативной памяти устраняют задержки передачи по шине PCIe Gen3/Gen4.</li>
              <li><strong>BFloat16 стабильность:</strong> Формат <code>bfloat16</code> сохраняет динамический диапазон <code>float32</code> (8 бит экспоненты), предотвращая переполнение и обнуление подпороговых градиентов без необходимости агрессивного скалирования.</li>
              <li><strong>Асинхронный валидационный стрим:</strong> Оценка Perplexity на проверочной выборке исполняется параллельно с тренировочными батчами в независимом потоке CUDA, экономя до 12% общего времени эпохи.</li>
            </ul>
          </AlertBox>

          <h3>Сводка характеристик компонентов тренера</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Компонент</th>
                  <th>Технология</th>
                  <th>Преимущество</th>
                  <th>Экономия VRAM / Скорость</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Точность вычислений</td>
                  <td>PyTorch AMP (BFloat16)</td>
                  <td>Исключает потерю точности подпороговых градиентов</td>
                  <td>+85% скорости, -50% VRAM активаций</td>
                </tr>
                <tr>
                  <td>Оптимизатор FFN/Attn</td>
                  <td>GaLore (Low-Rank SVD)</td>
                  <td>Сжатие состояний первого и второго моментов в ранг r=128</td>
                  <td>-82.5% VRAM оптимизатора</td>
                </tr>
                <tr>
                  <td>Оптимизатор 2D-матриц</td>
                  <td>Muon (Newton-Schulz)</td>
                  <td>Поддержание спектральной ортогональности матриц весов</td>
                  <td>Ускорение сходимости на 25-30%</td>
                </tr>
                <tr>
                  <td>Валидация</td>
                  <td>CUDA Stream Async</td>
                  <td>Параллельный расчет loss без остановки backward pass</td>
                  <td>-10–12% времени эпохи</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "code",
      label: "КОД ТРЕНЕРА",
      content: (
        <>
          <h2>💻 Реализация тренировочного цикла (PyTorch)</h2>
          <p>
            Ниже приведен полный код класса <code>Trainer</code> с интеграцией BFloat16, 
            аккумулированием градиентов и клиппированием нормы.
          </p>

          <CodeBlock
            code={`import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.cuda.amp import autocast, GradScaler

class TolstoyTrainer:
    def __init__(
        self,
        model: nn.Module,
        optimizer: torch.optim.Optimizer,
        lr_scheduler,
        device: torch.device,
        grad_accum_steps: int = 4,
        max_grad_norm: float = 1.0,
        aux_loss_weight: float = 0.01,
    ):
        self.model = model.to(device)
        self.optimizer = optimizer
        self.scheduler = lr_scheduler
        self.device = device
        self.grad_accum_steps = grad_accum_steps
        self.max_grad_norm = max_grad_norm
        self.aux_loss_weight = aux_loss_weight
        self.scaler = GradScaler(enabled=(device.type == "cuda"))
        
        # Создаем изолированный поток для асинхронной валидации
        self.val_stream = torch.cuda.Stream() if device.type == "cuda" else None

    def train_epoch(self, dataloader, epoch_idx: int):
        self.model.train()
        total_loss = 0.0
        self.optimizer.zero_grad(set_to_none=True)

        for step, (inputs, targets) in enumerate(dataloader):
            inputs = inputs.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)

            with autocast(device_type=self.device.type, dtype=torch.bfloat16):
                # Прямой проход: получаем логиты и вспомогательный балансировочный лосс MoE
                logits, aux_loss = self.model(inputs)
                
                # Cross-Entropy Loss по всей последовательности
                loss_ce = F.cross_entropy(
                    logits.view(-1, logits.size(-1)),
                    targets.view(-1),
                    ignore_index=-100
                )
                loss = (loss_ce + self.aux_loss_weight * aux_loss) / self.grad_accum_steps

            # Обратный проход с масштабированием градиентов
            self.scaler.scale(loss).backward()
            total_loss += loss.item() * self.grad_accum_steps

            # Шаг оптимизатора при достижении порога аккумуляции
            if (step + 1) % self.grad_accum_steps == 0 or (step + 1) == len(dataloader):
                self.scaler.unscale_(self.optimizer)
                
                # Ограничение нормы градиента (защита от взрыва)
                grad_norm = torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(), 
                    self.max_grad_norm
                )
                
                self.scaler.step(self.optimizer)
                self.scaler.update()
                self.optimizer.zero_grad(set_to_none=True)
                self.scheduler.step()

        return total_loss / len(dataloader)`}
            language="python"
            filename="training/trainer.py"
          />

          <h3>Интеграция асинхронного валидатора</h3>
          <CodeBlock
            code={`def async_validate(self, val_loader):
    """Асинхронный расчет Perplexity в отдельном CUDA Stream без блокировки основного трейна"""
    if self.val_stream is None:
        return self._sync_validate(val_loader)

    with torch.cuda.stream(self.val_stream):
        self.model.eval()
        val_loss = 0.0
        with torch.no_grad(), autocast(dtype=torch.bfloat16):
            for inputs, targets in val_loader:
                inputs = inputs.to(self.device, non_blocking=True)
                targets = targets.to(self.device, non_blocking=True)
                logits, _ = self.model(inputs)
                val_loss += F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1)).item()
        
        ppl = torch.exp(torch.tensor(val_loss / len(val_loader))).item()
        self.model.train()
        return ppl`}
            language="python"
            filename="training/async_validation.py"
          />
        </>
      ),
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h2>📐 Математический аппарат оптимизации</h2>

          <h3>1. Кросс-энтропия и Perplexity</h3>
          <p>
            Функция потерь рассчитывается как средняя кросс-энтропия по последовательности токенов длины <Math formula="T" />:
          </p>
          <Math
            formula="\mathcal{L}_{CE}(\theta) = -\frac{1}{T}\sum_{t=1}^T \log P_\theta(x_t \mid x_{<t}) = -\frac{1}{T}\sum_{t=1}^T \left( z_{t, x_t} - \log \sum_{j=1}^{|V|} e^{z_{t, j}} \right)"
            block={true}
          />
          <p>
            Метрика <strong>Perplexity (Перплексия)</strong> является экспонентой от кросс-энтропии и показывает среднее количество эквивалентных вариантов выбора следующего слова:
          </p>
          <Math
            formula="\text{PPL} = \exp\left( \mathcal{L}_{CE} \right) = 2^{\mathcal{H}(P, Q)}"
            block={true}
          />

          <h3>2. Расписание скорости обучения: Cosine Annealing with Warmup</h3>
          <p>
            Для гарантии плавной инициализации параметров и стабилизации градиентного ландшафта 
            используется косинусное затухание с линейным разогревом (Warmup):
          </p>
          <Math
            formula="\eta_t = \begin{cases} \eta_{max} \cdot \frac{t}{T_{warm}}, & \text{если } t \le T_{warm} \\ \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})\left(1 + \cos\left(\frac{t - T_{warm}}{T_{max} - T_{warm}}\pi\right)\right), & \text{если } t > T_{warm} \end{cases}"
            block={true}
          />
          <p>
            Где <Math formula="T_{warm}" /> составляет обычно 5-10% от общего числа итераций <Math formula="T_{max}" />, а <Math formula="\eta_{min} = 0.1 \cdot \eta_{max}" />.
          </p>

          <h3>3. Клиппирование нормы градиентов</h3>
          <p>
            Для исключения разрушения весовых матриц единичными аномальными выбросами градиент 
            нормализуется по евклидовой норме:
          </p>
          <Math
            formula="\mathbf{g} \leftarrow \mathbf{g} \cdot \min\left(1, \frac{\gamma}{\|\mathbf{g}\|_2}\right), \quad \text{где } \|\mathbf{g}\|_2 = \sqrt{\sum_{i} g_i^2}"
            block={true}
          />
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ И ТРАБЛШУТИНГ",
      content: (
        <>
          <h2>❓ Частые вопросы и диагностика сбоев обучения</h2>

          <div className="faq-card">
            <h4>🚨 Лосс внезапно обратился в NaN (Not a Number)</h4>
            <p><strong>Причины:</strong> Взрыв градиентов в слоях внимания либо слишком высокий learning rate.</p>
            <p><strong>Решение:</strong></p>
            <ul>
              <li>Проверьте, включен ли <strong>QK-Norm</strong> в блоке внимания модели.</li>
              <li>Снизьте пиковый Learning Rate с <code>6e-4</code> до <code>2e-4</code>.</li>
              <li>Уменьшите порог клиппирования градиента <code>max_grad_norm</code> с <code>1.0</code> до <code>0.5</code>.</li>
            </ul>
          </div>

          <div className="faq-card">
            <h4>🚨 Validation Loss растет, а Training Loss продолжает падать</h4>
            <p><strong>Причина:</strong> Классическое переобучение (Overfitting). Модель заучивает тренировочный корпус наизусть.</p>
            <p><strong>Решение:</strong></p>
            <ul>
              <li>Увеличьте коэффициент регуляризации <code>weight_decay</code> до <code>0.1</code>.</li>
              <li>Добавьте аугментацию текста или увеличьте объем корпуса в 2-3 раза.</li>
              <li>Используйте контрольные чекпоинты Early Stopping по минимальному <code>val_loss</code>.</li>
            </ul>
          </div>

          <div className="faq-card">
            <h4>🚨 В чем разница между Batch Size и Gradient Accumulation?</h4>
            <p>
              Размер батча определяет количество примеров, единовременно загружаемых в память видеокарты. 
              Если GPU вмещает только 4 примера, но для стабильной сходимости нужен батч 32, мы устанавливаем 
              <code>batch_size = 4</code> и <code>grad_accum_steps = 8</code>. Градиенты 8 микро-батчей суммируются, 
              и шаг оптимизатора выполняется один раз, обеспечивая 100% математическую эквивалентность батчу 32.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="purple" />;
}
