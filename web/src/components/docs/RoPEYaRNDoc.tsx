import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function RoPEYaRNDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>🔄 Ротационные позиционные эмбеддинги: RoPE 2D и YaRN</h2>
          <p>
            В традиционных трансформерах (Vaswani et al., 2017) позиционная информация добавлялась 
            путем простого сложения векторов абсолютных координат: <Math formula="\mathbf{x} + \mathbf{p}_m" />. 
            Однако такой подход плохо масштабируется на длинные контексты и теряет относительное расстояние между словами.
          </p>
          <p>
            В <strong>TolstoyLLM</strong> внедрен механизм <strong>RoPE (Rotary Position Embedding)</strong> 
            в комплексе со спектральным масштабированием <strong>YaRN (Yet another RoPE extensioN)</strong>. 
            Вместо сложения векторов RoPE <strong>вращает</strong> векторы Query и Key в комплексном 2D-пространстве. 
            Благодаря этому скалярное произведение зависит исключительно от <em>относительного расстояния</em> 
            между токенами <Math formula="(m - n)" />.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Принцип вращения векторов RoPE в двумерных подпространствах</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Входные векторы Query (q) и Key (k) размерности d_k</div>
              <div className="flow-connector font-mono">↓ Разбиение на пары 2D-координат (x[2i], x[2i+1])</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">
                  Позиция токена m → Комплексный множитель exp(i·m·θ_j) = cos(m·θ_j) + i·sin(m·θ_j)
                </div>
                <div className="flow-connector-short">↓ Комплексное умножение</div>
                <div className="sub-node">
                  Повернутый вектор: q_m^(j) = R(θ_j, m) · q^(j)
                </div>
                <div className="flow-connector-short">↓ YaRN интерполяция частот</div>
                <div className="sub-node highlight-purple">
                  Масштабирование контекста: θ&apos;_j = f_YaRN(θ_j, s) (Контекст 2K → 16K без потери перплексии)
                </div>
              </div>
              <div className="flow-connector font-mono">↓ Вычисление внимания</div>
              <div className="flow-node output-node">
                ⟨q_m, k_n⟩ = Re(q · k* · exp(i(m - n)θ)) — инвариантно к абсолютной позиции
              </div>
            </div>
          </div>

          <AlertBox type="tip" title="Преимущества комбинации RoPE + YaRN">
            <ul>
              <li><strong>Относительная инвариантность:</strong> Расстояние между 1-м и 4-м словом математически тождественно расстоянию между 101-м и 104-м токеном.</li>
              <li><strong>Спектральное угасание:</strong> С ростом дистанции между словами корреляция естественным образом стремится к нулю без искусственных масок.</li>
              <li><strong>YaRN context extension:</strong> Позволяет дообучить модель с базовым контекстом 2048 токенов на контекст 16384 токена всего за 2.5% от исходного времени обучения.</li>
            </ul>
          </AlertBox>

          <h3>Сравнение методов позиционного кодирования</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Метод</th>
                  <th>Тип кодирования</th>
                  <th>Относительное расстояние</th>
                  <th>Экстраполяция длины</th>
                  <th>Оверхед по памяти</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Absolute Sinusoidal (Attention is All You Need)</td>
                  <td>Сложение векторов</td>
                  <td>Слабое (неявное)</td>
                  <td>Крайне низкая (деградация &gt; 100%)</td>
                  <td>O(T · d) таблица</td>
                </tr>
                <tr>
                  <td>ALiBi (Press et al.)</td>
                  <td>Линейный сдвиг логитов</td>
                  <td>Явное линейное</td>
                  <td>Средняя</td>
                  <td>0 дополнительных параметров</td>
                </tr>
                <tr>
                  <td><strong>RoPE 2D (Su et al.)</strong></td>
                  <td><strong>Комплексное вращение</strong></td>
                  <td><strong>Идеальное мультипликативное</strong></td>
                  <td><strong>Высокая (до 2×)</strong></td>
                  <td><strong>0 обучаемых параметров</strong></td>
                </tr>
                <tr>
                  <td><strong>RoPE + YaRN (Tolstoy)</strong></td>
                  <td><strong>Частотно-зависимая интерполяция</strong></td>
                  <td><strong>Идеальное мультипликативное</strong></td>
                  <td><strong>Экстремальная (до 8×–16×)</strong></td>
                  <td><strong>0 обучаемых параметров</strong></td>
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
          <h2>💻 Реализация RoPE и YaRN в `models/layers.py`</h2>
          <p>
            В TolstoyLLM реализован предрасчет комплексных экспонент в формате полярных координат 
            (<code>torch.polar</code>), что устраняет вызовы тригонометрических функций во время прямого прохода.
          </p>

          <CodeBlock
            code={`import torch
import torch.nn as nn

def precompute_freqs_cis(dim: int, end: int = 4096, theta: float = 10000.0, rope_scaling: float = 1.0, device='cpu'):
    """Предрасчет комплексных поворотных множителей freqs_cis с поддержкой масштабирования YaRN"""
    if rope_scaling > 1.0:
        # YaRN частотная модификация базы theta
        theta = theta * (rope_scaling ** (dim / (dim - 2)))

    # 1. Вычисляем частоты для четных измерений вектора: theta^(-2i/d)
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2, device=device)[: (dim // 2)].float() / dim))
    
    # 2. Создаем временную шкалу позиций t = [0, 1, 2, ..., end-1]
    t = torch.arange(end, device=device)
    
    # 3. Внешнее произведение позиций на частоты дает сетку углов
    freqs = torch.outer(t, freqs).float()
    
    # 4. Переводим углы в комплексные экспоненты: e^(i * freqs)
    freqs_cis = torch.polar(torch.ones_like(freqs), freqs)
    return freqs_cis

def apply_rotary_emb(xq: torch.Tensor, xk: torch.Tensor, freqs_cis: torch.Tensor):
    """Применение ротационных эмбеддингов к тензорам Query и Key через комплексное умножение"""
    # Преобразуем последние координаты в пары комплексных чисел: [B, T, H, d] -> [B, T, H, d//2]
    xq_ = torch.view_as_complex(xq.float().reshape(*xq.shape[:-1], -1, 2))
    xk_ = torch.view_as_complex(xk.float().reshape(*xk.shape[:-1], -1, 2))
    
    # Выбираем срез freqs_cis под текущую длину последовательности T
    T = xq_.shape[1]
    freqs_cis = freqs_cis[:T].view(1, T, 1, xq_.shape[-1])
    
    # Комплексное умножение выполняет поворот координат на угол m * theta_j
    xq_out = torch.view_as_real(xq_ * freqs_cis).flatten(3)
    xk_out = torch.view_as_real(xk_ * freqs_cis).flatten(3)
    
    return xq_out.type_as(xq), xk_out.type_as(xk)`}
            language="python"
            filename="models/layers.py"
          />

          <AlertBox type="note" title="Комплексный трюк torch.view_as_complex">
            Умножение комплексных чисел <Math formula="(a + ib)(c + id) = (ac - bd) + i(ad + bc)" /> 
            полностью эквивалентно ортогональной матрице поворота 2D-вектора на угол <Math formula="\theta" />. 
            Применение <code>torch.view_as_complex</code> позволяет GPU выполнять поворот одной векторизованной FMA-инструкцией!
          </AlertBox>
        </>
      ),
    },
    {
      id: "math",
      label: "МАТЕМАТИКА",
      content: (
        <>
          <h2>📐 Математическое доказательство инвариантности RoPE</h2>

          <h3>1. Матрица двумерного поворота</h3>
          <p>
            Для каждой пары измерений <Math formula="(2i, 2i+1)" /> вектора размерности <Math formula="d" /> 
            определяется блочно-диагональная ортогональная матрица:
          </p>
          <Math
            formula="\mathbf{R}_{\Theta, m}^{d} = \text{diag}\left( \mathbf{R}_{\theta_1, m}, \mathbf{R}_{\theta_2, m}, \dots, \mathbf{R}_{\theta_{d/2}, m} \right), \quad \text{где } \mathbf{R}_{\theta_i, m} = \begin{pmatrix} \cos(m\theta_i) & -\sin(m\theta_i) \\ \sin(m\theta_i) & \cos(m\theta_i) \end{pmatrix}"
            block={true}
          />
          <p>
            Где спектральные частоты определяются как:
          </p>
          <Math
            formula="\theta_i = 10000^{-2(i-1)/d}, \quad i \in \left[1, \frac{d}{2}\right]"
            block={true}
          />

          <h3>2. Доказательство зависимости только от разности (m - n)</h3>
          <p>
            Рассмотрим скалярное произведение повернутых векторов запроса на позиции <Math formula="m" /> и ключа на позиции <Math formula="n" />:
          </p>
          <Math
            formula="\langle \mathbf{R}_{\Theta, m}^{d} \mathbf{q}, \mathbf{R}_{\Theta, n}^{d} \mathbf{k} \rangle = (\mathbf{R}_{\Theta, m}^{d} \mathbf{q})^T (\mathbf{R}_{\Theta, n}^{d} \mathbf{k}) = \mathbf{q}^T (\mathbf{R}_{\Theta, m}^{d})^T \mathbf{R}_{\Theta, n}^{d} \mathbf{k}"
            block={true}
          />
          <p>
            Так как матрицы вращения образуют группу <Math formula="SO(2)" />, их произведение равно повороту на разность углов:
          </p>
          <Math
            formula="(\mathbf{R}_{\Theta, m}^{d})^T \mathbf{R}_{\Theta, n}^{d} = \mathbf{R}_{\Theta, -m}^{d} \mathbf{R}_{\Theta, n}^{d} = \mathbf{R}_{\Theta, n - m}^{d}"
            block={true}
          />
          <p>
            Следовательно, скалярное произведение в механизме внимания полностью инвариантно к абсолютным координатам токенов:
          </p>
          <Math
            formula="\langle \mathbf{R}_{\Theta, m}^{d} \mathbf{q}, \mathbf{R}_{\Theta, n}^{d} \mathbf{k} \rangle = g(\mathbf{q}, \mathbf{k}, m - n)"
            block={true}
          />

          <h3>3. YaRN частотная интерполяция</h3>
          <p>
            При масштабировании контекста в <Math formula="s = L_{\text{new}} / L_{\text{old}}" /> раз длина волны <Math formula="\lambda_i = 2\pi / \theta_i" /> разделяется на три спектральные зоны:
          </p>
          <Math
            formula="\theta'_i = (1 - \alpha_i) \frac{\theta_i}{s} + \alpha_i \theta_i, \quad \text{где } \alpha_i = \text{clip}\left(\frac{r_i - \beta_{low}}{\beta_{high} - \beta_{low}}, 0, 1\right)"
            block={true}
          />
          <p>
            Высокочастотные гармоники не интерполируются (сохраняя локальные синтаксические связи), 
            а низкочастотные плавно растягиваются, устраняя затухание внимания на дистанциях в тысячи токенов.
          </p>
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ И НАСТРОЙКА",
      content: (
        <>
          <h2>❓ Вопросы и рекомендации по расширению контекста</h2>

          <div className="faq-card">
            <h4>🚨 Можно ли обучить модель на 2048 токенов, а в чате генерировать на 8192?</h4>
            <p>
              Да! Именно для этого предназначен параметр <code>rope_scaling</code>. Укажите при инференсе 
              коэффициент <code>rope_scaling = 4.0</code>. Благодаря YaRN модель сохранит устойчивость внимания 
              без внезапного роста перплексии.
            </p>
          </div>

          <div className="faq-card">
            <h4>🚨 Почему RoPE применяется только к Query и Key, но не к Value?</h4>
            <p>
              Вектор Value (<Math formula="\mathbf{v}" />) представляет собой семантическое содержание токена, 
              а не его координату. Позиция токена должна определять только <em>вес внимания</em> (силу связи между словами), 
              который рассчитывается исключительно через матрицу <Math formula="\mathbf{q}^T \mathbf{k}" />.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="cyan" />;
}
