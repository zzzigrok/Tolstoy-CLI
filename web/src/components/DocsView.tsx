import { useState, useEffect, useRef } from "react";
import { 
  ArchitectureDoc, 
  CliGuideDoc, 
  TrainingDoc, 
  TokenizerDoc, 
  RoPEYaRNDoc, 
  MoEDoc, 
  SpeculativeDoc, 
  DatasetTutorialDoc, 
  TrainingTutorialDoc 
} from "./DocSections";

// KaTeX dynamic math renderer component
export function Math({ formula, block = false }: { formula: string; block?: boolean }) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && (window as any).katex) {
      try {
        (window as any).katex.render(formula, containerRef.current, {
          displayMode: block,
          throwOnError: false
        });
      } catch (err) {
        console.error("KaTeX error:", err);
      }
    }
  }, [formula, block]);

  if (block) {
    return <div ref={containerRef} className="katex-block-container" />;
  }
  return <span ref={containerRef} className="katex-inline-container" />;
}

// Helper components for rich rendering
export function CodeBlock({ code, language }: { code: string; language: string }) {
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
    <div className="docs-code-container">
      <div className="docs-code-header">
        <span>{language}</span>
        <button onClick={handleCopy} className="docs-copy-btn">
          {copied ? "Скопировано!" : "Копировать"}
        </button>
      </div>
      <pre className="docs-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function AlertBox({ type, title, children }: { type: "info" | "tip" | "warning"; title: string; children: React.ReactNode }) {
  const icon = {
    info: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }[type];

  return (
    <div className={`docs-alert docs-alert-${type}`}>
      <div className="docs-alert-header">
        {icon}
        <span className="docs-alert-title">{title}</span>
      </div>
      <div className="docs-alert-content">{children}</div>
    </div>
  );
}

export function DocsView({ onBack }: { onBack: () => void }) {
  const [activeDoc, setActiveDoc] = useState<string>("architecture");

  // Reset scroll position when doc changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [activeDoc]);

  const docsMenu = [
    { 
      category: "ОСНОВНОЕ",
      items: [
        { id: "architecture", label: "🏗️ Архитектура модели", desc: "Подробный разбор TolstoyLLM_v5" },
        { id: "cli_guide", label: "🗺️ Руководство CLI", desc: "Мануал по управлению через консоль" },
        { id: "training", label: "🔬 Обучение и оптимизация", desc: "GaLore, Muon и валидация" },
        { id: "tokenizer", label: "🧠 BPE Токенизатор", desc: "Детали алгоритма BPETokenizer v10" },
      ]
    },
    {
      category: "ТЕХНИЧЕСКИЕ РАЗБОРЫ",
      items: [
        { id: "rope_yarn", label: "🌀 RoPE & YaRN", desc: "Ротационные эмбеддинги и экстраполяция" },
        { id: "moe_swiglu", label: "🧩 Sparse MoE", desc: "Смесь экспертов и активация SwiGLU" },
        { id: "speculative", label: "🐣 Speculative Decoding", desc: "Ускорение через Multi-Token Prediction" },
      ]
    },
    {
      category: "ТУТОРИАЛЫ",
      items: [
        { id: "dataset_guide", label: "📂 Создание датасета", desc: "Стратегии сбора и очистки данных" },
        { id: "training_guide_doc", label: "🏋️ Мастер-класс обучения", desc: "Тюнинг параметров и мониторинг" },
      ]
    }
  ];

  return (
    <div className="docs-page-wrapper">
      {/* Background gradients */}
      <div className="docs-bg-glow">
        <div className="docs-glow-1"></div>
        <div className="docs-glow-2"></div>
      </div>

      <div className="docs-header-bar">
        <button onClick={onBack} className="docs-back-btn">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться на главную
        </button>
        <span className="docs-title-badge">Tolstoy-CLI Документация</span>
      </div>

      <div className="docs-layout-container">
        {/* Left Sidebar */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-header">
            <h3>Разделы документации</h3>
            <p>Технические статьи, мануалы и разборы алгоритмов</p>
          </div>
          <nav className="docs-sidebar-nav">
            {docsMenu.map((group) => (
              <div key={group.category} className="docs-nav-group">
                <div className="docs-nav-category-header">{group.category}</div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDoc(item.id)}
                    className={`docs-nav-item ${activeDoc === item.id ? "active" : ""}`}
                  >
                    <div className="docs-nav-item-label">{item.label}</div>
                    <div className="docs-nav-item-desc">{item.desc}</div>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="docs-main-content">
          {activeDoc === "architecture" && <ArchitectureDoc />}
          {activeDoc === "cli_guide" && <CliGuideDoc />}
          {activeDoc === "training" && <TrainingDoc />}
          {activeDoc === "tokenizer" && <TokenizerDoc />}
          {activeDoc === "rope_yarn" && <RoPEYaRNDoc />}
          {activeDoc === "moe_swiglu" && <MoEDoc />}
          {activeDoc === "speculative" && <SpeculativeDoc />}
          {activeDoc === "dataset_guide" && <DatasetTutorialDoc />}
          {activeDoc === "training_guide_doc" && <TrainingTutorialDoc />}
        </main>
      </div>
    </div>
  );
}
