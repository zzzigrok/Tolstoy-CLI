import { corpusAuthors } from "../data/content";

export function Architecture() {
  return (
    <section id="architecture" className="architecture-section-new">
      {/* Subtle grid background */}
      <div className="architecture-grid-bg" />

      <div className="section-shell">
        <div className="section-heading centered">
          <div className="section-kicker-badge">
            <svg className="kicker-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            SOTA Ядро v7 Pro
          </div>
          <h2>Архитектура & Экстремальные Оптимизации</h2>
          <p className="section-lead">
            Стек передовых технологий: от проекций GaLore в низкий ранг до ортогонализации Muon и Sparse MoE. Обучайте и запускайте 1B+ модели на потребительском железе.
          </p>
        </div>

        {/* Bento Grid 2.0 (High-Detail Sci-Fi / Engineering Graphics) */}
        <div className="bento-grid-v2">
          
          {/* =================================================================
              ROW 1: TWO HEAVY FLAGSHIPS (Span 7 & Span 5)
              ================================================================= */}

          {/* Card 1: GaLore (Large Span 7) */}
          <div className="bento-card-v2 galore-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box cyan">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6" />
                </svg>
              </div>
              <div className="bento-metric-badge cyan">
                -80% VRAM Оптимизатора
              </div>
            </div>

            {/* High-Detail GaLore SVD Low-Rank Projection Graphic */}
            <div className="bento-card-visual-zone hero-zone cyan-zone">
              <svg className="bento-zone-svg" viewBox="0 0 520 135" fill="none">
                <defs>
                  <linearGradient id="galore-grad-full" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="galore-grad-p" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="galore-grad-q" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
                  </linearGradient>
                  <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Blueprint Grid */}
                <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                  <line x1="0" y1="30" x2="520" y2="30" />
                  <line x1="0" y1="67" x2="520" y2="67" />
                  <line x1="0" y1="105" x2="520" y2="105" />
                  <line x1="130" y1="0" x2="130" y2="135" />
                  <line x1="260" y1="0" x2="260" y2="135" />
                  <line x1="390" y1="0" x2="390" y2="135" />
                </g>

                {/* 1. Left: Full-Rank Gradient Matrix G [4096 x 4096] */}
                <g transform="translate(22, 14)">
                  <rect x="0" y="0" width="96" height="86" rx="6" fill="url(#galore-grad-full)" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
                  {/* Internal 4x4 Tensor Cells */}
                  {[0, 1, 2, 3].map((r) =>
                    [0, 1, 2, 3].map((c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={8 + c * 21}
                        y={8 + r * 16}
                        width="17"
                        height="12"
                        rx="2"
                        fill={(r + c) % 2 === 0 ? "rgba(34,211,238,0.28)" : "rgba(34,211,238,0.1)"}
                      />
                    ))
                  )}
                  <text x="48" y="80" fill="#e2e8f0" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ∇W [4096×4096]
                  </text>
                  <rect x="6" y="92" width="84" height="16" rx="4" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.35)" strokeWidth="1" />
                  <text x="48" y="103" fill="#f87171" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    AdamW: 16.0 GB
                  </text>
                </g>

                {/* 2. Center: SVD Low-Rank Projection Funnel */}
                <g transform="translate(135, 22)">
                  {/* Converging Laser Rays */}
                  <path d="M0 15 L65 38" stroke="rgba(34,211,238,0.35)" strokeWidth="1" strokeDasharray="3 3" className="animate-dash-flow" />
                  <path d="M0 70 L65 48" stroke="rgba(34,211,238,0.35)" strokeWidth="1" strokeDasharray="3 3" className="animate-dash-flow" />
                  <path d="M0 43 L115 43" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow" />

                  {/* SVD Core Hexagon */}
                  <polygon
                    points="60,18 92,30 92,56 60,68 38,56 38,30"
                    fill="#091326"
                    stroke="#22d3ee"
                    strokeWidth="1.8"
                    filter="url(#glow-cyan)"
                  />
                  <text x="65" y="41" fill="#22d3ee" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    SVD PROJ
                  </text>
                  <text x="65" y="52" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                    rank=64
                  </text>

                  {/* Animated data particle */}
                  <circle cx="0" cy="43" r="3" fill="#fff" filter="url(#glow-cyan)">
                    <animate attributeName="cx" values="0;115" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* 3. Right: Low-Rank Factors P [M x r] and Q [r x N] */}
                <g transform="translate(268, 14)">
                  {/* Vertical Tall Matrix P */}
                  <rect x="0" y="0" width="28" height="86" rx="5" fill="url(#galore-grad-p)" stroke="#22d3ee" strokeWidth="1.8" filter="url(#glow-cyan)" />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <rect key={i} x="5" y={6 + i * 14} width="18" height="10" rx="1.5" fill="rgba(255,255,255,0.3)" />
                  ))}
                  <text x="14" y="81" fill="#fff" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    P
                  </text>

                  {/* Multiply symbol */}
                  <circle cx="44" cy="43" r="9" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" />
                  <text x="44" y="47" fill="#22d3ee" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    &times;
                  </text>

                  {/* Horizontal Wide Matrix Q */}
                  <rect x="60" y="29" width="96" height="28" rx="5" fill="url(#galore-grad-q)" stroke="#c084fc" strokeWidth="1.8" />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <rect key={i} x={66 + i * 17} y="34" width="13" height="18" rx="1.5" fill="rgba(255,255,255,0.28)" />
                  ))}
                  <text x="108" y="70" fill="#c084fc" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Q [64×4096]
                  </text>

                  {/* Savings readout badge */}
                  <rect x="0" y="92" width="156" height="16" rx="4" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.45)" strokeWidth="1" />
                  <text x="78" y="103" fill="#34d399" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ✓ GaLore State: 2.4 GB (-80%)
                  </text>

                  {/* Right Telemetry Mini Bars */}
                  <g transform="translate(172, 6)">
                    <text x="0" y="10" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">VRAM USAGE</text>
                    <rect x="0" y="16" width="52" height="8" rx="2" fill="rgba(255,255,255,0.08)" />
                    <rect x="0" y="16" width="52" height="8" rx="2" fill="#ef4444" opacity="0.7" />
                    <text x="0" y="36" fill="#22d3ee" fontSize="7.5" fontFamily="monospace">GALORE R=64</text>
                    <rect x="0" y="42" width="52" height="8" rx="2" fill="rgba(255,255,255,0.08)" />
                    <rect x="0" y="42" width="11" height="8" rx="2" fill="#34d399" filter="url(#glow-cyan)" />
                  </g>
                </g>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>GaLore: Gradient Low-Rank Projection</h3>
              <p>
                Проекция матриц градиентов в компактное подпространство низкого ранга (r = 64). Сокращает память состояний оптимизатора AdamW на 80% (с 16 до 3.2 байт на параметр), позволяя обучать модели 1B+ на домашней RTX 3060 без деградации Loss.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag cyan">Rank r=64</span>
                <span className="bento-tag">Zero Loss Degradation</span>
                <span className="bento-tag">FP32 Equivalence</span>
              </div>
            </div>
          </div>

          {/* Card 2: Sparse MoE (Span 5) */}
          <div className="bento-card-v2 moe-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box purple">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="bento-metric-badge purple">
                8 Экспертов • Top-2
              </div>
            </div>

            {/* High-Detail Sparse MoE Neural Router Graphic */}
            <div className="bento-card-visual-zone hero-zone purple-zone">
              <svg className="bento-zone-svg" viewBox="0 0 380 135" fill="none">
                <defs>
                  <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. Input Token Vector */}
                <g transform="translate(14, 38)">
                  <rect x="0" y="0" width="46" height="58" rx="6" fill="#0d1326" stroke="#22d3ee" strokeWidth="1.5" />
                  <text x="23" y="16" fill="#22d3ee" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">TOKEN</text>
                  <rect x="8" y="22" width="30" height="5" rx="2" fill="#22d3ee" opacity="0.8" />
                  <rect x="8" y="31" width="30" height="5" rx="2" fill="#c084fc" opacity="0.8" />
                  <rect x="8" y="40" width="30" height="5" rx="2" fill="#38bdf8" opacity="0.5" />
                  <text x="23" y="54" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">x_t [d]</text>
                </g>

                {/* Input to Router Line */}
                <path d="M60 67 L98 67" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3 3" className="animate-dash-flow" />

                {/* 2. Gating Softmax Router */}
                <g transform="translate(98, 25)">
                  <rect x="0" y="0" width="68" height="84" rx="8" fill="rgba(139,92,246,0.16)" stroke="#c084fc" strokeWidth="1.8" filter="url(#glow-purple)" />
                  <text x="34" y="17" fill="#fff" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">GATING</text>
                  <text x="34" y="28" fill="#c084fc" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Softmax(W_g)</text>
                  {/* Probability bars inside router */}
                  <rect x="8" y="36" width="42" height="6" rx="2" fill="#22d3ee" />
                  <text x="54" y="42" fill="#22d3ee" fontSize="6.5" fontFamily="monospace">.58</text>
                  <rect x="8" y="46" width="12" height="5" rx="1.5" fill="rgba(255,255,255,0.15)" />
                  <rect x="8" y="55" width="28" height="6" rx="2" fill="#c084fc" />
                  <text x="40" y="61" fill="#c084fc" fontSize="6.5" fontFamily="monospace">.31</text>
                  <rect x="8" y="65" width="8" height="5" rx="1.5" fill="rgba(255,255,255,0.15)" />
                  <text x="34" y="79" fill="#34d399" fontSize="7" fontFamily="monospace" textAnchor="middle">Top-2 Selected</text>
                </g>

                {/* 3. Routing Curves to 8 Experts */}
                {/* Inactive subtle curves */}
                <path d="M166 67 C 195 67, 200 42, 232 42" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M166 67 C 195 67, 200 92, 232 92" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M166 67 C 195 67, 200 116, 232 116" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />

                {/* Active Route 1 -> Expert 1 */}
                <path id="moe-route-1" d="M166 50 C 195 50, 195 18, 232 18" stroke="#22d3ee" strokeWidth="2.2" filter="url(#glow-purple)" />
                <circle r="3" fill="#fff">
                  <animateMotion dur="1.4s" repeatCount="indefinite" path="M166 50 C 195 50, 195 18, 232 18" />
                </circle>

                {/* Active Route 2 -> Expert 3 */}
                <path id="moe-route-2" d="M166 72 C 195 72, 195 67, 232 67" stroke="#c084fc" strokeWidth="2.2" filter="url(#glow-purple)" />
                <circle r="3" fill="#fff">
                  <animateMotion dur="1.7s" repeatCount="indefinite" path="M166 72 C 195 72, 195 67, 232 67" />
                </circle>

                {/* 4. Expert Bank (Col 1: E1..E4, Col 2: E5..E8) */}
                <g transform="translate(232, 6)">
                  {/* E1 - ACTIVE */}
                  <rect x="0" y="2" width="64" height="22" rx="4" fill="rgba(34,211,238,0.2)" stroke="#22d3ee" strokeWidth="1.5" />
                  <circle cx="10" cy="13" r="3" fill="#22d3ee" className="animate-pulse" />
                  <text x="36" y="16" fill="#fff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">FFN Exp 1</text>

                  {/* E2 - IDLE */}
                  <rect x="0" y="28" width="64" height="20" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                  <text x="32" y="41" fill="#64748b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">FFN Exp 2</text>

                  {/* E3 - ACTIVE */}
                  <rect x="0" y="52" width="64" height="22" rx="4" fill="rgba(192,132,252,0.22)" stroke="#c084fc" strokeWidth="1.5" />
                  <circle cx="10" cy="63" r="3" fill="#c084fc" className="animate-pulse" />
                  <text x="36" y="66" fill="#fff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">FFN Exp 3</text>

                  {/* E4 - IDLE */}
                  <rect x="0" y="78" width="64" height="20" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                  <text x="32" y="91" fill="#64748b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">FFN Exp 4</text>

                  {/* E5..E8 Mini Indicators */}
                  <rect x="0" y="102" width="64" height="18" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
                  <text x="32" y="114" fill="#64748b" fontSize="7" fontFamily="monospace" textAnchor="middle">Exp 5..8 Idle</text>
                </g>

                {/* 5. Combine Output Node */}
                <path d="M296 18 C 318 18, 320 55, 338 63" stroke="#22d3ee" strokeWidth="1.8" />
                <path d="M296 63 C 318 63, 320 63, 338 63" stroke="#c084fc" strokeWidth="1.8" />
                <circle cx="348" cy="63" r="14" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
                <text x="348" y="66" fill="#34d399" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">∑y</text>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>Sparse Mixture of Experts (MoE)</h3>
              <p>
                Динамическая маршрутизация токенов через специализированные экспертные слои. Радикально масштабирует базу знаний модели в 4–8 раз без линейного роста вычислительных затрат на инференс.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag purple">Top-2 Routing</span>
                <span className="bento-tag">8 Экспертов</span>
                <span className="bento-tag">Load Balancing</span>
              </div>
            </div>
          </div>

          {/* =================================================================
              ROW 2: PERFORMANCE TRIAD (Span 4, Span 4, Span 4)
              ================================================================= */}

          {/* Card 3: Muon Optimizer (Span 4) */}
          <div className="bento-card-v2 muon-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box emerald">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="bento-metric-badge emerald">
                Стабильность Ньютона
              </div>
            </div>

            {/* High-Detail Muon Newton-Schulz Orthogonalization Gyroscope */}
            <div className="bento-card-visual-zone emerald-zone">
              <svg className="bento-zone-svg" viewBox="0 0 280 110" fill="none">
                {/* Left: Raw Skewed Vectors */}
                <g transform="translate(16, 22)">
                  <text x="26" y="10" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">RAW GRAD</text>
                  <line x1="10" y1="55" x2="45" y2="20" stroke="#f59e0b" strokeWidth="1.8" />
                  <line x1="10" y1="55" x2="48" y2="30" stroke="#ef4444" strokeWidth="1.8" />
                  <circle cx="10" cy="55" r="2.5" fill="#f59e0b" />
                  <text x="26" y="68" fill="#f87171" fontSize="7" fontFamily="monospace" textAnchor="middle">Skewed</text>
                </g>

                {/* Arrow */}
                <path d="M72 55 L95 55" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" className="animate-dash-flow" />

                {/* Center: 3D Gyroscope Orthogonal Manifold */}
                <g transform="translate(142, 53)">
                  <circle cx="0" cy="0" r="38" fill="rgba(16,185,129,0.05)" stroke="rgba(52,211,153,0.3)" strokeWidth="1.2" strokeDasharray="4 3" className="animate-spin-slow" />
                  <ellipse cx="0" cy="0" rx="38" ry="15" stroke="rgba(52,211,153,0.4)" strokeWidth="1.2" />
                  <ellipse cx="0" cy="0" rx="15" ry="38" stroke="rgba(34,211,238,0.35)" strokeWidth="1.2" />

                  {/* Orthogonal Basis Vectors u1 _|_ u2 */}
                  <line x1="0" y1="0" x2="0" y2="-30" stroke="#34d399" strokeWidth="2.2" />
                  <polygon points="-3,-28 0,-35 3,-28" fill="#34d399" />
                  <line x1="0" y1="0" x2="30" y2="0" stroke="#22d3ee" strokeWidth="2.2" />
                  <polygon points="28,-3 35,0 28,3" fill="#22d3ee" />
                  {/* 90 degree right-angle square */}
                  <polyline points="0,-8 8,-8 8,0" fill="none" stroke="#fff" strokeWidth="1" opacity="0.8" />
                  <circle cx="0" cy="0" r="3" fill="#fff" />
                </g>

                {/* Right: 5-Step NS Telemetry */}
                <g transform="translate(196, 18)">
                  <rect x="0" y="0" width="72" height="74" rx="6" fill="rgba(6,14,26,0.85)" stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
                  <text x="36" y="15" fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">NS-5 ITER</text>
                  <text x="36" y="29" fill="#e2e8f0" fontSize="7.5" fontFamily="monospace" textAnchor="middle">X ← aX - bX³</text>
                  <line x1="8" y1="36" x2="64" y2="36" stroke="rgba(255,255,255,0.1)" />
                  <text x="36" y="49" fill="#22d3ee" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">U·Vᵀ = I</text>
                  <text x="36" y="64" fill="#34d399" fontSize="7.5" fontFamily="monospace" textAnchor="middle">✓ Ortho 99.9%</text>
                </g>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>Muon: Оптимизатор SOTA</h3>
              <p>
                Ортогонализация весовых матриц за 5 итераций метода Ньютона-Шульца. Исключает взрыв градиентов и ускоряет сходимость при learning rate в 3 раза выше обычного.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag emerald">Newton-Schulz</span>
                <span className="bento-tag">3x Higher LR</span>
              </div>
            </div>
          </div>

          {/* Card 4: Speculative Decoding (Span 4) */}
          <div className="bento-card-v2 speculative-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box pink">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="bento-metric-badge pink">
                Ускорение 2.5×
              </div>
            </div>

            {/* High-Detail Speculative Decoding Dual Track Timeline */}
            <div className="bento-card-visual-zone pink-zone">
              <svg className="bento-zone-svg" viewBox="0 0 280 110" fill="none">
                {/* Track 1: Standard Autoregressive (Slow) */}
                <g transform="translate(14, 12)">
                  <text x="0" y="10" fill="#64748b" fontSize="7.5" fontFamily="monospace">STD AUTOREGRESSIVE (1 tok/step):</text>
                  <rect x="0" y="15" width="46" height="18" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" />
                  <text x="23" y="27" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">«Дуб»</text>
                  <path d="M50 24 L76 24" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="80" y="15" width="56" height="18" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                  <text x="108" y="27" fill="#64748b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">waiting...</text>
                </g>

                {/* Track 2: Speculative MTP Cascade (Fast Parallel) */}
                <g transform="translate(14, 50)">
                  <text x="0" y="10" fill="#f472b6" fontSize="7.5" fontFamily="monospace" fontWeight="bold">MTP SPECULATIVE CASCADE (3 tok/step):</text>

                  {/* Draft Token 1 */}
                  <rect x="0" y="16" width="52" height="24" rx="4" fill="rgba(244,114,182,0.2)" stroke="#f472b6" strokeWidth="1.5" />
                  <text x="26" y="31" fill="#fff" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">«Дуб»</text>
                  <circle cx="45" cy="22" r="3" fill="#34d399" />

                  {/* Draft Token 2 */}
                  <rect x="60" y="16" width="58" height="24" rx="4" fill="rgba(244,114,182,0.2)" stroke="#f472b6" strokeWidth="1.5" />
                  <text x="89" y="31" fill="#fff" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">«стоял»</text>
                  <circle cx="111" cy="22" r="3" fill="#34d399" />

                  {/* Draft Token 3 */}
                  <rect x="126" y="16" width="56" height="24" rx="4" fill="rgba(244,114,182,0.2)" stroke="#f472b6" strokeWidth="1.5" />
                  <text x="154" y="31" fill="#fff" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">«в поле»</text>
                  <circle cx="175" cy="22" r="3" fill="#34d399" />

                  {/* Verification Sweep Bar */}
                  <path d="M0 47 L182 47" stroke="#34d399" strokeWidth="2" className="animate-dash-flow" />

                  {/* Speedup Badge */}
                  <rect x="192" y="14" width="60" height="28" rx="6" fill="rgba(16,185,129,0.16)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="222" y="27" fill="#34d399" fontSize="9.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">2.5× ⚡</text>
                  <text x="222" y="37" fill="#a7f3d0" fontSize="6.5" fontFamily="monospace" textAnchor="middle">VERIFIED</text>
                </g>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>Speculative Decoding (MTP)</h3>
              <p>
                Каскад спекулятивных голов, предсказывающих несколько токенов наперед за один прямой проход, с параллельной верификацией базовой сетью без потери точности.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag pink">Multi-Token Heads</span>
                <span className="bento-tag">Zero Quality Loss</span>
              </div>
            </div>
          </div>

          {/* Card 5: XQuant-CL (Span 4) */}
          <div className="bento-card-v2 xquant-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box yellow">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div className="bento-metric-badge yellow">
                4× Длиннее Контекст
              </div>
            </div>

            {/* High-Detail XQuant FP16 -> INT8 Tensor Compression SVG */}
            <div className="bento-card-visual-zone yellow-zone">
              <svg className="bento-zone-svg" viewBox="0 0 280 110" fill="none">
                {/* 1. Left: Heavy FP16 KV-Cache Blocks */}
                <g transform="translate(12, 16)">
                  <text x="42" y="10" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">FP16 KV (16-bit)</text>
                  {[0, 1, 2].map((r) => (
                    <g key={r} transform={`translate(0, ${16 + r * 19})`}>
                      <rect x="0" y="0" width="84" height="14" rx="3" fill="rgba(239,68,68,0.15)" stroke="rgba(248,113,113,0.45)" strokeWidth="1" />
                      <text x="42" y="10" fill="#fca5a5" fontSize="7.5" fontFamily="monospace" textAnchor="middle">01001101 11010010</text>
                    </g>
                  ))}
                  <text x="42" y="84" fill="#f87171" fontSize="7.5" fontFamily="monospace" textAnchor="middle">High VRAM Usage</text>
                </g>

                {/* 2. Center: Quantization Funnel */}
                <g transform="translate(104, 38)">
                  <path d="M0 18 L34 18" stroke="#facc15" strokeWidth="2" strokeDasharray="3 2" className="animate-dash-flow" />
                  <polygon points="12,6 26,18 12,30" fill="rgba(250,204,21,0.25)" stroke="#facc15" strokeWidth="1.5" />
                  <text x="19" y="42" fill="#facc15" fontSize="7" fontFamily="monospace" textAnchor="middle">scale s</text>
                </g>

                {/* 3. Right: Compact INT8 Quantized Tensor Grid */}
                <g transform="translate(148, 14)">
                  <text x="58" y="11" fill="#facc15" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">INT8 KV-CACHE + SCALE</text>
                  <rect x="0" y="16" width="116" height="54" rx="6" fill="rgba(250,204,21,0.08)" stroke="rgba(250,204,21,0.45)" strokeWidth="1.5" />
                  {/* 6x3 Quantized INT8 Cells */}
                  {[0, 1, 2].map((r) =>
                    [0, 1, 2, 3, 4, 5].map((c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={7 + c * 17}
                        y={22 + r * 14}
                        width="13"
                        height="10"
                        rx="2"
                        fill={(r + c) % 3 === 0 ? "#facc15" : (r + c) % 2 === 0 ? "rgba(250,204,21,0.55)" : "rgba(250,204,21,0.22)"}
                      />
                    ))
                  )}
                  <rect x="0" y="75" width="116" height="15" rx="4" fill="rgba(16,185,129,0.16)" stroke="rgba(52,211,153,0.4)" />
                  <text x="58" y="85" fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ✓ -50% Памяти (8192 ctx)
                  </text>
                </g>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>XQuant-CL: INT8 KV-Cache</h3>
              <p>
                Динамическое сжатие кэша внимания в 8-bit на лету. Экономит до 50% видеопамяти на длинных диалогах (до 8192 токенов), предотвращая Out-of-Memory.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag yellow">Dynamic Scaling</span>
                <span className="bento-tag">8192+ Context</span>
              </div>
            </div>
          </div>

          {/* =================================================================
              ROW 3: FOUNDATIONS & ATTENTION (Span 4, Span 4, Span 4)
              ================================================================= */}

          {/* Card 6: Rust BPE Engine (Span 4) */}
          <div className="bento-card-v2 rust-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box orange">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div className="bento-metric-badge orange">
                20× Быстрее Python
              </div>
            </div>

            {/* High-Detail Rust BPE Multi-Thread Pipeline SVG */}
            <div className="bento-card-visual-zone orange-zone">
              <svg className="bento-zone-svg" viewBox="0 0 280 110" fill="none">
                {/* 1. Left: Cyrillic Input Stream */}
                <g transform="translate(10, 26)">
                  <rect x="0" y="0" width="58" height="56" rx="6" fill="#0d1326" stroke="rgba(251,146,60,0.45)" strokeWidth="1.5" />
                  <text x="29" y="16" fill="#fb923c" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">UTF-8 RAW</text>
                  <text x="29" y="32" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">«Война</text>
                  <text x="29" y="45" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">и мир»</text>
                </g>

                {/* 2. Center: Rayon 16-Thread Parallel Lanes */}
                <g transform="translate(76, 18)">
                  <text x="58" y="9" fill="#fb923c" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">RAYON PARALLEL BPE</text>
                  {[0, 1, 2, 3].map((lane) => (
                    <g key={lane} transform={`translate(0, ${16 + lane * 14})`}>
                      <line x1="0" y1="4" x2="116" y2="4" stroke="rgba(251,146,60,0.25)" strokeWidth="2" />
                      <line x1="0" y1="4" x2="116" y2="4" stroke="#fb923c" strokeWidth="2" strokeDasharray="8 12" className="animate-dash-flow" />
                      <rect x={20 + lane * 22} y="0" width="16" height="8" rx="2" fill="#fb923c" />
                    </g>
                  ))}
                  <text x="58" y="80" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">0.12 ms Latency</text>
                </g>

                {/* 3. Right: Binary .bpe Output IDs */}
                <g transform="translate(200, 22)">
                  <rect x="0" y="0" width="68" height="64" rx="6" fill="rgba(251,146,60,0.12)" stroke="#fb923c" strokeWidth="1.5" />
                  <text x="34" y="15" fill="#fdba74" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">BINCODE</text>
                  <rect x="8" y="21" width="52" height="15" rx="3" fill="rgba(0,0,0,0.45)" />
                  <text x="34" y="31" fill="#22d3ee" fontSize="8" fontFamily="monospace" textAnchor="middle">#1405</text>
                  <rect x="8" y="40" width="52" height="15" rx="3" fill="rgba(0,0,0,0.45)" />
                  <text x="34" y="50" fill="#c084fc" fontSize="8" fontFamily="monospace" textAnchor="middle">#5920</text>
                </g>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>Rust BPE Tokenizer v10</h3>
              <p>
                Высокопроизводительный Byte-Level BPE токенизатор на Rust с биндингами PyO3 и бинарным кэшем (.bpe). Специально оптимизирован под кириллическую морфологию.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag orange">PyO3 + Rayon</span>
                <span className="bento-tag">Vocab: 32,768</span>
              </div>
            </div>
          </div>

          {/* Card 7: GQA (Span 4) */}
          <div className="bento-card-v2 gqa-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box blue">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="bento-metric-badge blue">
                FlashAttn-2 Native
              </div>
            </div>

            {/* High-Detail GQA 8 Query -> 2 Shared KV Multiplexer SVG */}
            <div className="bento-card-visual-zone blue-zone">
              <svg className="bento-zone-svg" viewBox="0 0 280 110" fill="none">
                {/* 1. Left: 8 Query Heads (Q1..Q8) */}
                <g transform="translate(14, 10)">
                  <text x="18" y="8" fill="#60a5fa" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">8 QUERIES</text>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((q) => (
                    <g key={q} transform={`translate(0, ${13 + q * 10})`}>
                      <rect x="0" y="0" width="36" height="8" rx="2" fill={q < 4 ? "rgba(56,189,248,0.25)" : "rgba(96,165,250,0.25)"} stroke={q < 4 ? "#38bdf8" : "#60a5fa"} strokeWidth="1" />
                      <text x="18" y="6.5" fill="#fff" fontSize="6" fontFamily="monospace" textAnchor="middle">Q{q + 1}</text>
                    </g>
                  ))}
                </g>

                {/* 2. Center: Converging Attention Fibers */}
                {[0, 1, 2, 3].map((q) => (
                  <path
                    key={`top-${q}`}
                    d={`M50 ${27 + q * 10} C 85 ${27 + q * 10}, 95 40, 130 40`}
                    stroke="#38bdf8"
                    strokeWidth="1.3"
                    opacity="0.75"
                  />
                ))}
                {[4, 5, 6, 7].map((q) => (
                  <path
                    key={`bot-${q}`}
                    d={`M50 ${27 + q * 10} C 85 ${27 + q * 10}, 95 80, 130 80`}
                    stroke="#60a5fa"
                    strokeWidth="1.3"
                    opacity="0.75"
                  />
                ))}

                {/* 3. Shared KV Heads */}
                <g transform="translate(130, 24)">
                  <rect x="0" y="0" width="64" height="30" rx="5" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="1.6" />
                  <text x="32" y="14" fill="#fff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">KV Head 1</text>
                  <text x="32" y="24" fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle">Shared Q1-Q4</text>

                  <rect x="0" y="40" width="64" height="30" rx="5" fill="rgba(96,165,250,0.2)" stroke="#60a5fa" strokeWidth="1.6" />
                  <text x="32" y="54" fill="#fff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">KV Head 2</text>
                  <text x="32" y="64" fill="#60a5fa" fontSize="7" fontFamily="monospace" textAnchor="middle">Shared Q5-Q8</text>
                </g>

                {/* 4. FlashAttn Output Block */}
                <path d="M194 39 L214 54" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M194 79 L214 64" stroke="#60a5fa" strokeWidth="1.5" />
                <g transform="translate(214, 34)">
                  <rect x="0" y="0" width="52" height="50" rx="6" fill="rgba(59,130,246,0.15)" stroke="#60a5fa" strokeWidth="1.5" />
                  <text x="26" y="20" fill="#60a5fa" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">FLASH</text>
                  <text x="26" y="31" fill="#fff" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ATTN-2</text>
                  <text x="26" y="43" fill="#34d399" fontSize="6.5" fontFamily="monospace" textAnchor="middle">-75% KV</text>
                </g>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>Grouped Query Attention (GQA)</h3>
              <p>
                Группировка 8 голов запросов вокруг общих ключей и значений. Снижает нагрузку на пропускную способность памяти при сохранении точности полного внимания.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag blue">8 Q / 2 KV Heads</span>
                <span className="bento-tag">Bandwidth Saver</span>
              </div>
            </div>
          </div>

          {/* Card 8: RMSNorm & SwiGLU (Span 4) */}
          <div className="bento-card-v2 swiglu-card group">
            <div className="bento-top-row">
              <div className="bento-icon-box violet">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="bento-metric-badge violet">
                LLaMA-3 SOTA
              </div>
            </div>

            {/* High-Detail RMSNorm + SwiGLU Gating Circuit & Curve Plot */}
            <div className="bento-card-visual-zone violet-zone">
              <svg className="bento-zone-svg" viewBox="0 0 280 110" fill="none">
                {/* 1. Left: SwiGLU Dual Branch Gate */}
                <g transform="translate(12, 18)">
                  <rect x="0" y="26" width="36" height="22" rx="4" fill="#0d1326" stroke="#c084fc" strokeWidth="1.4" />
                  <text x="18" y="40" fill="#fff" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">RMS(x)</text>

                  {/* Split into Swish(xW) and Linear(xV) */}
                  <path d="M36 37 L52 16 L66 16" stroke="#c084fc" strokeWidth="1.5" />
                  <path d="M36 37 L52 58 L66 58" stroke="#22d3ee" strokeWidth="1.5" />

                  <rect x="66" y="5" width="48" height="22" rx="4" fill="rgba(192,132,252,0.18)" stroke="#c084fc" strokeWidth="1.3" />
                  <text x="90" y="19" fill="#e9d5ff" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Swish(xW)</text>

                  <rect x="66" y="47" width="48" height="22" rx="4" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="1.3" />
                  <text x="90" y="61" fill="#cffafe" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Gate (xV)</text>

                  {/* Element-wise Multiply Node */}
                  <path d="M114 16 L132 37" stroke="#c084fc" strokeWidth="1.5" />
                  <path d="M114 58 L132 37" stroke="#22d3ee" strokeWidth="1.5" />
                  <circle cx="136" cy="37" r="10" fill="#1e1b4b" stroke="#c084fc" strokeWidth="1.8" />
                  <text x="136" y="41" fill="#fff" fontSize="11" fontFamily="monospace" textAnchor="middle">⊗</text>
                </g>

                {/* 2. Right: Oscilloscope Activation Curve Plot */}
                <g transform="translate(168, 14)">
                  <rect x="0" y="0" width="98" height="82" rx="6" fill="rgba(6,10,22,0.85)" stroke="rgba(192,132,252,0.3)" strokeWidth="1" />
                  {/* Axes */}
                  <line x1="10" y1="58" x2="90" y2="58" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <line x1="42" y1="12" x2="42" y2="74" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  {/* ReLU comparison (dashed gray) */}
                  <polyline points="12,58 42,58 84,18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="2 2" />
                  {/* Smooth SwiGLU Curve (glowing purple/cyan) */}
                  <path d="M12 58 Q 32 68, 42 58 Q 58 44, 84 14" fill="none" stroke="#c084fc" strokeWidth="2.2" />
                  <circle cx="62" cy="38" r="3" fill="#22d3ee" className="animate-pulse" />
                  <text x="49" y="75" fill="#c084fc" fontSize="7" fontFamily="monospace" textAnchor="middle">SwiGLU Smooth</text>
                </g>
              </svg>
            </div>

            <div className="bento-card-content">
              <h3>RMSNorm & SwiGLU Gating</h3>
              <p>
                Стандарт топовых мировых LLM. Устранение вычисления среднего в LayerNorm ускоряет вычисления на 15%, а нелинейность SwiGLU обеспечивает чистую сходимость градиентов.
              </p>
              <div className="bento-tags-row">
                <span className="bento-tag violet">Swish Gating</span>
                <span className="bento-tag">Zero Mean Overhead</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export function Corpus() {
  const tokenPairs = [
    { sub: "Все", id: 1405, tone: "cyan" },
    { sub: "␣счаст", id: 5920, tone: "purple" },
    { sub: "ливые", id: 11432, tone: "purple" },
    { sub: "␣семьи", id: 903, tone: "cyan" },
    { sub: "␣похожи", id: 450, tone: "pink" },
    { sub: ",", id: 11, tone: "slate" },
    { sub: "␣каждая", id: 8042, tone: "cyan" },
    { sub: "␣несчаст", id: 3105, tone: "purple" },
    { sub: "лива", id: 1143, tone: "pink" },
  ];

  return (
    <section id="corpus" className="corpus-section-new">
      {/* Decorative background blur elements */}
      <div className="corpus-bg-orb-1"></div>
      <div className="corpus-bg-orb-2"></div>

      <div className="section-shell corpus-grid-container">
        
        {/* Left Column: Description, Telemetry & Datasets */}
        <div className="corpus-left-col">
          <div className="corpus-heading-box">
            <div className="section-kicker-badge corpus-kicker">
              <svg className="kicker-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Датасет • Золотой фонд классики
            </div>
            <h2>Литературный Корпус</h2>
            <div className="corpus-title-divider"></div>
            <p className="corpus-lead">
              Модель не обучается на случайном шуме из интернета. Мы бережно собрали, очистили и токенизировали шедевры классической русской литературы. Это <span className="text-white-highlight">чистый культурный код</span>, превращенный в многомерные тензоры.
            </p>
          </div>

          {/* Corpus Telemetry Summary Strip */}
          <div className="corpus-telemetry-strip">
            <div className="corpus-stat-pill">
              <span className="cstat-val cyan">~47M+</span>
              <span className="cstat-lbl">Всего токенов</span>
            </div>
            <div className="corpus-stat-divider" />
            <div className="corpus-stat-pill">
              <span className="cstat-val purple">32,768</span>
              <span className="cstat-lbl">Словарь Rust BPE</span>
            </div>
            <div className="corpus-stat-divider" />
            <div className="corpus-stat-pill">
              <span className="cstat-val emerald">99.8%</span>
              <span className="cstat-lbl">Чистота текста</span>
            </div>
            <div className="corpus-stat-divider" />
            <div className="corpus-stat-pill">
              <span className="cstat-val pink">UTF-8</span>
              <span className="cstat-lbl">Канонический NFC</span>
            </div>
          </div>
          
          {/* Grid with author datasets */}
          <div className="corpus-authors-grid">
            {corpusAuthors.map((author) => (
              <div key={author.name} className={`glass-card corpus-author-card corpus-author-v2 tone-${author.tone}`}>
                <div className="author-card-header">
                  <div className="author-title-group">
                    <span className="author-name">{author.name}</span>
                    {author.styleTag && (
                      <span className="author-style-tag">{author.styleTag}</span>
                    )}
                  </div>
                  <span className="author-tokens">{author.tokens}</span>
                </div>
                <p className="author-works">{author.works}</p>
                <div className="author-progress-row">
                  <div className="author-progress-bar">
                    <div 
                      className="author-progress-fill" 
                      style={{ width: `${author.progress}%` }}
                    />
                  </div>
                  {author.share && (
                    <span className="author-share-pct">{author.share}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 3-Stage Data Ingestion Pipeline 2.0 */}
        <div className="corpus-pipeline-v2">
          
          {/* Stage 1: Source Text */}
          <div className="glass-card pipeline-block-v2 source-text-block">
            <div className="pipeline-header-v2">
              <div className="pipeline-header-left">
                <span className="pipeline-stage-pill cyan">STAGE 01</span>
                <svg className="pipeline-icon text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="pipeline-label text-cyan">dataset/tolstoy_anna.txt</span>
              </div>
              <span className="pipeline-meta-badge cyan">UTF-8 • Raw Stream</span>
            </div>

            <div className="pipeline-quote-box-v2">
              <span className="quote-line-num">01</span>
              <p className="pipeline-quote-content">
                «Все счастливые семьи похожи друг на друга, каждая несчастлива по-своему.»
              </p>
            </div>

            <div className="pipeline-footer-bar">
              <span>Normalizer: NFC</span>
              <span className="pipeline-dot">•</span>
              <span>Dedup: 100% Clean</span>
              <span className="pipeline-dot">•</span>
              <span className="text-cyan">Л. Н. Толстой, Ч. 1</span>
            </div>
          </div>

          {/* Connector 1 -> 2 */}
          <div className="pipeline-connector">
            <div className="connector-line cyan-to-purple">
              <span className="connector-pulse"></span>
            </div>
            <div className="connector-badge purple">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Rust Rayon BPE v10 • 18.5× быстрее</span>
            </div>
          </div>

          {/* Stage 2: Tokenization */}
          <div className="glass-card pipeline-block-v2 tokenization-block">
            <div className="pipeline-header-v2">
              <div className="pipeline-header-left">
                <span className="pipeline-stage-pill purple">STAGE 02</span>
                <svg className="pipeline-icon text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="pipeline-label text-purple">BPE_Tokenizer.encode()</span>
              </div>
              <span className="pipeline-meta-badge purple">Vocab: 32,768</span>
            </div>

            <div className="pipeline-token-chips">
              {tokenPairs.map((tok, idx) => (
                <div key={`${tok.id}-${idx}`} className={`token-chip-pair ${tok.tone}`}>
                  <span className="tok-str">{tok.sub}</span>
                  <span className="tok-id">{tok.id}</span>
                </div>
              ))}
            </div>

            <div className="pipeline-footer-bar font-mono">
              <span>dtype: torch.int64</span>
              <span className="pipeline-dot">•</span>
              <span className="text-purple">shape: [B, seq_len=2048]</span>
            </div>
          </div>

          {/* Connector 2 -> 3 */}
          <div className="pipeline-connector">
            <div className="connector-line purple-to-pink">
              <span className="connector-pulse delay"></span>
            </div>
            <div className="connector-badge pink">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>Embedding Lookup + RoPE 2D</span>
            </div>
          </div>

          {/* Stage 3: PyTorch Model */}
          <div className="glass-card pipeline-block-v2 model-block">
            <div className="pipeline-header-v2">
              <div className="pipeline-header-left">
                <span className="pipeline-stage-pill pink">STAGE 03</span>
                <svg className="pipeline-icon text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span className="pipeline-label text-pink">model.forward(idx)</span>
              </div>
              <span className="pipeline-meta-badge pink">BF16 • GaLore r=64</span>
            </div>

            <div className="pipeline-code-box-v2">
              <div className="code-row"><span className="code-ln">1</span><span><span className="code-keyword">def</span> <span className="code-func">forward</span>(self, idx, pos):</span></div>
              <div className="code-row"><span className="code-ln">2</span><span className="pl-4">x = self.tok_emb(idx) + self.rope(pos)</span></div>
              <div className="code-row"><span className="code-ln">3</span><span className="pl-4"><span className="code-keyword">for</span> layer <span className="code-keyword">in</span> self.moe_blocks:</span></div>
              <div className="code-row"><span className="code-ln">4</span><span className="pl-8">x = layer(x) <span className="code-comment"># GQA + Top-2 MoE</span></span></div>
              <div className="code-row"><span className="code-ln">5</span><span className="pl-4"><span className="code-keyword">return</span> self.lm_head(self.rms_norm(x))</span></div>
            </div>

            <div className="pipeline-footer-bar font-mono">
              <span>x: [B, T, 768]</span>
              <span className="pipeline-dot">→</span>
              <span className="text-pink">logits: [B, T, 32768]</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
