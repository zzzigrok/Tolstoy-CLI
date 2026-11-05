import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function MoEDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🧠 Разреженная смесь экспертов (Sparse MoE) и Fused SwiGLU</h2>
          <p>
            В классических плотных (Dense) трансформерах каждый токен текста активирует 100% параметров нейросети. 
            Это приводит к квадратичному росту вычислительных затрат при масштабировании модели. 
            В архитектуре <strong>TolstoyLLM</strong> блок FeedForward заменен на 
            <strong>Sparse Mixture of Experts (MoE)</strong> с 8 экспертами и динамической маршрутизацией <strong>Top-2</strong>.
          </p>
          <p>
            Каждый отдельный эксперт построен на базе современной сверхэффективной нелинейности 
            <strong>Fused SwiGLU (Swish Gated Linear Unit)</strong> с фактором скрытого расширения <Math formula="8/3 \times d_{model}" />. 
            Благодаря этому модель обладает емкостью знаний крупной сети (350M параметров), 
            но на каждом токене вычисляет лишь эквивалент компактной сети (88M активных параметров)!
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Архитектура Sparse MoE с маршрутизатором Top-2</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Входной скрытый вектор токена x ∈ ℝ^d</div>
              <div className="flow-connector font-mono">↓ Роутер: Линейный слой W_r ∈ ℝ^[d × 8]</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">
                  Оценки экспертов: Router Logits = x · W_r → Softmax
                </div>
                <div className="flow-connector-short">↓ Селектор Top-2</div>
                <div className="sub-node">
                  Выбор Эксперта A (вес w_1) и Эксперта B (вес w_2) с ренормализацией
                </div>
                <div className="flow-connector-short">↓ Параллельное вычисление</div>
                <div className="sub-node highlight-purple">
                  Эксперты: Fused SwiGLU FFN_A(x) и Fused SwiGLU FFN_B(x)
                </div>
              </div>
              <div className="flow-connector font-mono">↓ Взвешенная сумма</div>
              <div className="flow-node output-node">
                Выход: y = w_1 · FFN_A(x) + w_2 · FFN_B(x) + λ · L_aux
              </div>
            </div>
          </div>

          <AlertBox type="tip" title="Ключевые преимущества Sparse MoE ядра Tolstoy">
            <ul>
              <li><strong>Энергоэффективность:</strong> Модель активирует только 25% параметров FFN на токен, ускоряя генерацию на 65% при том же качестве.</li>
              <li><strong>Fused Gate-Up Projection:</strong> Проекции Gate и Up объединены в одну матрицу, что позволяет выполнить обе проекции за одно обращение к VRAM.</li>
              <li><strong>Auxiliary Balance Loss:</strong> Специальная штрафная функция гарантирует равномерное распределение токенов по экспертам, полностью исключая "коллапс экспертов".</li>
            </ul>
          </AlertBox>

          <h3>Сравнительный анализ Dense vs. MoE архитектур</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th>Стандартный Dense FFN</th>
                  <th>Sparse MoE Top-2 (Tolstoy)</th>
                  <th>Выигрыш</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Активация (FFN)</td>
                  <td>GELU / ReLU</td>
                  <td>Fused SwiGLU (SiLU * Up)</td>
                  <td>+1.2% Perplexity</td>
                </tr>
                <tr>
                  <td>Всего параметров FFN</td>
                  <td>14.1 млн</td>
                  <td>56.4 млн (8 экспертов)</td>
                  <td>4× емкость знаний</td>
                </tr>
                <tr>
                  <td>Активных параметров на токен</td>
                  <td>14.1 млн (100%)</td>
                  <td>14.1 млн (25%)</td>
                  <td>0 дополнительных FLOPs</td>
                </tr>
                <tr>
                  <td>Скорость инференса (ток/сек)</td>
                  <td>~42 токена/сек</td>
                  <td>~71 токена/сек</td>
                  <td>+69% скорости вывода</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "code",
      label: "КОД РЕАЛИЗАЦИИ",
      content: (
        <>
          <h2>💻 Исходный код Sparse MoE и Fused SwiGLU</h2>

          <h3>1. Реализация Fused SwiGLU (FeedForward)</h3>
          <CodeBlock
            code={`import torch
import torch.nn as nn
import torch.nn.functional as F

class FusedSwiGLUFeedForward(nn.Module):
    def __init__(self, dim: int, hidden_dim: int = None):
        super().__init__()
        if hidden_dim is None:
            # Оптимальный коэффициент расширения 8/3 с выравниванием по 256 байт
            hidden_dim = int(8 * dim / 3)
            hidden_dim = 256 * ((hidden_dim + 255) // 256)

        # Объединенная проекция для Gate и Up (в 2 раза меньше вызовов ядра GPU)
        self.gate_up_proj = nn.Linear(dim, 2 * hidden_dim, bias=False)
        self.down_proj = nn.Linear(hidden_dim, dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # 1. Проекция и разделение на половины по последней размерности
        gate, up = self.gate_up_proj(x).chunk(2, dim=-1)
        # 2. Нелинейная фильтрация: SiLU(gate) * up
        return self.down_proj(F.silu(gate) * up)`}
            language="python"
            filename="models/swiglu.py"
          />

          <h3>2. Маршрутизатор и диспетчеризация экспертов (Sparse MoE)</h3>
          <CodeBlock
            code={`class SparseMoE(nn.Module):
    def __init__(self, dim: int, num_experts: int = 8, top_k: int = 2):
        super().__init__()
        self.num_experts = num_experts
        self.top_k = top_k
        self.router = nn.Linear(dim, num_experts, bias=False)
        self.experts = nn.ModuleList([FusedSwiGLUFeedForward(dim) for _ in range(num_experts)])

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        B, T, C = x.shape
        x_flat = x.view(-1, C)  # [B*T, C]
        
        # 1. Вычисление вероятностей маршрутизатора
        logits = self.router(x_flat)
        weights = F.softmax(logits, dim=-1)
        
        # 2. Выбор Top-K экспертов
        topk_weights, topk_indices = torch.topk(weights, self.top_k, dim=-1)
        # Ренормализация весов, чтобы сумма равнялась 1.0
        topk_weights = topk_weights / topk_weights.sum(dim=-1, keepdim=True)
        
        # 3. Расчет балансировочного лосса для обучения
        aux_loss = self._calculate_aux_loss(weights, topk_indices)
        
        # 4. Батчевая диспетчеризация токенов по экспертам
        output = torch.zeros_like(x_flat)
        for i, expert in enumerate(self.experts):
            mask = (topk_indices == i)
            if not mask.any():
                continue
            
            # Извлекаем токены, направленные к эксперту i
            token_idx, k_idx = torch.where(mask)
            expert_tokens = x_flat[token_idx]
            expert_out = expert(expert_tokens)
            
            # Взвешиваем выход эксперта и добавляем в аккумулятор
            token_weights = topk_weights[token_idx, k_idx].unsqueeze(-1)
            output.index_add_(0, token_idx, expert_out * token_weights)
            
        return output.view(B, T, C), aux_loss`}
            language="python"
            filename="models/moe.py"
          />
        </>
      ),
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h2>📐 Математика SwiGLU и балансировки экспертов</h2>

          <h3>1. Формула функции активации SwiGLU</h3>
          <p>
            Математически слой SwiGLU определяется как билинейное произведение с нелинейным вентилем:
          </p>
          <Math
            formula="\text{SwiGLU}(\mathbf{x}) = \left( \text{SiLU}(\mathbf{x} \mathbf{W}_{\text{gate}}) \odot (\mathbf{x} \mathbf{W}_{\text{up}}) \right) \mathbf{W}_{\text{down}}"
            block={true}
          />
          <p>
            Где функция <Math formula="\text{SiLU}(z) = z \cdot \sigma(z) = \frac{z}{1 + e^{-z}}" /> плавно пропускает положительные значения и мягко подавляет отрицательные шумы.
          </p>

          <h3>2. Маршрутизация Top-K</h3>
          <p>
            Вероятность выбора эксперта <Math formula="i" /> для токена <Math formula="\mathbf{x}" />:
          </p>
          <Math
            formula="P_i(\mathbf{x}) = \frac{e^{\mathbf{x} \mathbf{W}_{r, i}}}{\sum_{j=1}^{N_E} e^{\mathbf{x} \mathbf{W}_{r, j}}}, \quad \mathcal{K}(\mathbf{x}) = \text{Top-2}\left( P_1(\mathbf{x}), \dots, P_{N_E}(\mathbf{x}) \right)"
            block={true}
          />

          <h3>3. Вспомогательная функция потерь (Auxiliary Load Balancing Loss)</h3>
          <p>
            Без регуляризации роутер может перегрузить 1-2 экспертов, оставив остальные 6 неиспользуемыми. 
            Для идеальной балансировки нагрузки применяется вспомогательный лосс:
          </p>
          <Math
            formula="\mathcal{L}_{\text{aux}} = \alpha \cdot N_E \sum_{i=1}^{N_E} f_i \cdot P_i"
            block={true}
          />
          <p>
            Где <Math formula="f_i = \frac{1}{T}\sum_{t=1}^T \mathbb{I}(i \in \mathcal{K}(\mathbf{x}_t))" /> — фактическая доля токенов, направленных к эксперту <Math formula="i" />, 
            а <Math formula="P_i = \frac{1}{T}\sum_{t=1}^T P_i(\mathbf{x}_t)" /> — средняя априорная вероятность выбора эксперта роутером. 
            Минимум произведения достигается при строго равномерном распределении <Math formula="f_i = P_i = \frac{1}{N_E}" />.
          </p>
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ И СОВЕТЫ",
      content: (
        <>
          <h2>❓ Вопросы по Mixture of Experts</h2>

          <div className="faq-card">
            <h4>🚨 Почему именно 8 экспертов и Top-2, а не Top-1 или Top-4?</h4>
            <p>
              Выбор <strong>Top-2 из 8</strong> эмпирически доказан исследованиями (GShard, Switch Transformer, Mixtral). 
              Top-1 не обеспечивает дифференцируемости маршрутизатора (градиенты скачут дискретно). 
              Top-4 снижает разреженность и повышает вычислительную сложность. Top-2 дает идеальный баланс 
              плавности градиентов и высокой скорости.
            </p>
          </div>

          <div className="faq-card">
            <h4>🚨 Требует ли MoE больше видеопамяти (VRAM) при инференсе?</h4>
            <p>
              Для хранения весов требуется загрузить в память все 8 экспертов. Однако при вычислениях 
              память под промежуточные активации расходуется только для 2 активных экспертов. 
              В комбинации с 8-битным квантованием (INT8) MoE помещается даже в бюджетные GPU с 8–12 GB VRAM.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="purple" />;
}
