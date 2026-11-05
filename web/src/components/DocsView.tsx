import { useState, useEffect, useRef, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { 
  ArchitectureDoc, 
  CliGuideDoc, 
  TrainingDoc, 
  TokenizerDoc, 
  RoPEYaRNDoc, 
  MoEDoc, 
  OptimizersDoc, 
  SpeculativeDoc, 
  DatasetTutorialDoc, 
  TokenizationTutorialDoc, 
  TrainingTutorialDoc, 
  InteractionTutorialDoc 
} from "./DocSections";

// KaTeX dynamic math renderer component
export function Math({ formula, block = false }: { formula: string; block?: boolean }) {
  const renderedHtml = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: block,
        throwOnError: false
      });
    } catch (err) {
      console.error("KaTeX renderToString error:", err);
      return "";
    }
  }, [formula, block]);

  if (block) {
    return (
      <div className="katex-block-wrapper">
        <div 
          className="katex-block-container"
          dangerouslySetInnerHTML={{ __html: renderedHtml || formula }}
        />
      </div>
    );
  }
  return (
    <span 
      className="katex-inline-container" 
      dangerouslySetInnerHTML={{ __html: renderedHtml || formula }}
    />
  );
}

// Helper components for rich rendering
export function CodeBlock({ code, language, filename }: { code: string; language: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="docs-code-container docs-code-v2">
      <div className="docs-code-header docs-code-header-v2">
        <div className="docs-window-dots">
          <span className="window-dot dot-red" />
          <span className="window-dot dot-yellow" />
          <span className="window-dot dot-green" />
        </div>
        <div className="docs-code-header-meta">
          {filename && <span className="docs-code-filename font-mono">{filename}</span>}
          <span className="docs-code-lang">{language}</span>
        </div>
        <button onClick={handleCopy} className={`docs-copy-btn ${copied ? "copied" : ""}`} aria-label="Скопировать код">
          {copied ? (
            <>
              <svg className="copy-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Скопировано!</span>
            </>
          ) : (
            <>
              <svg className="copy-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>
      <pre className="docs-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function AlertBox({ type, title, children }: { type: "info" | "tip" | "warning" | "note"; title: string; children: React.ReactNode }) {
  const icon = {
    info: (
      <svg className="docs-alert-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    note: (
      <svg className="docs-alert-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    tip: (
      <svg className="docs-alert-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    warning: (
      <svg className="docs-alert-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }[type];

  return (
    <div className={`docs-alert docs-alert-v2 docs-alert-${type}`}>
      <div className="docs-alert-header">
        <div className="docs-alert-icon-wrap">{icon}</div>
        <span className="docs-alert-title">{title}</span>
      </div>
      <div className="docs-alert-content">{children}</div>
    </div>
  );
}

export const DOCS_MENU = [
  { 
    category: "ОСНОВНОЕ",
    badgeTone: "cyan",
    items: [
      { id: "architecture", label: "🏗️ Архитектура модели", desc: "Топология декодера TolstoyLLM_v7 Pro", readTime: "12 мин" },
      { id: "cli_guide", label: "🗺️ Руководство CLI", desc: "Мануал по управлению через консоль", readTime: "10 мин" },
      { id: "training", label: "🔬 Обучение и оптимизация", desc: "Тренер, BFloat16 и асинхронные стримы", readTime: "14 мин" },
      { id: "tokenizer", label: "🧠 BPE Токенизатор", desc: "Детали алгоритма BPETokenizer v10 Rust", readTime: "12 мин" },
    ]
  },
  {
    category: "ТЕХНИЧЕСКИЕ РАЗБОРЫ",
    badgeTone: "purple",
    items: [
      { id: "rope_yarn", label: "🌀 RoPE & YaRN", desc: "Ротационные эмбеддинги и экстраполяция", readTime: "11 мин" },
      { id: "moe_swiglu", label: "🧩 Sparse MoE", desc: "Смесь экспертов и Fused SwiGLU", readTime: "13 мин" },
      { id: "optimizers", label: "🚀 GaLore & Muon", desc: "Низкоранговые и ортогональные оптимизаторы", readTime: "15 мин" },
      { id: "speculative", label: "🐣 Speculative Decoding", desc: "Ускорение через Multi-Token Prediction", readTime: "9 мин" },
    ]
  },
  {
    category: "ТУТОРИАЛЫ",
    badgeTone: "pink",
    items: [
      { id: "dataset_guide", label: "📂 Создание датасета", desc: "Стратегии сбора и очистки данных", readTime: "10 мин" },
      { id: "tokenization_tutorial", label: "✂️ Гид по токенизации", desc: "Практикум BPE и инспекция субслов", readTime: "9 мин" },
      { id: "training_guide_doc", label: "🏋️ Мастер-класс обучения", desc: "Тюнинг параметров и мониторинг лосса", readTime: "14 мин" },
      { id: "interaction_tutorial", label: "💬 Секреты общения", desc: "Инференс, сэмплирование и промптинг", readTime: "8 мин" },
    ]
  }
];

export function DocsView({ onBack }: { onBack: () => void }) {
  const [activeDoc, setActiveDoc] = useState<string>(() => {
    const hash = window.location.hash;
    const match = hash.match(/#docs\/([a-z0-9_-]+)/i);
    return match ? match[1] : "architecture";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync hash with activeDoc
  useEffect(() => {
    window.location.hash = `#docs/${activeDoc}`;
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [activeDoc]);

  // Find active article and category info
  const activeMeta = useMemo(() => {
    for (const group of DOCS_MENU) {
      const found = group.items.find((item) => item.id === activeDoc);
      if (found) {
        return {
          category: group.category,
          tone: group.badgeTone,
          item: found
        };
      }
    }
    return {
      category: DOCS_MENU[0].category,
      tone: DOCS_MENU[0].badgeTone,
      item: DOCS_MENU[0].items[0]
    };
  }, [activeDoc]);

  // Filter menu items by search query
  const filteredMenu = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return DOCS_MENU;

    return DOCS_MENU.map((group) => {
      const filteredItems = group.items.filter((item) => 
        item.label.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
      return {
        ...group,
        items: filteredItems
      };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  const totalResultsCount = useMemo(() => {
    return filteredMenu.reduce((sum, g) => sum + g.items.length, 0);
  }, [filteredMenu]);

  const handleCopyDocLink = () => {
    const fullUrl = `${window.location.origin}${window.location.pathname}#docs/${activeDoc}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSelectArticle = (id: string) => {
    setActiveDoc(id);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="docs-page-wrapper docs-page-v2">
      {/* Background ambient lighting */}
      <div className="docs-bg-glow" aria-hidden="true">
        <div className="docs-glow-1"></div>
        <div className="docs-glow-2"></div>
        <div className="docs-glow-3"></div>
      </div>

      {/* Top Header & Breadcrumbs Bar */}
      <div className="docs-top-bar-v2">
        <div className="docs-top-left">
          <button onClick={onBack} className="docs-back-btn-v2" aria-label="Вернуться на главную">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>На главную</span>
          </button>

          <div className="docs-breadcrumbs" aria-label="Навигация по разделам">
            <span className="breadcrumb-root">База знаний</span>
            <span className="breadcrumb-sep">/</span>
            <span className={`breadcrumb-category text-${activeMeta.tone}`}>{activeMeta.category}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{activeMeta.item.label.replace(/^[^\s]+\s*/, '')}</span>
          </div>
        </div>

        <div className="docs-top-right">
          <button 
            onClick={handleCopyDocLink}
            className={`docs-share-btn ${copiedLink ? "copied" : ""}`}
            title="Скопировать прямую ссылку на раздел"
          >
            {copiedLink ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Ссылка скопирована!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Поделиться</span>
              </>
            )}
          </button>

          <div className="docs-meta-pill">
            <span className="docs-read-time">{activeMeta.item.readTime}</span>
            <span className="docs-version-tag">v7.0 Pro SOTA</span>
          </div>

          {/* Mobile Drawer Trigger */}
          <button 
            onClick={() => setMobileDrawerOpen(true)}
            className="docs-mobile-menu-trigger"
            aria-label="Открыть оглавление документации"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Оглавление</span>
          </button>
        </div>
      </div>

      <div className="docs-layout-container docs-layout-v2">
        {/* Left Sidebar (Desktop) */}
        <aside className="docs-sidebar docs-sidebar-v2">
          <div className="docs-sidebar-header-v2">
            <div className="sidebar-brand-row">
              <span className="sidebar-badge-kicker">База Знаний v7</span>
              <span className="sidebar-doc-count">{totalResultsCount} статей</span>
            </div>
            
            {/* Live Search Input */}
            <div className="docs-search-box-v2">
              <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск по статьям и технологиям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="docs-search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="search-clear-btn" 
                  aria-label="Очистить поиск"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <nav className="docs-sidebar-nav docs-sidebar-nav-v2">
            {filteredMenu.length === 0 ? (
              <div className="docs-empty-search">
                <p>Ничего не найдено по запросу «{searchQuery}»</p>
                <button onClick={() => setSearchQuery("")} className="docs-reset-search-btn">
                  Сбросить фильтр
                </button>
              </div>
            ) : (
              filteredMenu.map((group) => (
                <div key={group.category} className="docs-nav-group-v2">
                  <div className={`docs-category-title tone-${group.badgeTone}`}>
                    <span>{group.category}</span>
                    <span className="group-count">{group.items.length}</span>
                  </div>
                  <div className="docs-group-items">
                    {group.items.map((item) => {
                      const isActive = activeDoc === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectArticle(item.id)}
                          className={`docs-nav-item-v2 ${isActive ? "active" : ""}`}
                        >
                          <div className="docs-item-indicator" aria-hidden="true" />
                          <div className="docs-item-body">
                            <div className="docs-item-label-row">
                              <span className="docs-item-label">{item.label}</span>
                              <span className="docs-item-time">{item.readTime}</span>
                            </div>
                            <div className="docs-item-desc">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <main className="docs-main-content docs-main-content-v2">
          {activeDoc === "architecture" && <ArchitectureDoc />}
          {activeDoc === "cli_guide" && <CliGuideDoc />}
          {activeDoc === "training" && <TrainingDoc />}
          {activeDoc === "tokenizer" && <TokenizerDoc />}
          {activeDoc === "rope_yarn" && <RoPEYaRNDoc />}
          {activeDoc === "moe_swiglu" && <MoEDoc />}
          {activeDoc === "optimizers" && <OptimizersDoc />}
          {activeDoc === "speculative" && <SpeculativeDoc />}
          {activeDoc === "dataset_guide" && <DatasetTutorialDoc />}
          {activeDoc === "tokenization_tutorial" && <TokenizationTutorialDoc />}
          {activeDoc === "training_guide_doc" && <TrainingTutorialDoc />}
          {activeDoc === "interaction_tutorial" && <InteractionTutorialDoc />}
        </main>
      </div>

      {/* Mobile Drawer (Off-Canvas Navigation) */}
      <div 
        className={`docs-mobile-backdrop ${mobileDrawerOpen ? "open" : ""}`}
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />
      <div className={`docs-mobile-drawer ${mobileDrawerOpen ? "open" : ""}`}>
        <div className="docs-drawer-header">
          <div className="drawer-title">Оглавление документации</div>
          <button 
            onClick={() => setMobileDrawerOpen(false)} 
            className="drawer-close-btn"
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        <div className="docs-drawer-search">
          <input
            type="text"
            placeholder="Поиск по статьям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="docs-drawer-input"
          />
        </div>

        <div className="docs-drawer-nav">
          {filteredMenu.map((group) => (
            <div key={group.category} className="drawer-group">
              <div className="drawer-category-label">{group.category}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectArticle(item.id)}
                  className={`drawer-item ${activeDoc === item.id ? "active" : ""}`}
                >
                  <span className="drawer-item-title">{item.label}</span>
                  <span className="drawer-item-desc">{item.desc}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}