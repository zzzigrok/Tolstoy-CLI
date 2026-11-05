import { useState } from "react";
import { CliTerminal } from "./CliTerminal";
import { TokenizerPlayground } from "./TokenizerPlayground";
import { VramCalculator } from "./VramCalculator";

type LabTab = "terminal" | "tokenizer" | "vram";

export function InteractiveLab() {
  const [activeTab, setActiveTab] = useState<LabTab>("terminal");

  return (
    <section className="section-shell interactive-lab-section" id="lab">
      {/* Decorative background glows */}
      <div className="lab-bg-glow-1" />
      <div className="lab-bg-glow-2" />

      <div className="section-heading centered">
        <div className="section-kicker-badge">
          <svg className="kicker-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Интерактивная Лаборатория
        </div>
        <h2>Попробуйте Tolstoy-CLI в действии</h2>
        <p className="section-lead">
          Исследуйте архитектуру, оцените скорость токенизации на Rust и рассчитайте требования к видеокарте без установки окружения.
        </p>
      </div>

      {/* Main Glass Container */}
      <div className="lab-glass-card">
        {/* Lab Tab Buttons */}
        <div className="lab-tabs-nav">
          <button
            className={`lab-tab-btn ${activeTab === "terminal" ? "active" : ""}`}
            onClick={() => setActiveTab("terminal")}
          >
            <span className="tab-icon font-mono">&gt;_</span>
            <span className="tab-title">CLI-Терминал v7</span>
            <span className="tab-badge text-cyan">Interactive</span>
          </button>

          <button
            className={`lab-tab-btn ${activeTab === "tokenizer" ? "active" : ""}`}
            onClick={() => setActiveTab("tokenizer")}
          >
            <span className="tab-icon">✂️</span>
            <span className="tab-title">Live BPE Токенизатор</span>
            <span className="tab-badge text-purple">Rust PyO3</span>
          </button>

          <button
            className={`lab-tab-btn ${activeTab === "vram" ? "active" : ""}`}
            onClick={() => setActiveTab("vram")}
          >
            <span className="tab-icon">⚡</span>
            <span className="tab-title">Калькулятор VRAM</span>
            <span className="tab-badge text-emerald">GaLore Ready</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="lab-tab-body">
          {activeTab === "terminal" && (
            <div className="lab-pane fade-in">
              <div className="pane-header-tip">
                <span className="tip-badge">Подсказка:</span> Попробуйте ввести{" "}
                <code className="text-cyan-glow">train mini --galore</code>,{" "}
                <code className="text-cyan-glow">chat В чем смысл жизни?</code> или{" "}
                <code className="text-cyan-glow">corus</code>
              </div>
              <CliTerminal />
            </div>
          )}

          {activeTab === "tokenizer" && (
            <div className="lab-pane fade-in">
              <div className="pane-header-tip">
                <span className="tip-badge">Подсказка:</span> Введите любой текст ниже или выберите цитату классика, чтобы увидеть разбиение на кириллические суб-токены в реальном времени.
              </div>
              <TokenizerPlayground />
            </div>
          )}

          {activeTab === "vram" && (
            <div className="lab-pane fade-in">
              <div className="pane-header-tip">
                <span className="tip-badge">Подсказка:</span> Включайте и отключайте <strong>GaLore</strong> и <strong>XQuant</strong>, чтобы наглядно увидеть, как оптимизации экономят до 80% видеопамяти.
              </div>
              <VramCalculator />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
