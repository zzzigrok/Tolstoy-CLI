export function HeroGraphic() {
  return (
    <div className="hero-graphic" aria-hidden="true">
      <div className="orbit orbit-outer" />
      <div className="orbit orbit-inner" />
      <svg className="model-diagram" viewBox="0 0 520 520" fill="none">
        <defs>
          <linearGradient id="layer-cyan" x1="120" y1="210" x2="400" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10d7f0" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="layer-rose" x1="160" y1="120" x2="390" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f35bbd" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <filter id="diagram-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="260" cy="260" r="188" stroke="#0ea5b7" strokeOpacity=".28" strokeDasharray="4 12" />
        <circle cx="260" cy="260" r="132" stroke="#7c3aed" strokeOpacity=".22" />
        <path d="M260 72v376M72 260h376" stroke="#ffffff" strokeOpacity=".06" />

        <path d="M260 128 392 188 260 248 128 188 260 128Z" stroke="url(#layer-rose)" strokeWidth="3" filter="url(#diagram-glow)" />
        <path d="M260 212 392 272 260 332 128 272 260 212Z" stroke="url(#layer-cyan)" strokeWidth="3" filter="url(#diagram-glow)" />
        <path d="M128 188v84M392 188v84M260 248v84" stroke="#ffffff" strokeOpacity=".18" strokeDasharray="8 8" />

        <g className="diagram-node">
          <circle cx="112" cy="300" r="9" fill="#10d7f0" />
          <circle cx="112" cy="300" r="20" stroke="#10d7f0" strokeOpacity=".25" />
        </g>
        <g className="diagram-node delay">
          <circle cx="406" cy="145" r="8" fill="#10d7f0" />
          <circle cx="406" cy="145" r="18" stroke="#10d7f0" strokeOpacity=".25" />
        </g>
        <g className="diagram-node">
          <circle cx="414" cy="324" r="9" fill="#ef4eb8" />
          <circle cx="414" cy="324" r="20" stroke="#ef4eb8" strokeOpacity=".25" />
        </g>

        <path d="M112 300c54-64 96-42 148-28 56 14 94 6 154 52" stroke="#ef4eb8" strokeWidth="2" strokeDasharray="8 10" />
        <path d="M406 145c-62 22-100 66-146 103-48 39-86 57-148 52" stroke="#10d7f0" strokeWidth="2" strokeDasharray="8 10" />
      </svg>

      <div className="training-card card-left">
        <span>training</span>
        <strong>loss: 0.832</strong>
        <em>step 14,280</em>
      </div>
      <div className="training-card card-right">
        <span>self-attention</span>
        <strong>softmax(QKᵀ/√d)</strong>
        <em>layer 12</em>
      </div>
    </div>
  );
}
