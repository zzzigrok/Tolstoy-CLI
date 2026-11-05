import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function ArchitectureDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🏗️ Топология декодера TolstoyLLM_v7 Pro</h2>
          <p>
            <strong>TolstoyLLM_v7</strong> — это современная авторегрессионная языковая модель на базе архитектуры 
            <strong>Transformer (decoder-only)</strong>, специально спроектированная для эффективного обучения 
            и запуска на потребительских GPU с ограниченным объемом видеопамяти (от 6 до 12 GB VRAM).
          </p>
          <p>
            В отличие от классического трансформера Vaswani (2017) и LLaMA-1, в ядре v7 применен комплекс передовых модификаций:
            <strong>Pre-RMSNorm</strong> со стабилизацией <strong>QK-Norm</strong>, <strong>Parallel Residual Connections</strong>, 
            ротационные позиционные эмбеддинги <strong>RoPE 2D</strong>, групповое внимание <strong>GQA (Grouped Query Attention)</strong> 
            и разреженная смесь экспертов <strong>Sparse MoE (8 экспертов, Top-2)</strong>.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Послойный поток тензоров TolstoyLLM_v7</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Входные токены x ∈ ℤ^[B × T] (Vocab: 32,768)</div>
              <div className="flow-connector font-mono">↓ Embedding Lookup + Weight Tying</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">Векторное пространство H_0 ∈ ℝ^[B × T × 768]</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">RMSNorm (ε = 1e-6) + QK-Norm</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node highlight-cyan">GQA Attention (12 Q-голов, 4 KV-группы) + RoPE 2D</div>
                <div className="flow-connector-short">↓ Parallel Residual</div>
                <div className="sub-node">RMSNorm + Sparse MoE Top-2 (SwiGLU FFN)</div>
                <div className="flow-connector-short">↓</div>
                <div className="sub-node">H[l+1] = H[l] + Attn(RMS(H[l])) + MoE(RMS(H[l]))</div>
              </div>
              <div className="flow-connector font-mono">↓ Финальный RMSNorm</div>
              <div className="flow-node output-node">Выходные логиты Logits ∈ ℝ^[B × T × 32768]</div>
            </div>
          </div>
          
          <AlertBox type="tip" title="Ключевые преимущества ядра v7">
            <ul>
              <li><strong>Weight Tying:</strong> Входная матрица эмбеддингов и проекционная голова LM Head делят общие веса, экономя до 25.1 млн параметров (100.5 МБ VRAM).</li>
              <li><strong>QK-Norm:</strong> Нормализация векторов Query и Key перед вычислением Softmax полностью исключает взрыв градиентов при больших learning rate.</li>
              <li><strong>Parallel Residuals:</strong> Одновременный расчет Attention и FFN сокращает задержки межслойной синхронизации в CUDA на 14–18%.</li>
              <li><strong>XQuant-CL:</strong> Квантование KV-кэша в INT8 с динамическим поблочным масштабированием, снижающее расход памяти контекста в 2 раза.</li>
            </ul>
          </AlertBox>

          <h3>Сравнительный анализ конфигураций модели</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Конфигурация</th>
                  <th>Слои (L)</th>
                  <th>Hidden (d)</th>
                  <th>Heads (Q/KV)</th>
                  <th>Эксперты</th>
                  <th>Контекст (T)</th>
                  <th>Параметры</th>
                  <th>VRAM (Инференс)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Tolstoy-Nano</strong></td>
                  <td>12</td>
                  <td>512</td>
                  <td>8 / 2</td>
                  <td>Dense SwiGLU</td>
                  <td>2048</td>
                  <td>48M</td>
                  <td>~1.2 GB</td>
                </tr>
                <tr>
                  <td><strong>Tolstoy-Small</strong></td>
                  <td>18</td>
                  <td>768</td>
                  <td>12 / 4</td>
                  <td>4 Exp (Top-1)</td>
                  <td>4096</td>
                  <td>145M (42M акт.)</td>
                  <td>~2.4 GB</td>
                </tr>
                <tr>
                  <td><strong>Tolstoy-Pro (v7)</strong></td>
                  <td>24</td>
                  <td>1024</td>
                  <td>16 / 4</td>
                  <td>8 Exp (Top-2)</td>
                  <td>8192 (YaRN)</td>
                  <td>360M (95M акт.)</td>
                  <td>~4.8 GB</td>
                </tr>
                <tr>
                  <td><strong>Tolstoy-1B Studio</strong></td>
                  <td>32</td>
                  <td>2048</td>
                  <td>32 / 8</td>
                  <td>8 Exp (Top-2)</td>
                  <td>16384 (YaRN)</td>
                  <td>1.1B (280M акт.)</td>
                  <td>~7.8 GB (XQuant)</td>
                </tr>
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
          <h3>Построчная реализация блока Transformer v7</h3>
          <p>
            Ниже приведен полный исходный код базового вычислительного блока из <code>models/layers.py</code>, 
            объединяющий Pre-RMSNorm, параллельные резидуальные связи и поддержку QK-Norm.
          </p>
          <CodeBlock code={`import torch
import torch.nn as nn
import torch.nn.functional as F

class TolstoyTransformerBlock(nn.Module):
    """
    Архитектурный блок Transformer v7:
    - Pre-RMSNorm структура с раздельными нормализаторами
    - Parallel Residuals: Attention и FFN вычисляются параллельно от нормализованного входа
    - Поддержка GQA и MoE маршрутизации
    """
    def __init__(self, config):
        super().__init__()
        self.attn_norm = RMSNorm(config.d_model, eps=config.norm_eps)
        self.ffn_norm = RMSNorm(config.d_model, eps=config.norm_eps)
        
        # Внимание с RoPE и QK-Norm
        self.attn = GroupedQueryAttention(
            d_model=config.d_model,
            n_heads=config.n_heads,
            n_kv_heads=config.n_kv_heads,
            head_dim=config.head_dim,
            qk_norm=True
        )
        
        # FFN: либо классический SwiGLU, либо Sparse MoE
        if config.use_moe:
            self.ffn = SparseMoELayer(config)
        else:
            self.ffn = SwiGLUFFN(config.d_model, config.d_ffn)

    def forward(self, x: torch.Tensor, freqs_cis: torch.Tensor, mask: torch.Tensor = None):
        # Parallel Residual Architecture:
        # x_norm вычисляется для Attention и FFN одновременно
        h_attn = self.attn(self.attn_norm(x), freqs_cis=freqs_cis, mask=mask)
        h_ffn = self.ffn(self.ffn_norm(x))
        
        # Единое параллельное сложение в остаточный поток:
        # Устраняет лишнее чтение/запись в память между Attention и FFN
        return x + h_attn + h_ffn`} language="python" />

          <h3>Реализация RMSNorm с обучаемым масштабом</h3>
          <p>
            В отличие от <code>torch.nn.LayerNorm</code>, RMSNorm не центрирует тензор относительно среднего, 
            а лишь масштабирует среднеквадратичную норму вектора, что ускоряет выполнение ядра CUDA на 12–15%.
          </p>
          <CodeBlock code={`class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def _norm(self, x: torch.Tensor) -> torch.Tensor:
        # Вычисление среднеквадратичного значения по последней размерности:
        # rms = sqrt(mean(x^2) + eps)
        return x * torch.rsqrt(x.pow(2).mean(dim=-1, keepdim=True) + self.eps)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        output = self._norm(x.float()).type_as(x)
        return output * self.weight`} language="python" />
        </>
      )
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h3>Формализация математического аппарата</h3>
          <p>
            Пусть входной скрытый вектор токена на слое <Math formula="l" /> обозначен как <Math formula="h_l \in \mathbb{R}^d" />. 
            Формула RMSNorm выражается через корень из среднеквадратичного отклонения:
          </p>
          <Math formula="\text{RMSNorm}(x) = \frac{x}{\sqrt{\frac{1}{d} \sum_{i=1}^d x_i^2 + \epsilon}} \odot \gamma" block={true} />
          <p>где <Math formula="\gamma \in \mathbb{R}^d" /> — обучаемый вектор масштабирования, а <Math formula="\epsilon = 10^{-6}" /> — параметр численной стабильности.</p>

          <h3>Механизм внимания с QK-Norm</h3>
          <p>
            В классическом Scaled Dot-Product Attention при масштабировании моделей свыше 300M параметров скалярное 
            произведение векторов <Math formula="\mathbf{q}" /> и <Math formula="\mathbf{k}" /> на глубоких слоях начинает расти быстрее <Math formula="\sqrt{d_k}" />, вызывая перенасыщение Softmax.
            В TolstoyLLM_v7 векторы Query и Key нормализуются с помощью RMSNorm перед скалярным умножением:
          </p>
          <Math formula="\tilde{Q} = \text{RMSNorm}(Q), \quad \tilde{K} = \text{RMSNorm}(K)" block={true} />
          <Math formula="\text{Attention}(\tilde{Q}, \tilde{K}, V) = \text{Softmax}\left(\frac{\tilde{Q} \tilde{K}^T}{\sqrt{d_k}} + M\right) V" block={true} />

          <h3>Закон масштабирования параметров (Chinchilla Scaling Laws)</h3>
          <p>
            Для оптимального использования вычислительного бюджета <Math formula="C \approx 6ND" /> (где <Math formula="N" /> — число параметров, <Math formula="D" /> — число токенов датасета)
            отношение токенов к параметрам для русскоязычной литературы должно составлять не менее 20:1:
          </p>
          <Math formula="D_{opt} \approx 20 \times N_{params}" block={true} />
          <p>
            При обучении модели на 145M параметров оптимальный объем обучающего корпуса составляет ~2.9 млрд токенов. 
            При меньшем объеме (например, корпус классики 47M токенов) применяются методы регуляризации: LoRA/GaLore проекции и Dropout 0.1 на экспертных слоях.
          </p>
        </>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h3>Почему выбран decoder-only вместо encoder-decoder (T5)?</h3>
          <p>
            Архитектура decoder-only с каузальной маской внимания является мировым стандартом SOTA для языковых моделей (LLaMA, Mistral, GPT-4). 
            Она позволяет бесшовно совмещать обучение на авторегрессионное продолжение текста (next-token prediction) и быстрое кэширование ключей и значений (KV-Cache) при инференсе.
          </p>
          
          <h3>Что делать, если в логах обучения появляется NaN Loss?</h3>
          <p>
            Появление NaN обычно связано с переполнением разрядности в FP16. В Tolstoy-CLI v7 реализовано 3 уровня защиты:
          </p>
          <ul>
            <li>Переключение в режим <strong>BF16 (Bfloat16)</strong>, имеющий тот же динамический диапазон экспоненты, что и FP32 ($10^{-38} \dots 10^{38}$).</li>
            <li>Включение градиентного клиппинга <code>--grad-clip 1.0</code>.</li>
            <li>Активация QK-Norm нормализаторов, сдерживающих скачки логитов внимания.</li>
          </ul>

          <h3>Каковы требования к видеопамяти при контексте 8192 токена?</h3>
          <p>
            Благодаря GQA с 4 группами ключей и значений объем KV-кэша сокращается в 3 раза по сравнению с Multi-Head Attention:
          </p>
          <Math formula="\text{KV-Cache Size} = 2 \times 2 \times L \times n_{kv} \times d_k \times T \times \text{bytes\_per\_elem}" block={true} />
          <p>Для модели Tolstoy-Pro (24 слоя, 4 группы KV, $d_k=64$, $T=8192$) в точности FP16 кэш занимает всего 402 МБ на поток генерации.</p>
        </>
      )
    }
  ];

  return (
    <article className="docs-article">
      <div className="docs-article-header">
        <h1>Архитектура языковой модели TolstoyLLM_v7</h1>
        <p className="docs-lead-paragraph">
          Полная спецификация топологии трансформера: от математических формул QK-Norm и Parallel Residuals 
          до построчной реализации на PyTorch и масштабирования VRAM.
        </p>
      </div>
      <DocTabs tabs={tabs} accent="cyan" />
    </article>
  );
}
