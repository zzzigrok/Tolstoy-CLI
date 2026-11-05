import { useState } from "react";

export function HeroGraphic() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  return (
    <div className="hero-graphic-container">
      <div className="hero-graphic-glow"></div>
      <div className="hero-physics-wrapper">
        <svg
          className="hero-main-svg"
          viewBox="0 0 560 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Ambient Core Glows */}
            <radialGradient id="hero-core-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.14" />
              <stop offset="75%" stopColor="#ec4899" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#030305" stopOpacity="0" />
            </radialGradient>

            {/* Isometric Slab Gradients */}
            <linearGradient id="slab-cyan" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="slab-blue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="slab-purple" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="slab-pink" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#db2777" stopOpacity="0.08" />
            </linearGradient>

            {/* Vertical Data Beam Gradient */}
            <linearGradient id="beam-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" />
            </linearGradient>

            {/* HUD Panel Background */}
            <linearGradient id="hud-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#060913" stopOpacity="0.96" />
            </linearGradient>

            {/* Glow Filters */}
            <filter id="hero-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hero-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Circular Text Path for Literary Corpus */}
            <path
              id="heroTextRing"
              d="M 280, 265 m -190, 0 a 190,190 0 1,1 380,0 a 190,190 0 1,1 -380,0"
            />
            <path
              id="heroInnerRing"
              d="M 280, 265 m -148, 0 a 148,148 0 1,1 296,0 a 148,148 0 1,1 -296,0"
            />
          </defs>

          {/* ==============================================================
              1. BACKGROUND RADAR GRID & ORBITAL RINGS
              ============================================================== */}
          <circle cx="280" cy="265" r="215" fill="url(#hero-core-glow)" />

          <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
            <line x1="280" y1="25" x2="280" y2="495" />
            <line x1="40" y1="265" x2="520" y2="265" />
            <line x1="110" y1="95" x2="450" y2="435" stroke="rgba(255,255,255,0.03)" />
            <line x1="110" y1="435" x2="450" y2="95" stroke="rgba(255,255,255,0.03)" />
            <circle cx="280" cy="265" r="210" stroke="rgba(34,211,238,0.1)" strokeDasharray="3 9" />
            <circle cx="280" cy="265" r="168" stroke="rgba(192,132,252,0.12)" />
            <circle cx="280" cy="265" r="122" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" />
          </g>

          {/* Outer Rotating Literary Corpus Ring */}
          <text
            className="hero-orbit-text-ccw"
            fill="rgba(148, 163, 184, 0.38)"
            fontSize="8.5"
            fontFamily="monospace"
            letterSpacing="2.6px"
          >
            <textPath href="#heroTextRing" startOffset="0%">
              ВОЙНА И МИР • АННА КАРЕНИНА • ПРЕСТУПЛЕНИЕ И НАКАЗАНИЕ • МАСТЕР И МАРГАРИТА • БРАТЬЯ КАРАМАЗОВЫ • ИДИОТ •
            </textPath>
          </text>

          {/* Inner Rotating Math & SOTA Ring */}
          <text
            className="hero-orbit-text-cw"
            fill="rgba(34, 211, 238, 0.25)"
            fontSize="7.5"
            fontFamily="monospace"
            letterSpacing="3px"
          >
            <textPath href="#heroInnerRing" startOffset="0%">
              GALORE SVD R=64 • MUON NS-5 ORTHO • SPARSE MOE TOP-2 • FLASH-ATTN 2 • XQUANT INT8 • RUST BPE V10 •
            </textPath>
          </text>

          {/* Orbiting Satellite Nodes */}
          <g className="hero-orbit-text-cw">
            <circle cx="280" cy="97" r="4" fill="#22d3ee" filter="url(#hero-glow)" />
            <circle cx="280" cy="433" r="3.5" fill="#c084fc" filter="url(#hero-glow)" />
          </g>

          {/* ==============================================================
              2. CENTRAL 4-LAYER ISOMETRIC 3D TRANSFORMER STACK
              ============================================================== */}
          <g className="hero-iso-stack">
            {/* Vertical Laser Bus Pillars connecting the 4 layers */}
            <line x1="190" y1="360" x2="190" y2="150" stroke="rgba(34,211,238,0.25)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="370" y1="360" x2="370" y2="150" stroke="rgba(192,132,252,0.25)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="280" y1="405" x2="280" y2="105" stroke="url(#beam-grad)" strokeWidth="2.5" strokeDasharray="4 4" className="animate-dash-flow" />

            {/* ------------------------------------------------------------
                LAYER 1 (Bottom): Rust BPE v10 + RoPE Positional Embeddings
               ------------------------------------------------------------ */}
            <g
              className="hero-layer-group"
              onMouseEnter={() => setActiveLayer(1)}
              onMouseLeave={() => setActiveLayer(null)}
              style={{ opacity: activeLayer && activeLayer !== 1 ? 0.55 : 1 }}
            >
              {/* 3D Slab Shadow/Extrusion */}
              <polygon
                points="190,360 280,405 370,360 370,370 280,415 190,370"
                fill="rgba(8, 145, 178, 0.35)"
                stroke="#06b6d4"
                strokeWidth="1"
              />
              {/* Main Isometric Diamond */}
              <polygon
                points="280,315 370,360 280,405 190,360"
                fill="url(#slab-cyan)"
                stroke="#22d3ee"
                strokeWidth={activeLayer === 1 ? "2.5" : "1.6"}
                filter={activeLayer === 1 ? "url(#hero-glow)" : undefined}
              />
              {/* Internal Token Embedding Matrix Lines */}
              <line x1="235" y1="337.5" x2="325" y2="382.5" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
              <line x1="235" y1="382.5" x2="325" y2="337.5" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
              {/* Glowing Token Nodes on Layer 1 */}
              <circle cx="250" cy="360" r="3" fill="#22d3ee" filter="url(#hero-glow)" />
              <circle cx="280" cy="375" r="3.5" fill="#fff" filter="url(#hero-glow)" />
              <circle cx="310" cy="360" r="3" fill="#22d3ee" filter="url(#hero-glow)" />
              <circle cx="280" cy="345" r="2.5" fill="#67e8f9" />
              <text x="280" y="396" fill="#a5f3fc" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                L1: BPE + RoPE
              </text>
            </g>

            {/* ------------------------------------------------------------
                LAYER 2 (Lower-Mid): Grouped-Query Attention (GQA + Flash-2)
               ------------------------------------------------------------ */}
            <g
              className="hero-layer-group"
              onMouseEnter={() => setActiveLayer(2)}
              onMouseLeave={() => setActiveLayer(null)}
              style={{ opacity: activeLayer && activeLayer !== 2 ? 0.55 : 1 }}
            >
              {/* 3D Extrusion */}
              <polygon
                points="190,300 280,345 370,300 370,310 280,355 190,310"
                fill="rgba(37, 99, 235, 0.35)"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              {/* Main Isometric Diamond */}
              <polygon
                points="280,255 370,300 280,345 190,300"
                fill="url(#slab-blue)"
                stroke="#60a5fa"
                strokeWidth={activeLayer === 2 ? "2.5" : "1.6"}
                filter={activeLayer === 2 ? "url(#hero-glow)" : undefined}
              />
              {/* GQA Attention Web */}
              <polygon
                points="280,272 332,300 280,328 228,300"
                fill="rgba(96,165,250,0.12)"
                stroke="rgba(147,197,253,0.45)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line x1="228" y1="300" x2="332" y2="300" stroke="#60a5fa" strokeWidth="1.2" opacity="0.6" />
              <circle cx="280" cy="300" r="5" fill="#60a5fa" filter="url(#hero-glow)" />
              <circle cx="248" cy="300" r="3" fill="#93c5fd" />
              <circle cx="312" cy="300" r="3" fill="#93c5fd" />
              <text x="280" y="336" fill="#bfdbfe" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                L2: GQA FLASH-2
              </text>
            </g>

            {/* ------------------------------------------------------------
                LAYER 3 (Upper-Mid): Sparse MoE (8x Experts • Top-2 Router)
               ------------------------------------------------------------ */}
            <g
              className="hero-layer-group"
              onMouseEnter={() => setActiveLayer(3)}
              onMouseLeave={() => setActiveLayer(null)}
              style={{ opacity: activeLayer && activeLayer !== 3 ? 0.55 : 1 }}
            >
              {/* 3D Extrusion */}
              <polygon
                points="190,238 280,283 370,238 370,248 280,293 190,248"
                fill="rgba(126, 34, 206, 0.4)"
                stroke="#9333ea"
                strokeWidth="1"
              />
              {/* Main Isometric Diamond */}
              <polygon
                points="280,193 370,238 280,283 190,238"
                fill="url(#slab-purple)"
                stroke="#c084fc"
                strokeWidth={activeLayer === 3 ? "2.6" : "1.8"}
                filter={activeLayer === 3 ? "url(#hero-glow)" : undefined}
              />
              {/* Central Neural Core Ring */}
              <ellipse cx="280" cy="238" rx="28" ry="14" fill="rgba(192,132,252,0.18)" stroke="#e9d5ff" strokeWidth="1.2" />
              <ellipse cx="280" cy="238" rx="16" ry="8" fill="rgba(255,255,255,0.15)" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="280" cy="238" r="5.5" fill="#fff" filter="url(#hero-glow-strong)" className="animate-pulse" />

              {/* Active Top-2 Expert Nodes */}
              <circle cx="235" cy="238" r="4.5" fill="#c084fc" stroke="#fff" strokeWidth="1" filter="url(#hero-glow)" />
              <circle cx="325" cy="238" r="4.5" fill="#22d3ee" stroke="#fff" strokeWidth="1" filter="url(#hero-glow)" />
              <line x1="240" y1="238" x2="274" y2="238" stroke="#c084fc" strokeWidth="1.8" />
              <line x1="286" y1="238" x2="320" y2="238" stroke="#22d3ee" strokeWidth="1.8" />

              <text x="280" y="274" fill="#e9d5ff" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                L3: SPARSE MoE (TOP-2)
              </text>
            </g>

            {/* ------------------------------------------------------------
                LAYER 4 (Top): Speculative MTP + GaLore / Muon Output Head
               ------------------------------------------------------------ */}
            <g
              className="hero-layer-group"
              onMouseEnter={() => setActiveLayer(4)}
              onMouseLeave={() => setActiveLayer(null)}
              style={{ opacity: activeLayer && activeLayer !== 4 ? 0.55 : 1 }}
            >
              {/* 3D Extrusion */}
              <polygon
                points="190,176 280,221 370,176 370,186 280,231 190,186"
                fill="rgba(219, 39, 119, 0.35)"
                stroke="#ec4899"
                strokeWidth="1"
              />
              {/* Main Isometric Diamond */}
              <polygon
                points="280,131 370,176 280,221 190,176"
                fill="url(#slab-pink)"
                stroke="#f472b6"
                strokeWidth={activeLayer === 4 ? "2.5" : "1.6"}
                filter={activeLayer === 4 ? "url(#hero-glow)" : undefined}
              />
              {/* Speculative Parallel Verification Nodes */}
              <polygon points="280,150 320,170 280,190 240,170" fill="rgba(244,114,182,0.16)" stroke="#fbcfe8" strokeWidth="1" />
              <circle cx="262" cy="172" r="3.5" fill="#34d399" filter="url(#hero-glow)" />
              <circle cx="280" cy="172" r="3.5" fill="#34d399" filter="url(#hero-glow)" />
              <circle cx="298" cy="172" r="3.5" fill="#34d399" filter="url(#hero-glow)" />
              <text x="280" y="212" fill="#fbcfe8" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                L4: MTP HEAD (2.5×)
              </text>
            </g>

            {/* ------------------------------------------------------------
                APEX CROWN CRYSTAL: Decoded Literary Output Stream
               ------------------------------------------------------------ */}
            <g className="hero-apex-crystal">
              <polygon
                points="280,68 310,84 280,100 250,84"
                fill="rgba(255,255,255,0.9)"
                stroke="#22d3ee"
                strokeWidth="1.5"
                filter="url(#hero-glow-strong)"
              />
              <polygon points="250,84 280,100 280,108 250,92" fill="#67e8f9" opacity="0.85" />
              <polygon points="310,84 280,100 280,108 310,92" fill="#c084fc" opacity="0.85" />

              {/* Floating Output Literary Token Pill above Apex */}
              <rect x="205" y="28" width="150" height="24" rx="12" fill="rgba(9,13,26,0.9)" stroke="rgba(34,211,238,0.5)" strokeWidth="1.2" />
              <circle cx="220" cy="40" r="3.5" fill="#34d399" className="animate-pulse" />
              <text x="286" y="43.5" fill="#f8fafc" fontSize="9.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                «На краю дороги...»
              </text>
            </g>

            {/* Rising Data Particles along the Central Spine */}
            <circle cx="280" cy="380" r="3.5" fill="#22d3ee" filter="url(#hero-glow)">
              <animate attributeName="cy" values="390;105" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="380" r="3.5" fill="#f472b6" filter="url(#hero-glow)">
              <animate attributeName="cy" values="390;105" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* ==============================================================
              3. FOUR FLOATING TELEMETRY HUD PANELS (ZERO CLIPPING)
              ============================================================== */}

          {/* HUD 1 (Top-Left): TRAINING & GALORE/MUON STATS */}
          <g
            className="hero-hud-card"
            onMouseEnter={() => setActiveLayer(3)}
            onMouseLeave={() => setActiveLayer(null)}
          >
            {/* Connector Line to Stack */}
            <polyline
              points="168,122 195,122 225,165"
              fill="none"
              stroke="rgba(34,211,238,0.45)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <circle cx="225" cy="165" r="3" fill="#22d3ee" />

            <rect
              x="14"
              y="82"
              width="154"
              height="78"
              rx="10"
              fill="url(#hud-bg)"
              stroke="rgba(34, 211, 238, 0.45)"
              strokeWidth="1.2"
            />
            {/* Top Accent Bar */}
            <rect x="24" y="82" width="48" height="2.5" rx="1" fill="#22d3ee" />
            <circle cx="26" cy="96" r="3" fill="#34d399" className="animate-pulse" />
            <text x="34" y="99" fontFamily="monospace" fontSize="8.5" fill="#67e8f9" fontWeight="bold" letterSpacing="0.5px">
              TRAINING TELEMETRY
            </text>

            <text x="24" y="115" fontFamily="monospace" fontSize="8.5" fill="#94a3b8">
              Loss: <tspan fill="#34d399" fontWeight="bold">0.832</tspan> • Step: <tspan fill="#facc15" fontWeight="bold">14.2k</tspan>
            </text>
            <text x="24" y="128" fontFamily="monospace" fontSize="8" fill="#cbd5e1">
              Opt: <tspan fill="#22d3ee">GaLore r=64</tspan> + <tspan fill="#34d399">Muon</tspan>
            </text>

            {/* Mini Loss Curve Sparkline */}
            <path
              d="M 24 148 Q 45 133, 68 142 T 115 147 L 154 149"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
            <rect x="24" y="151" width="132" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
            <rect x="24" y="151" width="104" height="3" rx="1.5" fill="#22d3ee" />
          </g>

          {/* HUD 2 (Top-Right): SELF-ATTENTION (GQA + FLASH-2) */}
          <g
            className="hero-hud-card"
            onMouseEnter={() => setActiveLayer(2)}
            onMouseLeave={() => setActiveLayer(null)}
          >
            {/* Connector Line to Layer 2 */}
            <polyline
              points="392,135 368,135 342,278"
              fill="none"
              stroke="rgba(192,132,252,0.45)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <circle cx="342" cy="278" r="3" fill="#c084fc" />

            <rect
              x="392"
              y="92"
              width="154"
              height="74"
              rx="10"
              fill="url(#hud-bg)"
              stroke="rgba(192, 132, 252, 0.45)"
              strokeWidth="1.2"
            />
            <rect x="404" y="92" width="48" height="2.5" rx="1" fill="#c084fc" />
            <text x="404" y="109" fontFamily="monospace" fontSize="8.5" fill="#c084fc" fontWeight="bold">
              GQA + FLASH-ATTN 2
            </text>
            <text x="404" y="124" fontFamily="monospace" fontSize="8" fill="#e2e8f0">
              Attn(Q,K,V) =
            </text>
            <text x="404" y="137" fontFamily="monospace" fontSize="8.5" fill="#67e8f9" fontWeight="bold">
              softmax(QKᵀ/√d)V
            </text>
            <rect x="404" y="144" width="130" height="14" rx="4" fill="rgba(192,132,252,0.14)" />
            <text x="469" y="154" fontFamily="monospace" fontSize="7.5" fill="#e9d5ff" textAnchor="middle" fontWeight="bold">
              KV-Cache INT8: -75% VRAM
            </text>
          </g>

          {/* HUD 3 (Bottom-Left): SPARSE MoE ROUTER */}
          <g
            className="hero-hud-card"
            onMouseEnter={() => setActiveLayer(3)}
            onMouseLeave={() => setActiveLayer(null)}
          >
            {/* Connector Line to Layer 3 */}
            <polyline
              points="166,385 190,385 215,252"
              fill="none"
              stroke="rgba(192,132,252,0.45)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <circle cx="215" cy="252" r="3" fill="#c084fc" />

            <rect
              x="14"
              y="348"
              width="152"
              height="70"
              rx="10"
              fill="url(#hud-bg)"
              stroke="rgba(168, 85, 247, 0.4)"
              strokeWidth="1.2"
            />
            <rect x="24" y="348" width="44" height="2.5" rx="1" fill="#a855f7" />
            <text x="24" y="365" fontFamily="monospace" fontSize="8.5" fill="#d8b4fe" fontWeight="bold">
              SPARSE MoE ROUTER
            </text>
            <text x="24" y="380" fontFamily="monospace" fontSize="8" fill="#cbd5e1">
              Active: <tspan fill="#34d399" fontWeight="bold">Exp #1, #3</tspan> (Top-2)
            </text>
            {/* 8 Mini Expert Activity Bars */}
            <g transform="translate(24, 389)">
              {[
                { h: 16, active: true },
                { h: 6, active: false },
                { h: 18, active: true },
                { h: 5, active: false },
                { h: 7, active: false },
                { h: 4, active: false },
                { h: 8, active: false },
                { h: 5, active: false },
              ].map((bar, idx) => (
                <rect
                  key={idx}
                  x={idx * 16}
                  y={18 - bar.h}
                  width="11"
                  height={bar.h}
                  rx="2"
                  fill={bar.active ? "#c084fc" : "rgba(255,255,255,0.12)"}
                />
              ))}
            </g>
          </g>

          {/* HUD 4 (Bottom-Right): RUST BPE v10 TOKENIZER */}
          <g
            className="hero-hud-card"
            onMouseEnter={() => setActiveLayer(1)}
            onMouseLeave={() => setActiveLayer(null)}
          >
            {/* Connector Line to Layer 1 */}
            <polyline
              points="392,385 365,385 340,368"
              fill="none"
              stroke="rgba(244,114,182,0.45)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <circle cx="340" cy="368" r="3" fill="#f472b6" />

            <rect
              x="392"
              y="348"
              width="154"
              height="70"
              rx="10"
              fill="url(#hud-bg)"
              stroke="rgba(244, 114, 182, 0.45)"
              strokeWidth="1.2"
            />
            <rect x="404" y="348" width="44" height="2.5" rx="1" fill="#f472b6" />
            <text x="404" y="365" fontFamily="monospace" fontSize="8.5" fill="#f472b6" fontWeight="bold">
              RUST BPE v10 • 18.5×
            </text>
            <text x="404" y="380" fontFamily="monospace" fontSize="8" fill="#e2e8f0">
              idx: <tspan fill="#67e8f9">[1405, 892, 5920]</tspan>
            </text>
            <rect x="404" y="390" width="130" height="16" rx="4" fill="rgba(244,114,182,0.12)" stroke="rgba(244,114,182,0.3)" strokeWidth="0.8" />
            <text x="469" y="401" fontFamily="monospace" fontSize="7.5" fill="#fbcfe8" textAnchor="middle">
              Rayon Parallel: 145 MB/s
            </text>
          </g>

          {/* Bottom Interactive Hint Pill */}
          <g transform="translate(175, 468)">
            <rect x="0" y="0" width="210" height="24" rx="12" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.1)" />
            <text x="105" y="15" fontFamily="monospace" fontSize="8" fill="#94a3b8" textAnchor="middle">
              {activeLayer === 1
                ? "▶ Слой 1: Rust BPE v10 + RoPE"
                : activeLayer === 2
                ? "▶ Слой 2: Grouped-Query Attention"
                : activeLayer === 3
                ? "▶ Слой 3: Sparse MoE (8 Экспертов)"
                : activeLayer === 4
                ? "▶ Слой 4: Speculative MTP (2.5x)"
                : "Наведите на слои ядра v7 Pro"}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
