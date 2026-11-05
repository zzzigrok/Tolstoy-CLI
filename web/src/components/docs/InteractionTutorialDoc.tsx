import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function InteractionTutorialDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>💬 Туториал: Искусство инференса и диалога</h2>
          <p>
            Инференс (вывод модели) — это процесс преобразования обученных числовых тензоров в связную человеческую мысль. 
            В базовой авторегрессионной модели генерация представляет собой итеративный выбор следующего токена 
            из распределения вероятностей, вычисленного слоем Softmax:
          </p>
          <Math
            formula="P(x_{t} \mid x_{<t}) = \text{Softmax}\left( \frac{\mathbf{z}_t}{T} \right)"
            block={true}
          />
          <p>
            Качество и стиль ответа нейросети на 50% зависят от правильности настройки параметров сэмплирования 
            (<strong>Temperature</strong>, <strong>Top-P</strong>, <strong>Min-P</strong>, <strong>Repetition Penalty</strong>) 
            и структуры вашего входящего запроса (<strong>Prompt Engineering</strong>).
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Конвейер обработки логитов при генерации ответа</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Сырые логиты модели z ∈ ℝ^V на шаге генерации</div>
              <div className="flow-connector font-mono">↓ Repetition Penalty (Штраф за повторы)</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">
                  Если токен уже был в контексте: z_i = z_i / θ (θ = 1.25)
                </div>
                <div className="flow-connector-short">↓ Температурное масштабирование</div>
                <div className="sub-node">
                  Масштабирование энтропии: z&apos;_i = z_i / T (T = 0.4 для ясной логики)
                </div>
                <div className="flow-connector-short">↓ Фильтрация Nucleus (Top-P) & Min-P</div>
                <div className="sub-node highlight-purple">
                  Отсечение &quot;хвоста&quot; мусорных токенов: Σ P(x_i) ≥ 0.90 (Top-P)
                </div>
              </div>
              <div className="flow-connector font-mono">↓ Случайная выборка (Multinomial Sampling)</div>
              <div className="flow-node output-node">
                Сэмплированный токен x_t → Стриминг в терминал + Добавление в KV-кэш
              </div>
            </div>
          </div>

          <AlertBox type="tip" title="Ключевое отличие базовой модели от ассистента">
            Помните: предобученная модель (Pre-trained Base Model) — это <strong>гениальный продолжатель текста</strong>, 
            а не исполнитель команд. Не пишите ей приказ: <em>"Напиши эссе о добре"</em> (она может начать рассуждать, зачем люди пишут эссе). 
            Задайте ей сильное контекстное начало: <em>"Добро есть вечная, высшая цель нашей жизни. Покуда мы..."</em>, 
            и модель гармонично подхватит и разовьет вашу мысль.
          </AlertBox>

          <h3>Памятка по подбору параметров сэмплирования</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Задача / Жанр</th>
                  <th>Temperature</th>
                  <th>Top-P</th>
                  <th>Repetition Penalty</th>
                  <th>Характер ответов</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Точные факты и наука</td>
                  <td><code>0.1 – 0.25</code></td>
                  <td><code>0.85</code></td>
                  <td><code>1.15</code></td>
                  <td>Строгий, детерминированный, без фантазий</td>
                </tr>
                <tr>
                  <td><strong>Классический диалог (Толстой)</strong></td>
                  <td><strong><code>0.4 – 0.5</code></strong></td>
                  <td><strong><code>0.90</code></strong></td>
                  <td><strong><code>1.25</code></strong></td>
                  <td><strong>Глубокий философский слог, богатые метафоры</strong></td>
                </tr>
                <tr>
                  <td>Художественная проза</td>
                  <td><code>0.6 – 0.75</code></td>
                  <td><code>0.92</code></td>
                  <td><code>1.20</code></td>
                  <td>Живой, выразительный рассказ</td>
                </tr>
                <tr>
                  <td>Поэзия и сюрреализм</td>
                  <td><code>0.85 – 1.1</code></td>
                  <td><code>0.95</code></td>
                  <td><code>1.10</code></td>
                  <td>Нестандартные рифмы, творческая свобода</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "prompts",
      label: "ПРОМПТИНГ",
      content: (
        <>
          <h2>✍️ Практические техники составления промптов</h2>

          <h3>1. Метод контекстной затравки (Prefix Prompting)</h3>
          <p>
            Задайте первые слова предложения в характерном для классика ритме:
          </p>
          <CodeBlock
            code={`❌ Неправильно (сухой приказ):
"Расскажи мне, что такое счастье."

✅ Правильно (контекстный запуск стиля):
"Истинное счастье человека заключается вовсе не во внешних благах, а в том, чтобы..."`}
            language="text"
            filename="Prompt Style Comparison"
          />

          <h3>2. Метод Few-Shot примеров</h3>
          <p>
            Если вы хотите, чтобы модель отвечала в формате вопрос-ответ или анализировала цитаты, 
            покажите ей 2 образца перед вашим вопросом:
          </p>
          <CodeBlock
            code={`Вопрос: Что есть истинная храбрость на войне?
Ответ князя Андрея: Храбрость состоит не в том, чтобы скакать на коне вперед всех, но в спокойном исполнении своего долга перед лицом смерти.

Вопрос: В чем смысл крестьянского труда?
Ответ Левина: В единении с природой и простоте сердца, очищающей душу от столичной суеты.

Вопрос: Зачем человеку дарована совесть?
Ответ:`}
            language="text"
            filename="Few-Shot Dialogue Example"
          />

          <h3>3. Ролевое погружение (Persona Priming)</h3>
          <CodeBlock
            code={`[Ясная Поляна. Августовский вечер. Лев Николаевич сидит за дубовым столом при свече.]
Собеседник: "Граф, как не потерять веру в людей в эпоху смуты и перемен?"
Лев Николаевич: "`}
            language="text"
            filename="Persona Prompt"
          />
        </>
      ),
    },
    {
      id: "chat-cli",
      label: "ИНТЕРАКТИВНЫЙ ЧАТ CLI",
      content: (
        <>
          <h2>💻 Работа в терминальном чате `tolstoy_cli.py`</h2>

          <h3>Запуск инференса</h3>
          <p>
            В терминале выберите пункт <code>[3] Запустить интерактивный чат</code>. CLI автоматически 
            найдет сохраненные чекпоинты и определит их конфигурацию:
          </p>
          <CodeBlock
            code={`$ python tolstoy_cli.py
...
Выберите действие > 3

[*] Поиск доступных моделей в каталоге checkpoints/...
    [1] tolstoy_chat_best.pth (Chat Preset | 88.2M | Loss: 2.341)
    [2] tolstoy_medium_epoch3.pth (Medium Preset | 142M | Loss: 2.115)
Выберите модель > 1

[*] Обнаружен привязанный токенизатор: tolstoy_chat_best_tokenizer.bpe
[*] Инициализация KV-кэша (Режим: XQuant-CL INT8)...
[*] Модель готова к диалогу! Нажмите Ctrl+C для выхода.
------------------------------------------------------------
Вы > Граф, в чем спасение души человеческой?
Толстой > Спасение души не в бегстве от мира, а в неустанном служении 
ближнему своему. Тот, кто живет лишь для себя, уподобляется засохшему 
колодцу; но тот, кто щедро изливает любовь свою на всякого встречного, 
обретает неиссякаемый источник вечной жизни...
------------------------------------------------------------
[Скорость: 88.4 ток/сек | KV-кэш: 48 МБ | Использовано VRAM: 3.1 GB]`}
            language="bash"
            filename="Terminal Interactive Session"
          />
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h2>❓ Частые проблемы при генерации текста</h2>

          <div className="faq-card">
            <h4>🚨 Модель бесконечно повторяет одну и ту же фразу</h4>
            <p><strong>Решение:</strong></p>
            <ul>
              <li>Увеличьте параметр <code>repetition_penalty</code> с <code>1.1</code> до <code>1.3</code>.</li>
              <li>Поднимите температуру до <code>0.45–0.5</code>.</li>
              <li>Проверьте, что в конце промпта нет двойных пробелов или зацикленных знаков препинания.</li>
            </ul>
          </div>

          <div className="faq-card">
            <h4>🚨 Текст внезапно обрывается на полуслове</h4>
            <p>
              Модель достигла максимального лимита токенов ответа (по умолчанию <code>max_new_tokens = 256</code>) 
              либо сгенерировала специальный токен <code>&lt;|endoftext|&gt;</code>. Вы можете увеличить 
              лимит длины в настройках CLI до <code>512</code> или <code>1024</code>.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="purple" />;
}
