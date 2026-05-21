import { architectureCards, corpusAuthors } from "../data/content";
import { SparkIcon } from "./Icons";

export function Architecture() {
  return (
    <>
      <section className="section-shell architecture-section" id="architecture">
        <div className="section-heading centered">
          <p className="section-kicker">Архитектура</p>
          <h2>Современные блоки LLM в понятной сборке</h2>
          <p>
            Секция показывает не список модных аббревиатур, а связанный стек: attention, эксперты,
            оптимизаторы, кэш и токенизация.
          </p>
        </div>
        <div className="architecture-grid">
          {architectureCards.map((card, index) => (
            <article className={index === 0 ? "architecture-card featured" : "architecture-card"} key={card.title}>
              <SparkIcon className="card-icon" />
              <span>{card.metric}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell corpus-section" id="corpus">
        <div className="corpus-copy">
          <p className="section-kicker">Корпус</p>
          <h2>Литературный корпус без случайного шума</h2>
          <p>
            Модель учится на очищенных текстах русской классики. Визуальная часть корпуса стала компактнее на
            мобильных экранах и сохраняет те же смысловые акценты, что старый лендинг.
          </p>
        </div>
        <div className="corpus-grid">
          {corpusAuthors.map((author) => (
            <article className={`corpus-card tone-${author.tone}`} key={author.name}>
              <div>
                <h3>{author.name}</h3>
                <span>{author.tokens}</span>
              </div>
              <p>{author.works}</p>
              <div className="progress-bar" aria-hidden="true">
                <i style={{ width: `${author.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
