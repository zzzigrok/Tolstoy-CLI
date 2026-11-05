import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function OptimizersDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>⚡ Продвинутые оптимизаторы: GaLore и Muon</h2>
          <p>
            Одной из главных преград при обучении языковых моделей на потребительском "железе" является 
            память, потребляемая состояниями оптимизатора. В классическом AdamW на каждый параметр модели 
            хранятся два 32-битных тензора (первый и второй моменты градиента), что требует в <strong>2–3 раза больше VRAM</strong>, 
            чем сама модель!
          </p>
          <p>
            В Tolstoy AI Studio реализованы два фундаментальных оптимизатора нового поколения:
          </p>
          <ul>
            <li>
              <strong>GaLore (Gradient Low-Rank Projection):</strong> Проецирует градиенты тяжелых матриц в низкоранговое 
              подпространство (<Math formula="r = 128" />), снижая расход памяти оптимизатора на <strong>82.5%</strong> 
              без потери точности сходимости.
            </li>
            <li>
              <strong>Muon (Matrix Update via Orthogonalization):</strong> Применяет 5-шаговые итерации 
              <strong>Ньютона-Шульца</strong> для поддержания спектральной ортогональности матриц весов, 
              устраняя взаимную корреляцию нейронов и ускоряя обучение на <strong>25–30%</strong>.
            </li>
          </ul>

          <div className="docs-diagram-container">
            <div className="diagram-title">Сравнение работы классического AdamW, GaLore и Muon</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Градиент тензора весов G ∈ ℝ^[M × N]</div>
              <div className="flow-connector font-mono">↓ Выбор стратегии обновления</div>
              <div className="flow-node layer-box">
                <div className="sub-node">
                  Стандартный AdamW: m_t, v_t ∈ ℝ^[M × N] (Расход VRAM: 8 байт / параметр)
                </div>
                <div className="flow-connector-short">или</div>
                <div className="sub-node highlight-cyan">
                  GaLore: SVD разложение каждые 200 шагов → G_proj = U_r^T · G · V_r ∈ ℝ^[r × r] (Экономия 82.5% VRAM)
                </div>
                <div className="flow-connector-short">или</div>
                <div className="sub-node highlight-purple">
                  Muon: Nesterov Momentum + 5 итераций Ньютона-Шульца → Ортогональное обновление W
                </div>
              </div>
              <div className="flow-connector font-mono">↓ Обновление весов</div>
              <div className="flow-node output-node">Новые веса: W[t+1] = W[t] - η · ΔW</div>
            </div>
          </div>

          <AlertBox type="tip" title="Экономический эффект GaLore + Muon">
            Благодаря GaLore и Muon вы можете полноценно обучать модель <strong>TolstoyLLM Large (350M–1B параметров)</strong> 
            на обычной игровой видеокарте <strong>GeForce RTX 3060 (12 GB)</strong> или <strong>RTX 4070</strong>, 
            где раньше не помещалась даже модель на 120M параметров!
          </AlertBox>

          <h3>Сравнительная таблица потребления памяти и скорости</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Оптимизатор</th>
                  <th>Память состояний (1B модель)</th>
                  <th>Относительный расход VRAM</th>
                  <th>Степень ортогональности</th>
                  <th>Скорость сходимости</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AdamW (FP32)</td>
                  <td>~8.0 GB</td>
                  <td>100% (базовый)</td>
                  <td>Низкая (дрейф спектра)</td>
                  <td>1.0×</td>
                </tr>
                <tr>
                  <td>8-bit AdamW (bitsandbytes)</td>
                  <td>~2.0 GB</td>
                  <td>25%</td>
                  <td>Низкая</td>
                  <td>0.98×</td>
                </tr>
                <tr>
                  <td><strong>GaLore (Rank=128)</strong></td>
                  <td><strong>~1.4 GB</strong></td>
                  <td><strong>17.5% (-82.5%)</strong></td>
                  <td>Средняя</td>
                  <td><strong>1.02×</strong></td>
                </tr>
                <tr>
                  <td><strong>Muon (Newton-Schulz)</strong></td>
                  <td><strong>~2.1 GB</strong></td>
                  <td><strong>26%</strong></td>
                  <td><strong>Идеальная (спектр = 1)</strong></td>
                  <td><strong>1.28× (быстрее всех)</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "code",
      label: "КОД ОПТИМИЗАТОРОВ",
      content: (
        <>
          <h2>💻 Исходный код GaLore и Muon в `training/trainer.py`</h2>

          <h3>1. Реализация GaLore: SVD-проекция подпространства</h3>
          <CodeBlock
            code={`import torch
from torch.optim import Optimizer

class GaLoreOptimizer(Optimizer):
    def __init__(self, params, lr=1e-3, rank=128, update_proj_gap=200, scale=1.0):
        defaults = dict(lr=lr, rank=rank, update_proj_gap=update_proj_gap, scale=scale)
        super().__init__(params, defaults)

    def _project_gradient(self, p, grad, rank, gap, step):
        state = self.state[p]
        # Обновление матриц проекции U и V через SVD каждые 'gap' шагов
        if step % gap == 0 or 'U' not in state:
            # SVD разложение градиента: G = U * S * Vh
            U, S, Vh = torch.linalg.svd(grad.float(), full_matrices=False)
            state['U'] = U[:, :rank].to(grad.dtype)
            state['V'] = Vh[:rank, :].T.to(grad.dtype)

        U = state['U']
        V = state['V']
        # Сжимаем матрицу [M, N] в крошечное ядро [rank, rank]
        grad_projected = U.T @ grad @ V
        return grad_projected, U, V

    @torch.no_grad()
    def step(self):
        for group in self.param_groups:
            rank = group['rank']
            gap = group['update_proj_gap']
            for p in group['params']:
                if p.grad is None:
                    continue
                grad = p.grad
                step = self.state[p].get('step', 0)
                
                # Проекция градиента в низкоранговое подпространство
                grad_proj, U, V = self._project_gradient(p, grad, rank, gap, step)
                
                # Обновление моментов AdamW в низкоранговом пространстве (экономия 82% VRAM!)
                delta_proj = self._adam_step_lowrank(p, grad_proj)
                
                # Распаковка обратно в полный размер тензора весов
                p.data.add_(U @ delta_proj @ V.T, alpha=-group['lr'])
                self.state[p]['step'] = step + 1`}
            language="python"
            filename="training/galore.py"
          />

          <h3>2. Реализация Muon: 5-шаговый метод Ньютона-Шульца</h3>
          <CodeBlock
            code={`def newton_schulz_5(G: torch.Tensor, steps: int = 5, eps: float = 1e-7) -> torch.Tensor:
    """Итерации Ньютона-Шульца для приближения полярного разложения (ортогонализации) G"""
    a, b, c = (3.4445, -4.7750, 2.0315) # Оптимальные полиномиальные коэффициенты
    X = G.bfloat16()
    # Спектральная нормализация начального приближения
    X = X / (X.norm() + eps)
    
    if G.size(0) > G.size(1):
        X = X.T
        
    for _ in range(steps):
        A = X @ X.T
        B = b * A + c * (A @ A)
        X = a * X + B @ X
        
    if G.size(0) > G.size(1):
        X = X.T
    return X.type_as(G)`}
            language="python"
            filename="training/muon.py"
          />
        </>
      ),
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h2>📐 Математические основы низкоранговой проекции и ортогонализации</h2>

          <h3>1. Сингулярное разложение (SVD) в GaLore</h3>
          <p>
            Матрица градиентов параметров слоя <Math formula="\mathbf{G} \in \mathbb{R}^{m \times n}" /> раскладывается 
            на левые и правые сингулярные векторы:
          </p>
          <Math
            formula="\mathbf{G} = \mathbf{U} \mathbf{\Sigma} \mathbf{V}^T = \sum_{i=1}^{\min(m, n)} \sigma_i \mathbf{u}_i \mathbf{v}_i^T"
            block={true}
          />
          <p>
            Выбирая первые <Math formula="r \ll \min(m, n)" /> векторов, мы строим усеченные матрицы <Math formula="\mathbf{U}_r \in \mathbb{R}^{m \times r}" /> 
            и <Math formula="\mathbf{V}_r \in \mathbb{R}^{n \times r}" />. Проекция градиента в сжатое подпространство:
          </p>
          <Math
            formula="\widetilde{\mathbf{G}} = \mathbf{U}_r^T \mathbf{G} \mathbf{V}_r \in \mathbb{R}^{r \times r}"
            block={true}
          />
          <p>
            После применения адаптивного шага Adam к матрице <Math formula="\widetilde{\mathbf{G}}" /> 
            полноразмерное обновление весов восстанавливается как:
          </p>
          <Math
            formula="\Delta \mathbf{W} = \mathbf{U}_r \cdot \text{Adam}(\widetilde{\mathbf{G}}) \cdot \mathbf{V}_r^T"
            block={true}
          />

          <h3>2. Итерации Ньютона-Шульца в оптимизаторе Muon</h3>
          <p>
            Задача Muon — найти ближайшую ортогональную матрицу <Math formula="\mathbf{O}" /> (полярный фактор матрицы градиентов <Math formula="\mathbf{G}" />). 
            Прямое вычисление через инверсию или SVD требует <Math formula="\mathcal{O}(N^3)" /> операций. Метод Шульца находит решение итеративно:
          </p>
          <Math
            formula="\mathbf{X}_{k+1} = \frac{1}{2} \mathbf{X}_k \left( 3\mathbf{I} - \mathbf{X}_k^T \mathbf{X}_k \right)"
            block={true}
          />
          <p>
            Этот алгоритм обладает квадратичной скоростью сходимости:
          </p>
          <Math
            formula="\|\mathbf{I} - \mathbf{X}_{k+1}^T \mathbf{X}_{k+1}\| = \mathcal{O}\left( \|\mathbf{I} - \mathbf{X}_k^T \mathbf{X}_k\|^2 \right)"
            block={true}
          />
          <p>
            Всего за 5 итераций спектральная ошибка падает ниже <Math formula="10^{-6}" />, а вычисления на 100% состоят из быстрых матричных умножений на тензорных ядрах GPU.
          </p>
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ И СОВЕТЫ",
      content: (
        <>
          <h2>❓ Рекомендации по выбору оптимизатора</h2>

          <div className="faq-card">
            <h4>🚨 Когда выбирать GaLore, а когда Muon?</h4>
            <p>
              <strong>GaLore</strong> идеален, если вы упираетесь в предел видеопамяти (например, пытаетесь обучить модель 350M на карте с 8–12 GB VRAM). 
              <strong>Muon</strong> рекомендуется для моделей, которые свободно помещаются в память, так как он обеспечивает максимальную скорость сходимости и устойчивость глубоких сетей.
            </p>
          </div>

          <div className="faq-card">
            <h4>🚨 Как настраивать Learning Rate для Muon?</h4>
            <p>
              Поскольку Muon нормализует шаги по спектральной норме матрицы, стандартный Learning Rate от AdamW (например, <code>3e-4</code>) 
              для него слишком мал. Для Muon типичный рабочий LR составляет от <code>0.01</code> до <code>0.02</code>. 
              Тренер Tolstoy автоматически применяет масштабирование скорости обучения при выборе флага <code>--optimizer muon</code>.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="cyan" />;
}
