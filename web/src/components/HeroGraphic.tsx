import { useEffect, useRef } from "react";

export function HeroGraphic() {
  const physicsWrapperRef = useRef<HTMLDivElement>(null);
  const tetherGroupRef = useRef<SVGGElement>(null);
  const tetherLineRef = useRef<SVGPathElement>(null);
  const tetherEndRef = useRef<SVGCircleElement>(null);
  const tetherEndRingRef = useRef<SVGCircleElement>(null);
  const coreGlowStopRef = useRef<SVGStopElement>(null);
  const panel1Ref = useRef<SVGGElement>(null);
  const panel2Ref = useRef<SVGGElement>(null);
  const panel3Ref = useRef<SVGGElement>(null);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let smoothedDx = 0;
    let smoothedDy = 0;
    let smNormX = 0;
    let smNormY = 0;
    let animFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animateSVG = () => {
      const wrapper = physicsWrapperRef.current;
      if (!wrapper) {
        animFrameId = requestAnimationFrame(animateSVG);
        return;
      }

      const rect = wrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rawDx = centerX - mouseX;
      const rawDy = centerY - mouseY;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

      // Physics of elastic tension
      const maxDist = 450;
      let force = Math.max(0, 1 - dist / maxDist);
      force = Math.pow(force, 1.5);

      const maxDisplacement = 60;
      const targetDx = dist > 0 ? (rawDx / dist) * force * maxDisplacement : 0;
      const targetDy = dist > 0 ? (rawDy / dist) * force * maxDisplacement : 0;

      smoothedDx += (targetDx - smoothedDx) * 0.1;
      smoothedDy += (targetDy - smoothedDy) * 0.1;

      const stretchVelocity = Math.sqrt(smoothedDx * smoothedDx + smoothedDy * smoothedDy);
      const angle = Math.atan2(smoothedDy, smoothedDx);

      const scaleX = 1 + stretchVelocity * 0.003;
      const scaleY = 1 - stretchVelocity * 0.001;

      // 3D Tilt calculations
      const normX = (mouseX / window.innerWidth - 0.5) * 2;
      const normY = (mouseY / window.innerHeight - 0.5) * 2;
      smNormX += (normX - smNormX) * 0.1;
      smNormY += (normY - smNormY) * 0.1;

      const tiltX = smNormY * -20;
      const tiltY = smNormX * 20;

      // Combine displacement, tilt, and stretch
      wrapper.style.transform = `perspective(1000px) translate3d(${smoothedDx}px, ${smoothedDy}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${angle}rad) scale(${scaleX}, ${scaleY}) rotate(${-angle}rad)`;

      // Interactive tether line and core glow
      const tetherGroup = tetherGroupRef.current;
      const tetherLine = tetherLineRef.current;
      const tetherEnd = tetherEndRef.current;
      const tetherEndRing = tetherEndRingRef.current;
      const coreGlowStop = coreGlowStopRef.current;

      if (dist < 400 && dist > 20) {
        if (tetherGroup) tetherGroup.style.opacity = String(force);

        const svgScale = 300 / rect.width;
        const localMouseX = 150 - rawDx * svgScale;
        const localMouseY = 150 - rawDy * svgScale;

        const cpX = 150 + (localMouseX - 150) * 0.5;
        const cpY = 150;

        if (tetherLine) {
          tetherLine.setAttribute("d", `M150,150 Q${cpX},${cpY} ${localMouseX},${localMouseY}`);
        }
        if (tetherEnd) {
          tetherEnd.setAttribute("cx", String(localMouseX));
          tetherEnd.setAttribute("cy", String(localMouseY));
        }
        if (tetherEndRing) {
          tetherEndRing.setAttribute("cx", String(localMouseX));
          tetherEndRing.setAttribute("cy", String(localMouseY));
        }

        if (coreGlowStop) {
          coreGlowStop.setAttribute("stop-opacity", (0.2 + force * 0.5).toFixed(2));
          coreGlowStop.setAttribute("stop-color", force > 0.5 ? "#06b6d4" : "#7e22ce");
        }
      } else {
        if (tetherGroup) tetherGroup.style.opacity = "0";
        if (coreGlowStop) {
          coreGlowStop.setAttribute("stop-opacity", "0.2");
          coreGlowStop.setAttribute("stop-color", "#7e22ce");
        }
      }

      // Parallax inner panels
      const panel1 = panel1Ref.current;
      const panel2 = panel2Ref.current;
      const panel3 = panel3Ref.current;
      if (panel1) panel1.style.transform = `translate(${smNormX * -10}px, ${smNormY * -10}px)`;
      if (panel2) panel2.style.transform = `translate(${smNormX * -15}px, ${smNormY * -15}px)`;
      if (panel3) panel3.style.transform = `translate(${smNormX * -5}px, ${smNormY * -5}px)`;

      animFrameId = requestAnimationFrame(animateSVG);
    };

    animateSVG();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <div
      ref={physicsWrapperRef}
      id="hero-physics-wrapper"
      className="hero-physics-wrapper"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      <svg
        className="hero-main-svg animate-float overflow-visible"
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="core-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop ref={coreGlowStopRef} id="core-glow-stop" offset="40%" stopColor="#7e22ce" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#030305" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="link-grad-1" x1="50" y1="150" x2="150" y2="140">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="link-grad-2" x1="250" y1="150" x2="150" y2="170">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <path id="textRing" d="M 150, 150 m -110, 0 a 110,110 0 1,1 220,0 a 110,110 0 1,1 -220,0" />
        </defs>

        <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
          <line x1="150" y1="10" x2="150" y2="290" />
          <line x1="10" y1="150" x2="290" y2="150" />
          <line x1="51" y1="51" x2="249" y2="249" />
          <line x1="51" y1="249" x2="249" y2="51" />
          <circle cx="150" cy="150" r="130" />
          <circle cx="150" cy="150" r="90" strokeDasharray="2 4" />
          <circle cx="150" cy="150" r="50" />
        </g>

        <circle cx="150" cy="150" r="80" fill="url(#core-glow)" className="animate-pulse-slow" />

        <text
          className="animate-spin-reverse text-ring-text"
          style={{ transformOrigin: "150px 150px", animationDuration: "90s" }}
        >
          <textPath href="#textRing" startOffset="0%">
            ВОЙНА И МИР • АННА КАРЕНИНА • ПРЕСТУПЛЕНИЕ И НАКАЗАНИЕ • МАСТЕР И МАРГАРИТА • БРАТЬЯ КАРАМАЗОВЫ • ИДИОТ • ДАР • ЛОЛИТА • МЕРТВЫЕ ДУШИ •
          </textPath>
        </text>

        <g className="animate-pulse-slow">
          <circle cx="50" cy="130" r="4" fill="#06b6d4" filter="url(#glow)" />
          <circle cx="35" cy="150" r="2.5" fill="#7e22ce" />
          <circle cx="65" cy="165" r="3" fill="#ec4899" filter="url(#glow)" />
          <line x1="35" y1="150" x2="50" y2="130" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
          <line x1="50" y1="130" x2="65" y2="165" stroke="rgba(236,72,153,0.4)" strokeWidth="1" />
          <line x1="35" y1="150" x2="65" y2="165" stroke="rgba(126,34,206,0.3)" strokeWidth="0.5" />
          <path d="M50,130 Q100,110 120,125" fill="none" stroke="url(#link-grad-1)" strokeWidth="1.5" strokeDasharray="3 5" className="animate-dash-flow" />
          <path d="M65,165 Q110,180 120,155" fill="none" stroke="url(#link-grad-1)" strokeWidth="1" strokeDasharray="2 4" className="animate-dash-flow" style={{ animationDelay: "-0.5s" }} />
        </g>

        <g className="animate-pulse-slow" style={{ animationDelay: "-2s" }}>
          <circle cx="260" cy="140" r="3" fill="#ec4899" />
          <circle cx="240" cy="175" r="4.5" fill="#7e22ce" filter="url(#glow)" />
          <circle cx="270" cy="180" r="2" fill="#06b6d4" />
          <line x1="260" y1="140" x2="240" y2="175" stroke="rgba(126,34,206,0.5)" strokeWidth="1" />
          <line x1="240" y1="175" x2="270" y2="180" stroke="rgba(6,182,212,0.3)" strokeWidth="0.5" />
          <path d="M240,175 Q190,190 180,155" fill="none" stroke="url(#link-grad-2)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-flow" style={{ animationDirection: "reverse" }} />
        </g>

        <g className="animate-rotate-slow" style={{ transformOrigin: "150px 150px", animationDuration: "40s" }}>
          <circle cx="150" cy="150" r="118" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" strokeDasharray="1 8" />
          <circle cx="150" cy="32" r="3" fill="#06b6d4" filter="url(#glow)" />
        </g>

        <g className="animate-float" style={{ animationDuration: "8s" }}>
          <line x1="150" y1="195" x2="150" y2="85" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="100" y1="170" x2="100" y2="110" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <line x1="200" y1="170" x2="200" y2="110" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

          <polygon points="150,195 200,170 150,145 100,170" fill="rgba(6,182,212,0.08)" stroke="#06b6d4" strokeWidth="1.2" />
          <path d="M100,170 L100,174 L150,199 L200,174 L200,170 M150,195 L150,199" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="150" cy="170" r="2" fill="#06b6d4" filter="url(#glow)" />
          <circle cx="130" cy="180" r="1.5" fill="#fff" opacity="0.5" />
          <circle cx="170" cy="160" r="1.5" fill="#fff" opacity="0.5" />

          <polygon points="150,165 200,140 150,115 100,140" fill="rgba(126,34,206,0.15)" stroke="#7e22ce" strokeWidth="1.5" />
          <path d="M100,140 L100,144 L150,169 L200,144 L200,140 M150,165 L150,169" stroke="#7e22ce" strokeWidth="1" fill="none" opacity="0.5" />
          <ellipse cx="150" cy="140" rx="12" ry="6" fill="rgba(255,255,255,0.1)" stroke="#fff" strokeWidth="0.5" />
          <circle cx="150" cy="140" r="4" fill="#fff" filter="url(#glow-strong)" className="animate-pulse" />
          <line x1="140" y1="135" x2="160" y2="145" stroke="#ec4899" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="160" y1="135" x2="140" y2="145" stroke="#06b6d4" strokeWidth="1" strokeDasharray="1 1" />

          <polygon points="150,135 200,110 150,85 100,110" fill="rgba(236,72,153,0.08)" stroke="#ec4899" strokeWidth="1.2" />
          <path d="M100,110 L100,114 L150,139 L200,114 L200,110 M150,135 L150,139" stroke="#ec4899" strokeWidth="1" fill="none" opacity="0.4" />

          <g className="animate-float" style={{ animationDuration: "4s" }}>
            <polygon points="150,65 165,57.5 150,50 135,57.5" fill="rgba(255,255,255,0.8)" stroke="#fff" strokeWidth="0.5" filter="url(#glow)" />
            <polygon points="150,65 165,57.5 165,60 150,67.5" fill="rgba(200,200,200,0.8)" />
            <polygon points="150,65 135,57.5 135,60 150,67.5" fill="rgba(150,150,150,0.8)" />
            <line x1="150" y1="68" x2="150" y2="85" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="2 2" className="animate-dash-flow" />
          </g>
        </g>

        <g ref={tetherGroupRef} id="tether-group" style={{ opacity: 0, transition: "opacity 0.4s ease" }}>
          <path ref={tetherLineRef} id="tether-line" d="M150,150 Q150,150 150,150" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 6" className="animate-dash-flow" filter="url(#glow)" />
          <circle ref={tetherEndRef} id="tether-end" cx="150" cy="150" r="3" fill="#fff" filter="url(#glow-strong)" />
          <circle ref={tetherEndRingRef} id="tether-end-ring" cx="150" cy="150" r="8" fill="none" stroke="#06b6d4" strokeWidth="1" className="animate-pulse" />
        </g>

        <g className="animate-float" style={{ animationDelay: "-1.5s" }}>
          <g ref={panel1Ref} id="ui-panel-1" className="ui-panel" style={{ transition: "transform 0.1s ease-out" }}>
            <rect x="185" y="80" width="105" height="28" rx="4" fill="rgba(20,20,30,0.85)" stroke="rgba(126, 34, 206, 0.4)" strokeWidth="1" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))" />
            <path d="M 185 94 L 175 100 L 185 106" fill="none" stroke="rgba(126, 34, 206, 0.4)" strokeWidth="1" />
            <text x="193" y="93" fontFamily="monospace" fontSize="6" fill="#c084fc" fontWeight="bold">Self-Attention</text>
            <text x="193" y="102" fontFamily="monospace" fontSize="5" fill="#e2e8f0">Attention(Q,K,V) =</text>
            <text x="193" y="108" fontFamily="monospace" fontSize="5" fill="#67e8f9">softmax(QKᵀ/√d)V</text>
          </g>
        </g>

        <g className="animate-float" style={{ animationDelay: "-3.5s" }}>
          <g ref={panel2Ref} id="ui-panel-2" className="ui-panel" style={{ transition: "transform 0.1s ease-out" }}>
            <rect x="10" y="90" width="75" height="32" rx="4" fill="rgba(20,20,30,0.85)" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))" />
            <path d="M 85 106 L 95 112 L 85 118" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
            <text x="16" y="102" fontFamily="monospace" fontSize="6" fill="#67e8f9" fontWeight="bold">TRAINING STATS</text>
            <text x="16" y="112" fontFamily="monospace" fontSize="5" fill="#94a3b8">Loss: <tspan fill="#4ade80">0.832</tspan></text>
            <text x="16" y="118" fontFamily="monospace" fontSize="5" fill="#94a3b8">Step: <tspan fill="#facc15">14,200</tspan></text>
            <rect x="16" y="122" width="60" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
            <rect x="16" y="122" width="40" height="2" rx="1" fill="#06b6d4" />
          </g>
        </g>

        <g className="animate-float" style={{ animationDelay: "-5s" }}>
          <g ref={panel3Ref} id="ui-panel-3" className="ui-panel" style={{ transition: "transform 0.1s ease-out" }}>
            <rect x="175" y="210" width="90" height="22" rx="4" fill="rgba(20,20,30,0.85)" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="1" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))" />
            <path d="M 175 221 L 165 210 L 175 200" fill="none" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="1" />
            <text x="182" y="220" fontFamily="monospace" fontSize="5" fill="#f472b6" fontWeight="bold">BPE Tokenizer</text>
            <text x="182" y="227" fontFamily="monospace" fontSize="5" fill="#cbd5e1">idx: [504, 219, 9031]</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
