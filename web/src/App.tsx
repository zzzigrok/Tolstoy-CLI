import { useState, useEffect } from "react";
import { Architecture, Corpus } from "./components/Sections";
import { BookIcon, GitHubIcon } from "./components/Icons";
import { HeroGraphic } from "./components/HeroGraphic";
import { DocsView } from "./components/DocsView";
import { navItems, statItems, philosophyPoints } from "./data/content";
import "./styles.css";

const githubUrl = "https://github.com/zzzigrok/Tolstoy-CLI";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const [currentPage, setCurrentPage] = useState<'landing' | 'docs'>(() => {
    if (window.location.hash === "#docs") {
      return "docs";
    }
    return "landing";
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#docs") {
        setCurrentPage("docs");
        window.scrollTo(0, 0);
      } else if (window.location.hash === "" || window.location.hash === "#top") {
        setCurrentPage("landing");
        window.scrollTo(0, 0);
      } else if (
        window.location.hash.startsWith("#about") ||
        window.location.hash.startsWith("#developer") ||
        window.location.hash.startsWith("#philosophy") ||
        window.location.hash.startsWith("#architecture") ||
        window.location.hash.startsWith("#corpus")
      ) {
        setCurrentPage("landing");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (currentPage === "docs") {
    return (
      <>
        <Header menuOpen={menuOpen} onToggle={() => setMenuOpen((value) => !value)} onNavigate={closeMenu} />
        <DocsView onBack={() => { window.location.hash = "#top"; }} />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header menuOpen={menuOpen} onToggle={() => setMenuOpen((value) => !value)} onNavigate={closeMenu} />
      <main>
        <section className="hero section-shell" id="top">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Образовательный Фреймворк
            </div>
            <h1 className="hero-title pb-2">
              <span className="animated-gradient-text">Открывая</span> <br />
              <span className="hero-italic">черный ящик</span> <br />
              <span className="animated-gradient-text">нейросетей</span>
            </h1>
            <p className="hero-text">
              Tolstoy-CLI — это архитектурная лаборатория. Создавайте, обучайте и понимайте механизмы работы Больших Языковых Моделей (LLM) с нуля. Синтез глубокого машинного обучения и богатства классической литературы.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#about">
                Погрузиться
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
        <Corpus />
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
    <header className="site-header fixed-nav">
      <div className="nav-container">
        <a className="brand" href="#top" onClick={onNavigate} aria-label="Tolstoy-CLI, наверх">
          <svg className="brand-logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Tolstoy<span className="brand-suffix">-CLI</span></span>
        </a>

        <nav className="desktop-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
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
      </div>
    </header>
  );
}

function About() {
  return (
    <section className="section-shell about-section-new" id="about">
      <div className="glass-card about-card">
        <svg className="about-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <h2>Образовательная лаборатория LLM</h2>
        <p className="about-description">
          Tolstoy-CLI не является очередным "черным ящиком" для генерации текста. Это полнофункциональная, 
          но понятная архитектура, созданная для того, чтобы показать внутреннее устройство современных трансформеров. 
          От BPE токенизации до механизма внимания и Speculative Decoding — каждая строчка кода написана для изучения и модификации.
        </p>
        <div className="about-stats-grid">
          {statItems.map((stat) => (
            <div key={stat.label} className="about-stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Developer() {
  return (
    <section className="section-shell developer-section-new" id="developer">
      {/* Abstract background math/code elements */}
      <div className="dev-math-background">
        {/* Original static blurs */}
        <div className="dev-bg-blur-1"></div>
        <div className="dev-bg-blur-2"></div>
      </div>

      <div className="developer-header-box">
        <div className="dev-kicker-badge">
          <svg className="kicker-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Создатель
        </div>
        <h2>Об авторе проекта</h2>
        <div className="dev-divider"></div>
      </div>

      <div className="dev-terminal-card max-w-5xl mx-auto relative">
        <div className="dev-outer-border"></div>
        <div className="terminal-content">
          <div className="terminal-header">
            <div className="terminal-controls">
              <span className="control-btn red"></span>
              <span className="control-btn yellow"></span>
              <span className="control-btn green"></span>
            </div>
            <div className="text-[11px] font-mono text-gray-500 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              zzzigrok@tolstoy-lab: ~
            </div>
            <div className="w-10"></div>
          </div>
          <div className="terminal-body-grid">
            {/* Left: Avatar SVG with typing hands */}
            <div className="terminal-avatar-wrapper">
              <div className="avatar-background-glow"></div>
              <div className="avatar-svg-container group/avatar">
                {/* Highly Detailed Cyber Avatar SVG */}
                <svg className="typing-hands-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background floating data streams (Visible on hover) */}
                  <g className="opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500 text-cyan-500/50" fontFamily="monospace" fontSize="6px" fontWeight="bold">
                    <text x="8" y="25">01</text>
                    <text x="8" y="35">10</text>
                    <text x="82" y="30">11</text>
                    <text x="82" y="40">00</text>
                    {/* Rising data nodes */}
                    <circle cx="12" cy="50" r="1" fill="#06b6d4">
                      <animate attributeName="cy" values="60;10" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="85" cy="60" r="1" fill="#c084fc">
                      <animate attributeName="cy" values="70;20" dur="2.5s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite"/>
                    </circle>
                  </g>

                  {/* Companion Drone / Eye */}
                  <g className="transform group-hover/avatar:translate-x-1 group-hover/avatar:-translate-y-2 transition-transform duration-700">
                    <circle cx="16" cy="28" r="5" fill="#0f172a" stroke="#475569" strokeWidth={1.5}/>
                    <circle cx="16" cy="28" r="2" fill="#06b6d4" className="animate-pulse"/>
                    <path d="M 11 28 A 5 5 0 0 1 21 28" fill="none" stroke="#06b6d4" strokeWidth={1} strokeDasharray="2 2" className="animate-spin-reverse" style={{ transformOrigin: "16px 28px" }}/>
                    {/* Scanner beam */}
                    <polygon points="16,33 10,50 22,50" fill="#06b6d4" fillOpacity={0.1} className="opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"/>
                  </g>

                  {/* Cabling from head to back */}
                  <path d="M 69 35 Q 85 40 85 65" fill="none" stroke="#1e293b" strokeWidth={2.5}/>
                  <path d="M 69 38 Q 80 43 80 65" fill="none" stroke="#06b6d4" strokeWidth={1} strokeDasharray="2 2" className="animate-dash-flow"/>
                  <path d="M 31 35 Q 15 40 15 65" fill="none" stroke="#1e293b" strokeWidth={2.5}/>

                  {/* Body / Hoodie */}
                  <path d="M 10 100 L 15 80 C 15 60, 30 55, 50 55 C 70 55, 85 60, 85 80 L 90 100 Z" fill="#0f172a" stroke="#334155" strokeWidth={1.5}/>
                  <path d="M 32 55 C 32 70, 68 70, 68 55" fill="#020617" stroke="#1e293b" strokeWidth={1}/>
                  <path d="M 40 65 L 40 82 M 60 65 L 60 80" stroke="#334155" strokeWidth={1.5} strokeDasharray="2 2" strokeLinecap="round"/>
                  
                  {/* Cyber circuitry pattern on chest */}
                  <path d="M 45 75 L 50 82 L 55 75 L 55 70 L 45 70 Z" fill="#7e22ce" stroke="#c084fc" strokeWidth={0.5} className="group-hover/avatar:fill-cyan-400 group-hover/avatar:stroke-cyan-200 transition-colors duration-500"/>
                  <path d="M 50 82 L 50 95" stroke="#7e22ce" strokeWidth={1} className="group-hover/avatar:stroke-cyan-400 transition-colors duration-500"/>
                  <line x1="45" y1="75" x2="35" y2="75" stroke="#7e22ce" strokeWidth={1} strokeDasharray="1 1" className="group-hover/avatar:stroke-cyan-400"/>
                  <line x1="55" y1="75" x2="65" y2="75" stroke="#7e22ce" strokeWidth={1} strokeDasharray="1 1" className="group-hover/avatar:stroke-cyan-400"/>
                  
                  {/* Shoulders / Cyber implants */}
                  <path d="M 15 75 L 25 75 L 25 80 L 15 80 Z" fill="#1e293b" stroke="#475569" strokeWidth={1}/>
                  <path d="M 85 75 L 75 75 L 75 80 L 85 80 Z" fill="#1e293b" stroke="#475569" strokeWidth={1}/>

                  {/* Neck and Head Base */}
                  <path d="M 42 55 L 42 43 L 58 43 L 58 55 Z" fill="#475569"/>
                  <line x1="42" y1="46" x2="58" y2="46" stroke="#1e293b" strokeWidth={1}/>
                  <line x1="42" y1="50" x2="58" y2="50" stroke="#1e293b" strokeWidth={1}/>
                  <path d="M 33 25 C 33 8, 67 8, 67 25 L 67 40 C 67 52, 33 52, 33 40 Z" fill="#cbd5e1" className="group-hover/avatar:fill-white transition-colors duration-500"/>
                  <path d="M 33 35 C 40 46, 60 46, 67 35 L 67 40 C 60 52, 40 52, 33 40 Z" fill="#94a3b8"/>
                  
                  {/* Cybernetic Hair / Implants */}
                  <path d="M 33 25 C 33 8, 67 8, 67 25 C 60 20, 40 20, 33 25 Z" fill="#1e293b"/>
                  <line x1="42" y1="14" x2="58" y2="14" stroke="#06b6d4" strokeWidth={1.5} className="animate-pulse"/>
                  <line x1="46" y1="18" x2="54" y2="18" stroke="#c084fc" strokeWidth={1} className="animate-pulse" style={{ animationDelay: "0.5s" }}/>

                  {/* Heavy Cyber Headphones */}
                  <path d="M 27 35 Q 27 6, 50 6 Q 73 6, 73 35" stroke="#1e293b" strokeWidth={6} strokeLinecap="round" fill="none"/>
                  <path d="M 31 35 Q 31 10, 50 10 Q 69 10, 69 35" stroke="#0f172a" strokeWidth={2} strokeLinecap="round" fill="none"/>
                  <rect x="23" y="24" width="8" height="24" rx="4" fill="#0f172a" stroke="#475569" strokeWidth={1.5}/>
                  <rect x="69" y="24" width="8" height="24" rx="4" fill="#0f172a" stroke="#475569" strokeWidth={1.5}/>
                  <circle cx="27" cy="36" r="2.5" fill="#06b6d4" className="animate-pulse"/>
                  <circle cx="73" cy="36" r="2.5" fill="#06b6d4" className="animate-pulse"/>
                  <rect x="25" y="28" width="4" height="2" fill="#c084fc"/>
                  <rect x="71" y="28" width="4" height="2" fill="#c084fc"/>
                  <path d="M 29 45 Q 35 55 42 53" fill="none" stroke="#475569" strokeWidth={2} strokeLinecap="round"/>
                  <circle cx="43" cy="52" r="1.5" fill="#06b6d4" className="animate-pulse"/>

                  {/* High-Tech VR Visor (Enhanced) */}
                  <path d="M 30 26 C 40 30, 60 30, 70 26 L 73 38 C 60 44, 40 44, 27 38 Z" fill="#020617" stroke="#c084fc" strokeWidth={1.5} className="group-hover/avatar:stroke-cyan-300 transition-colors duration-500"/>
                  <path d="M 32 29 C 45 32, 55 32, 68 29 L 71 36 C 55 40, 45 40, 29 36 Z" fill="#c084fc" fillOpacity={0.2} className="group-hover/avatar:fill-opacity-0.4 transition-all duration-500"/>
                  <line x1="38" y1="34" x2="44" y2="34" stroke="#06b6d4" strokeWidth={1.5} className="animate-pulse"/>
                  <line x1="56" y1="34" x2="62" y2="34" stroke="#06b6d4" strokeWidth={1.5} className="animate-pulse"/>
                  <circle cx="50" cy="33" r="1.5" fill="#ec4899"/>
                  {/* Scanning laser */}
                  <line x1="28" y1="33" x2="72" y2="33" stroke="#06b6d4" strokeWidth={0.5} className="animate-pulse opacity-50"/>
                  {/* Glass reflections */}
                  <path d="M 34 30 L 40 36 M 58 30 L 64 36" stroke="#ffffff" strokeWidth={1} strokeOpacity={0.4} strokeLinecap="round"/>

                  {/* Floating HUDs (Visible on hover) */}
                  <g className="opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700">
                    {/* Left HUD */}
                    <rect x="8" y="15" width="20" height="14" rx="1" fill="#06b6d4" fillOpacity={0.1} stroke="#06b6d4" strokeWidth={0.5}/>
                    <line x1="10" y1="18" x2="25" y2="18" stroke="#06b6d4" strokeWidth={0.5}/>
                    <line x1="10" y1="22" x2="20" y2="22" stroke="#06b6d4" strokeWidth={0.5}/>
                    <line x1="10" y1="26" x2="25" y2="26" stroke="#06b6d4" strokeWidth={0.5}/>
                    <path d="M 28 22 L 32 30" stroke="#06b6d4" strokeWidth={0.5} strokeDasharray="1 1"/>
                    
                    {/* Right HUD */}
                    <rect x="72" y="10" width="20" height="18" rx="1" fill="#c084fc" fillOpacity={0.1} stroke="#c084fc" strokeWidth={0.5}/>
                    <circle cx="82" cy="19" r="4" fill="none" stroke="#c084fc" strokeWidth={0.5} strokeDasharray="1 1" className="animate-spin-reverse" style={{ animationDuration: "4s" }}/>
                    <circle cx="82" cy="19" r="2" fill="#c084fc" fillOpacity={0.5}/>
                    <path d="M 72 20 L 68 30" stroke="#c084fc" strokeWidth={0.5} strokeDasharray="1 1"/>
                  </g>

                  {/* Holographic Keyboard Desk (Multi-Layered) */}
                  <polygon points="5,105 95,105 80,75 20,75" fill="#06b6d4" fillOpacity={0.03} stroke="#06b6d4" strokeWidth={0.5}/>
                  <polygon points="10,95 90,95 75,70 25,70" fill="#06b6d4" fillOpacity={0.1} stroke="#06b6d4" strokeWidth={1.5} className="group-hover/avatar:fill-opacity-0.2 transition-all duration-500"/>
                  <polygon points="15,90 85,90 70,68 30,68" fill="#c084fc" fillOpacity={0.05} stroke="#c084fc" strokeWidth={0.5} className="group-hover/avatar:fill-opacity-0.15 transition-all duration-500"/>
                  
                  {/* Grid Lines */}
                  <line x1="28" y1="80" x2="72" y2="80" stroke="#06b6d4" strokeWidth={0.5} opacity={0.5}/>
                  <line x1="22" y1="88" x2="78" y2="88" stroke="#06b6d4" strokeWidth={0.5} opacity={0.5}/>
                  <line x1="40" y1="70" x2="32" y2="95" stroke="#06b6d4" strokeWidth={0.5} opacity={0.5}/>
                  <line x1="60" y1="70" x2="68" y2="95" stroke="#06b6d4" strokeWidth={0.5} opacity={0.5}/>

                  {/* Animated typing hands & arms */}
                  <path d="M 16 78 Q 28 72 32 85" fill="none" stroke="#1e293b" strokeWidth={8} strokeLinecap="round"/>
                  <path d="M 84 78 Q 72 72 68 85" fill="none" stroke="#1e293b" strokeWidth={8} strokeLinecap="round"/>
                  {/* Cyber Cuffs */}
                  <line x1="28" y1="80" x2="36" y2="82" stroke="#06b6d4" strokeWidth={2.5} strokeLinecap="round"/>
                  <line x1="72" y1="80" x2="64" y2="82" stroke="#06b6d4" strokeWidth={2.5} strokeLinecap="round"/>
                  <line x1="30" y1="78" x2="35" y2="79" stroke="#c084fc" strokeWidth={1} strokeLinecap="round"/>
                  <line x1="70" y1="78" x2="65" y2="79" stroke="#c084fc" strokeWidth={1} strokeLinecap="round"/>

                  {/* Left Hand Fingers */}
                  <path d="M 32 85 L 36 88 M 30 86 L 33 90 M 28 87 L 30 91" stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round"/>
                  {/* Right Hand Fingers */}
                  <path d="M 68 85 L 64 88 M 70 86 L 67 90 M 72 87 L 70 91" stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round"/>
                  
                  {/* Glowing Fingertips tapping keys */}
                  <circle cx="36" cy="88" r="1.5" fill="#06b6d4" className="animate-pulse"/>
                  <circle cx="33" cy="90" r="1.5" fill="#06b6d4" className="animate-pulse" style={{ animationDelay: "0.1s" }}/>
                  <circle cx="64" cy="88" r="1.5" fill="#06b6d4" className="animate-pulse" style={{ animationDelay: "0.2s" }}/>
                  <circle cx="67" cy="90" r="1.5" fill="#06b6d4" className="animate-pulse" style={{ animationDelay: "0.3s" }}/>

                  {/* Individual Glowing Keys on Keyboard */}
                  <rect x="42" y="85" width="16" height="4" rx="1" fill="#06b6d4" fillOpacity={0.8} className="animate-pulse"/>
                  <rect x="30" y="82" width="8" height="3" rx="0.5" fill="#c084fc" fillOpacity="0.8" className="animate-pulse" style={{ animationDelay: "0.2s" }}/>
                  <rect x="62" y="82" width="8" height="3" rx="0.5" fill="#c084fc" fillOpacity="0.8" className="animate-pulse" style={{ animationDelay: "0.5s" }}/>
                  <rect x="36" y="91" width="6" height="4" rx="1" fill="#f472b6" fillOpacity="0.9"/>
                  <rect x="58" y="91" width="6" height="4" rx="1" fill="#f472b6" fillOpacity="0.9"/>
                  
                  {/* Emitting Holographic Data Rings from Keyboard */}
                  <ellipse cx="50" cy="85" rx="35" ry="10" fill="none" stroke="#c084fc" strokeWidth="0.5" strokeDasharray="4 4" className="animate-ping opacity-0 group-hover/avatar:opacity-100" style={{ animationDuration: "3s" }}/>
                  <ellipse cx="50" cy="70" rx="50" ry="15" fill="none" stroke="#06b6d4" strokeWidth="0.5" strokeOpacity="0.4" className="animate-ping opacity-0 group-hover/avatar:opacity-100" style={{ animationDelay: "1.5s", animationDuration: "3s" }}/>
                </svg>
                <div className="terminal-scanline"></div>
              </div>
            </div>

            {/* Right: Console Output */}
            <div className="terminal-console-output font-mono">
              <div className="console-line">
                <span className="prompt-arrow">➜</span> <span className="prompt-tilde">~</span> <span className="prompt-cmd">whoami</span>
              </div>
              <div className="console-response whoami-name">
                zzzigrok
              </div>
              
              <div className="console-line pt-2">
                <span className="prompt-arrow">➜</span> <span className="prompt-tilde">~</span> <span className="prompt-cmd">cat</span> profile.md
              </div>
              <div className="console-response profile-text">
                <p>Разработчик, исследователь в области Machine Learning и создатель архитектуры <span className="text-cyan-glow">Tolstoy-CLI</span>.</p>
                <p>Моя цель — разрушить барьер непонимания вокруг Больших Языковых Моделей (LLM). Этот проект был написан с нуля, чтобы показать, что ИИ — это не магия корпораций, а элегантная математика, доступная каждому.</p>
                <p className="profile-quote">"Код должен читаться как хорошая литература. Именно поэтому мы тренируем сеть на Толстом."</p>
              </div>

              {/* Links */}
              <div className="console-links pt-4">
                <a href="https://github.com/zzzigrok" target="_blank" rel="noopener noreferrer" className="terminal-btn-link">
                  <GitHubIcon className="github-icon" />
                  <span>GitHub Profile</span>
                </a>
                <div className="terminal-status-badge">
                  <span className="status-dot">●</span>Status: Coding
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Philosophy() {
  return (
    <section className="section-shell philosophy-section-new" id="philosophy">
      <div className="philosophy-glow-orbs">
        <div className="phil-orb-1"></div>
        <div className="phil-orb-2"></div>
      </div>

      <div className="philosophy-grid relative">
        <div className="philosophy-left-col">
          <div className="philosophy-title-box">
            <h2>Философия проекта</h2>
            <div className="phil-title-divider"></div>
            <p className="philosophy-lead">
              Современный ИИ часто воспринимается как волшебство, доступное только мегакорпорациям. Наша цель — <strong>демократизация понимания</strong>.
            </p>
          </div>

          <div className="philosophy-cards-stack">
            {philosophyPoints.map((point, index) => (
              <div key={point.title} className={`glass-card phil-feature-card group ${index === 0 ? "purple" : "cyan"}`}>
                <div className={`phil-icon-box ${index === 0 ? "purple" : "cyan"}`}>
                  <svg className="phil-card-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {index === 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    )}
                  </svg>
                </div>
                <div className="phil-card-content">
                  <h4>{point.title}</h4>
                  <p>{point.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Feynman Quote */}
        <div className="philosophy-right-col">
          <div className="phil-quote-bg-glow"></div>
          <div className="glass-card phil-quote-card hover:-translate-y-2">
            <div className="inspiration-badge">
              <span className="inspiration-dot"></span>
              Inspiration
            </div>

            <svg className="phil-quote-marks-svg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            
            <div className="phil-quote-content">
              <p className="feynman-quote-text animated-gradient-text italic">
                То, что я не могу создать, я не понимаю.
              </p>
              <p className="feynman-quote-english font-mono">
                // What I cannot create, I do not understand.
              </p>
            </div>
            
            <div className="feynman-author-box">
              <div className="feynman-author-meta">
                <div className="feynman-avatar-wrapper group">
                  <div className="feynman-avatar-glow"></div>
                  <svg className="feynman-avatar-spinner" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4"></circle>
                    <circle cx="50" cy="2" r="2" fill="#06b6d4"></circle>
                  </svg>
                  <div className="feynman-img-container">
                    <img src="https://upload.wikimedia.org/wikipedia/en/4/42/Richard_Feynman_Nobel.jpg" alt="Ричард Фейнман" className="feynman-avatar-img" />
                  </div>
                </div>
                <div className="feynman-author-info">
                  <h4>Ричард Фейнман</h4>
                  <p>Нобелевский лауреат по физике</p>
                </div>
              </div>
              
              {/* Detailed physicist SVG */}
              <div className="physicist-svg-container group/physicist">
                <div className="physicist-glow-effect"></div>
                <svg className="physicist-svg" viewBox="0 0 100 100" fill="none">
                  <g className="physicist-symbols" fill="#22d3ee" fontFamily="serif" fontWeight="bold" fontSize="12px">
                    <text x="6" y="30">
                      ∑
                      <animate attributeName="y" values="30; 25; 30" dur="2s" repeatCount="indefinite" />
                    </text>
                    <text x="82" y="25">
                      ∫
                      <animate attributeName="y" values="25; 20; 25" dur="2.5s" repeatCount="indefinite" />
                    </text>
                    <text x="75" y="65" opacity="0.8">
                      ψ
                      <animate attributeName="opacity" values="0.3; 1; 0.3" dur="2s" repeatCount="indefinite" />
                    </text>
                    <text x="10" y="60" opacity="0.8">
                      π
                      <animate attributeName="opacity" values="0.3; 1; 0.3" dur="3s" repeatCount="indefinite" />
                    </text>
                  </g>

                  <rect x="32" y="22" width="36" height="40" rx="14" fill="#cbd5e1" className="physicist-face" />
                  <circle cx="30" cy="42" r="4" fill="#94a3b8" />
                  <circle cx="70" cy="42" r="4" fill="#94a3b8" />

                  <path d="M 28 35 Q 35 12 50 12 Q 65 12 72 35 Q 65 6 50 6 Q 35 6 28 35 Z" fill="#475569" />
                  <path d="M 32 25 Q 40 2 55 12" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 68 25 Q 60 2 45 12" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 50 12 Q 55 0 65 15" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />

                  <rect x="34" y="36" width="14" height="10" rx="2" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" className="physicist-specs" />
                  <rect x="52" y="36" width="14" height="10" rx="2" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" className="physicist-specs" />
                  <line x1="48" y1="41" x2="52" y2="41" stroke="#06b6d4" strokeWidth="1.5" className="physicist-specs" />

                  <rect x="35" y="37" width="12" height="8" rx="1" fill="#06b6d4" fillOpacity="0.1" className="physicist-lens" />
                  <rect x="53" y="37" width="12" height="8" rx="1" fill="#06b6d4" fillOpacity="0.1" className="physicist-lens" />

                  <circle cx="43" cy="41" r="1.5" fill="#fff" className="physicist-glare" />
                  <circle cx="61" cy="41" r="1.5" fill="#fff" className="physicist-glare" />
                  
                  <path d="M 42 53 Q 50 58 58 53" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                  <path d="M 22 95 L 22 75 Q 50 60 78 75 L 78 95" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                  <polygon points="42,65 58,65 50,88" fill="#f8fafc" />
                  <polygon points="48,65 52,65 54,85 50,92 46,85" fill="#7e22ce" className="physicist-tie" />

                  <path d="M 42 65 L 32 88 L 42 95 M 58 65 L 68 88 L 58 95" stroke="#334155" strokeWidth="1.5" fill="none" />
                  
                  <line x1="62" y1="80" x2="72" y2="80" stroke="#334155" strokeWidth="1.5" />
                  <line x1="64" y1="74" x2="64" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="68" y1="72" x2="68" y2="80" stroke="#06b6d4" strokeWidth="1.5" className="physicist-pen" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="phil-deco-circle-1"></div>
          <div className="phil-deco-circle-2"></div>
          <div className="phil-deco-circle-3"></div>
          <svg className="phil-deco-plus" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 2v20m10-10H2" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <a className="brand" href="#top" aria-label="Tolstoy-CLI, наверх">
          <svg className="brand-logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Tolstoy<span>-CLI</span></span>
        </a>
        <p>
          Образовательный фреймворк для изучения языковых моделей.<br />
          &copy; 2026 Проект Tolstoy-CLI. Все права защищены (MIT License).
        </p>
        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="footer-github-icon" aria-label="Открыть Tolstoy-CLI на GitHub">
          <GitHubIcon className="github-icon" />
        </a>
      </div>
    </footer>
  );
}
