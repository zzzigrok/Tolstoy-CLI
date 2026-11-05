import { Math, CodeBlock, AlertBox } from "../DocsView";
import { DocTabs } from "../DocSections";

export function DatasetTutorialDoc() {
  const tabs = [
    {
      id: "overview",
      label: "ОБЗОР",
      content: (
        <>
          <h2>📂 Туториал: Искусство подготовки обучающего корпуса</h2>
          <p>
            В мире глубокого обучения фундаментальное правило гласит: <em>"Garbage in — Garbage out"</em>. 
            Качество, связность и чистота вашего датасета определяют верхнюю планку интеллектуальных возможностей 
            нейросети. Модель, обученная на 20 МБ тщательно очищенной классической литературы и энциклопедических статей, 
            всегда превзойдет модель, в которую "залили" 1 ГБ неотфильтрованного спама из соцсетей.
          </p>

          <div className="docs-diagram-container">
            <div className="diagram-title">Пайплайн очистки и фильтрации сырого текста</div>
            <div className="transformer-layer-flow">
              <div className="flow-node input-node">Сырые источники: TXT / MD / JSON / Corus (Lenta, Taiga, Wiki)</div>
              <div className="flow-connector font-mono">↓ Декодирование и нормализация</div>
              <div className="flow-node layer-box">
                <div className="sub-node highlight-cyan">
                  Unicode NFC Normalization + Замена редких пробелов (\u00A0, \u200B)
                </div>
                <div className="flow-connector-short">↓ Очистка от шума</div>
                <div className="sub-node">
                  Удаление HTML-тегов, битых ссылок URL, системных маркеров и ASCII-арта
                </div>
                <div className="flow-connector-short">↓ Семантическая фильтрация</div>
                <div className="sub-node highlight-purple">
                  Фильтрация предложений по длине (15 &lt; len &lt; 2000 символов) + Дедупликация (SHA-256)
                </div>
              </div>
              <div className="flow-connector font-mono">↓ Векторизация</div>
              <div className="flow-node output-node">
                Чистый корпус clean_corpus.txt → BPE-токенизация → dataset_tokens.pkl
              </div>
            </div>
          </div>

          <AlertBox type="tip" title="Матрица соответствия объема датасета и архитектуры">
            <ul>
              <li><strong>Nano / Mini (5M–25M параметров):</strong> 100–500 КБ текста (хватит пары повестей или 1 тома романа). Словарь: 1024–2048.</li>
              <li><strong>Small / Chat (50M–100M параметров):</strong> 2–10 МБ текста (собрание сочинений автора). Словарь: 4096–8192.</li>
              <li><strong>Medium / Large (150M–350M параметров):</strong> 20–100 МБ текста (полный архив библиотеки Мошкова / Taiga). Словарь: 8192–16384.</li>
              <li><strong>XLarge (1B+ параметров):</strong> 500+ МБ качественного корпуса. Словарь: 32768.</li>
            </ul>
          </AlertBox>

          <h3>Категории данных и их влияние на поведение нейросети</h3>
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Тип данных</th>
                  <th>Рекомендуемые источники</th>
                  <th>Формируемый навык модели</th>
                  <th>Доля в сбалансированном корпусе</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Художественная литература</td>
                  <td>Л.Н. Толстой, Ф.М. Достоевский, А.П. Чехов</td>
                  <td>Словарный запас, метафоры, глубина стиля</td>
                  <td>40%</td>
                </tr>
                <tr>
                  <td>Энциклопедии и наука</td>
                  <td>Russian Wikipedia, Habr, Arzamas</td>
                  <td>Фактология, строгие причинно-следственные связи</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>Диалоги и переписка</td>
                  <td>Пьесы, расшифровки интервью, субтитры</td>
                  <td>Ведение связного диалога, этикет, обращения</td>
                  <td>20%</td>
                </tr>
                <tr>
                  <td>Код и алгоритмы</td>
                  <td>Python скрипты, техническая документация</td>
                  <td>Структурированное мышление, синтаксис</td>
                  <td>10%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "code",
      label: "СКРИПТ ОЧИСТКИ",
      content: (
        <>
          <h2>💻 Промышленный скрипт нормализации и дедупликации</h2>
          <p>
            Используйте следующий скрипт для подготовки ваших файлов перед подачей в <code>tolstoy_cli.py</code>.
          </p>

          <CodeBlock
            code={`import re
import unicodedata
import hashlib
from pathlib import Path

def clean_text_corpus(input_path: str, output_path: str):
    seen_hashes = set()
    cleaned_lines = []
    
    print(f"[*] Обработка корпуса: {input_path}")
    raw_text = Path(input_path).read_text(encoding="utf-8", errors="ignore")
    
    # 1. Unicode NFC нормализация (слияние раздельных диакритических знаков)
    text = unicodedata.normalize("NFC", raw_text)
    
    # 2. Удаление HTML-тегов и экранированных сущностей
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    
    # 3. Удаление веб-ссылок и email-адресов
    text = re.sub(r"https?://\\S+|www\\.\\S+", "", text)
    text = re.sub(r"\\S+@\\S+", "", text)
    
    # 4. Нормализация кавычек и длинных тире
    text = text.replace("«", '"').replace("»", '"').replace("“", '"').replace("”", '"')
    text = text.replace("—", "-").replace("–", "-")
    
    # 5. Разделение на абзацы и дедупликация
    paragraphs = text.split("\\n")
    for para in paragraphs:
        para = re.sub(r"\\s+", " ", para).strip()
        
        # Пропуск слишком коротких абзацев (шум, колонтитулы)
        if len(para) < 25:
            continue
            
        # Хэширование для исключения повторяющихся блоков текста
        para_hash = hashlib.sha256(para.encode("utf-8")).hexdigest()
        if para_hash not in seen_hashes:
            seen_hashes.add(para_hash)
            cleaned_lines.append(para)

    final_corpus = "\\n\\n".join(cleaned_lines)
    Path(output_path).write_text(final_corpus, encoding="utf-8")
    print(f"[+] Готово! Сохранено {len(cleaned_lines)} уникальных абзацев в {output_path}")

if __name__ == "__main__":
    clean_text_corpus("raw_data/war_and_peace.txt", "clean_data/tolstoy_clean.txt")`}
            language="python"
            filename="prepare_dataset.py"
          />

          <AlertBox type="note" title="Автоматический парсинг Corus">
            В Tolstoy CLI встроен модуль <code>corus</code>. Вам не требуется вручную скачивать 
            гигабайты архивов — выберите пункт <code>[1] -&gt; [3] Corus Datasets</code> в главном меню, 
            и система самостоятельно загрузит и распакует проверенные русскоязычные датасеты.
          </AlertBox>
        </>
      ),
    },
    {
      id: "checklist",
      label: "ЧЕК-ЛИСТ КАЧЕСТВА",
      content: (
        <>
          <h2>✅ Чек-лист проверки готовности датасета</h2>

          <div className="faq-card">
            <h4>1. Кодировка UTF-8 без BOM</h4>
            <p>
              Убедитесь, что все файлы сохранены в кодировке <code>UTF-8</code> (а не Windows-1251 или KOI8-R). 
              В противном случае русские буквы превратятся в "кракозябры" (моджибаке), и токенизатор будет испорчен.
            </p>
          </div>

          <div className="faq-card">
            <h4>2. Отсутствие программного мусора и логов</h4>
            <p>
              Проверьте, не попали ли в корпус логи серверов, временные метки <code>[2024-05-12 14:02:11]</code>, 
              номера строк или JSON-ключи. Если модель увидит миллион временных меток, она начнет вставлять их в каждую фразу.
            </p>
          </div>

          <div className="faq-card">
            <h4>3. Баланс диалогов и повествования</h4>
            <p>
              Если вы учите чат-бота, убедитесь, что в датасете присутствуют диалоговые маркеры: 
              тире, вопросительные знаки и обращения. Для базовой модели классического писателя идеальна 
              художественная проза с глубокими монологами.
            </p>
          </div>
        </>
      ),
    },
    {
      id: "faq",
      label: "FAQ",
      content: (
        <>
          <h2>❓ Вопросы по датасетам</h2>

          <div className="faq-card">
            <h4>🚨 Сколько эпох нужно учить модель на моем датасете?</h4>
            <p>
              Для предварительного обучения (Pre-training) идеальным считается <strong>1–3 эпохи</strong>. 
              Если прогнать один и тот же текст более 5–10 раз, модель неизбежно переобучится (overfit) 
              и начнет цитировать книги слово в слово, потеряв способность генерировать новые мысли.
            </p>
          </div>

          <div className="faq-card">
            <h4>🚨 Можно ли смешивать русский и английский языки?</h4>
            <p>
              Да, TolstoyLLM поддерживает мультиязычность. Добавление 10–15% качественных англоязычных текстов 
              (статьи по программированию, научные абстракты) часто даже улучшает логические способности русскоязычной модели.
            </p>
          </div>
        </>
      ),
    },
  ];

  return <DocTabs tabs={tabs} accent="cyan" />;
}
