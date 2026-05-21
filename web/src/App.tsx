import { useState } from "react";
import { Architecture } from "./components/Sections";
import { ArrowIcon, BookIcon, GitHubIcon } from "./components/Icons";
import { HeroGraphic } from "./components/HeroGraphic";
import { navItems } from "./data/content";
import "./styles.css";

const githubUrl = "https://github.com/zzzigrok/Tolstoy-CLI";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <Header menuOpen={menuOpen} onToggle={() => setMenuOpen((value) => !value)} onNavigate={closeMenu} />
      <main>
        <section className="hero section-shell" id="top">
          <div className="hero-copy">
            <p className="hero-label">Образовательная лаборатория LLM</p>
            <h1>
              Открывая
              <span>черный ящик</span>
              нейросетей
            </h1>
            <p className="hero-text">
              Tolstoy-CLI помогает создавать, обучать и понимать русскоязычные языковые модели с нуля:
              от токенизации и корпуса до attention, оптимизаторов и инференса.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#about">
                Погрузиться
                <ArrowIcon className="button-icon" />
              </a>
              <a className="button button-secondary" href="#architecture">
                Документация
              </a>
            </div>
          </div>
          <HeroGraphic />
        </section>

        <About />
        <Developer />
        <Philosophy />
        <Architecture />
      </main>
      <Footer />
    </>
  );
}

type HeaderProps = {
  menuOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
};

function Header({ menuOpen, onToggle, onNavigate }: HeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" onClick={onNavigate} aria-label="Tolstoy-CLI, наверх">
        <BookIcon className="brand-icon" />
        <span>
          Tolstoy<span>-CLI</span>
        </span>
      </a>

      <nav className="desktop-nav" aria-label="Основная навигация">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <a className="github-link desktop-github" href={githubUrl} target="_blank" rel="noopener noreferrer">
        <GitHubIcon className="github-icon" />
        GitHub
      </a>

      <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={onToggle}>
        <span />
        <span />
        <span />
      </button>

      <nav id="mobile-nav" className={menuOpen ? "mobile-nav open" : "mobile-nav"} aria-label="Мобильная навигация">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={onNavigate}>
            {item.label}
          </a>
        ))}
        <a href={githubUrl} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
          GitHub
        </a>
      </nav>
    </header>
  );
}

function About() {
  return (
    <section className="section-shell about-section" id="about">
      <div className="section-heading">
        <p className="section-kicker">О проекте</p>
        <h2>Архитектурная лаборатория для русского NLP</h2>
      </div>
      <div className="about-grid">
        <article className="text-panel">
          <p>
            Tolstoy-CLI — это практический набор инструментов для обучения LLM на локальном железе. Проект
            соединяет образовательный формат, PyTorch-реализацию и корпус русской классической литературы.
          </p>
          <p>
            Лендинг теперь собран как React-приложение: секции разнесены на компоненты, данные вынесены из
            разметки, а визуальная система больше не зависит от Tailwind CDN.
          </p>
        </article>
        <div className="stat-grid" aria-label="Ключевые особенности">
          <Stat value="1B+" label="масштаб моделей на одной мощной GPU" />
          <Stat value="v7" label="GaLore, Muon, MoE, XQuant и GQA" />
          <Stat value="100+" label="текстов в литературном корпусе" />
          <Stat value="MIT" label="открытая лицензия и GitHub workflow" />
        </div>
      </div>
    </section>
  );
}

function Developer() {
  return (
    <section className="section-shell developer-section" id="developer">
      <div className="developer-card">
        <div className="avatar" aria-hidden="true">
          <BookIcon className="avatar-book" />
        </div>
        <div>
          <p className="section-kicker">Разработчик</p>
          <h2>Проект собран как инженерный учебник</h2>
          <p>
            Фокус не на черной магии генерации, а на ясной сборке: какие блоки входят в модель, где тратится
            память, как меняется качество и какие оптимизации имеют смысл в домашней лаборатории.
          </p>
          <a className="button button-secondary" href="https://github.com/zzzigrok" target="_blank" rel="noopener noreferrer">
            Профиль GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function Philosophy() {
  return (
    <section className="section-shell philosophy-section" id="philosophy">
      <div className="quote-panel">
        <p className="quote">То, что я не могу создать, я не понимаю.</p>
        <p className="quote-author">Ричард Фейнман</p>
      </div>
      <div className="philosophy-list">
        {[
          "Понимать архитектуру, а не только запускать готовые веса.",
          "Собирать корпус осознанно: русский язык, литература, чистые данные.",
          "Делать инструменты, которые можно разобрать, изменить и обучить заново."
        ].map((item) => (
          <article className="philosophy-item" key={item}>
            <span />
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <a className="brand" href="#top" aria-label="Tolstoy-CLI, наверх">
        <BookIcon className="brand-icon" />
        <span>
          Tolstoy<span>-CLI</span>
        </span>
      </a>
      <p>Образовательный фреймворк для изучения языковых моделей. MIT License, 2026.</p>
      <a href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Открыть Tolstoy-CLI на GitHub">
        <GitHubIcon className="github-icon" />
      </a>
    </footer>
  );
}
