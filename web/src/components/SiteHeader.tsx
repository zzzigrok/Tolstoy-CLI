import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GitHubIcon } from "./Icons";
import { navItems } from "../data/content";

const githubUrl = "https://github.com/zzzigrok/Tolstoy-CLI";

type SiteHeaderProps = {
  menuOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
};

/**
 * Floating glass header:
 * - сжимается в «пилюлю» при прокрутке;
 * - подсвечивает активную секцию (IntersectionObserver) скользящим индикатором;
 * - показывает прогресс чтения страницы;
 * - полноэкранное мобильное меню с блокировкой прокрутки и закрытием по Esc.
 */
export function SiteHeader({ menuOpen, onToggle, onNavigate }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>("");
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Scroll state + reading progress
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(y > 24);
        setProgress(max > 0 ? Math.min(1, y / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Active section tracking
  useEffect(() => {
    const syncDocs = () => {
      if (window.location.hash === "#docs") setActive("#docs");
    };
    syncDocs();

    const sections = navItems
      .filter((item) => item.href !== "#docs")
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) {
      window.addEventListener("hashchange", syncDocs);
      return () => window.removeEventListener("hashchange", syncDocs);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));

    const onTop = () => {
      if (window.scrollY < 200) setActive("");
    };
    window.addEventListener("scroll", onTop, { passive: true });
    window.addEventListener("hashchange", syncDocs);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onTop);
      window.removeEventListener("hashchange", syncDocs);
    };
  }, []);

  // Sliding indicator position
  useLayoutEffect(() => {
    const update = () => {
      const link = active ? linkRefs.current[active] : null;
      const nav = navRef.current;
      if (!link || !nav) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      setIndicator({ left: link.offsetLeft, width: link.offsetWidth, visible: true });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [active, scrolled]);

  // Mobile menu: Esc to close + body scroll lock
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNavigate();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, onNavigate]);

  return (
    <header className={`tl-header ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "is-open" : ""}`}>
      <div className="tl-header-shell">
        {/* Brand */}
        <a className="tl-brand" href="#top" onClick={onNavigate} aria-label="Tolstoy-CLI, наверх">
          <span className="tl-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="tl-brand-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="55%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="30" height="30" rx="9" fill="rgba(9,13,26,0.9)" stroke="url(#tl-brand-grad)" strokeWidth="1.5" />
              <path d="M16 9.5v13M16 9.5c-1.6-1-3.7-1.5-5.6-1.5-1.3 0-2.6.2-3.4.6v13c.8-.4 2.1-.6 3.4-.6 1.9 0 4 .5 5.6 1.5m0-13c1.6-1 3.7-1.5 5.6-1.5 1.3 0 2.6.2 3.4.6v13c-.8-.4-2.1-.6-3.4-.6-1.9 0-4 .5-5.6 1.5" stroke="url(#tl-brand-grad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="tl-brand-text">
            Tolstoy<span className="tl-brand-suffix">-CLI</span>
          </span>
          <span className="tl-brand-version">v7 Pro</span>
        </a>

        {/* Desktop navigation */}
        <nav ref={navRef} className="tl-nav" aria-label="Основная навигация">
          <span
            className="tl-nav-indicator"
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
              opacity: indicator.visible ? 1 : 0,
            }}
            aria-hidden="true"
          />
          {navItems.map((item) => (
            <a
              key={item.href}
              ref={(el) => {
                linkRefs.current[item.href] = el;
              }}
              href={item.href}
              className={`tl-nav-link ${active === item.href ? "active" : ""}`}
              aria-current={active === item.href ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="tl-actions">
          <a className="tl-github" href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Tolstoy-CLI на GitHub">
            <GitHubIcon className="tl-github-icon" />
            <span className="tl-github-label">GitHub</span>
          </a>
          <button
            className={`tl-burger ${menuOpen ? "open" : ""}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="tl-mobile-nav"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={onToggle}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Reading progress */}
        <span className="tl-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      </div>

      {/* Mobile navigation */}
      <div className={`tl-mobile-backdrop ${menuOpen ? "open" : ""}`} onClick={onNavigate} aria-hidden="true" />
      <nav id="tl-mobile-nav" className={`tl-mobile-nav ${menuOpen ? "open" : ""}`} aria-label="Мобильная навигация">
        {navItems.map((item, idx) => (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={active === item.href ? "active" : ""}
            style={{ transitionDelay: menuOpen ? `${40 + idx * 35}ms` : "0ms" }}
          >
            <span className="tl-mobile-index">{String(idx + 1).padStart(2, "0")}</span>
            {item.label}
            <span className="tl-mobile-arrow" aria-hidden="true">→</span>
          </a>
        ))}
        <div className="tl-mobile-footer">
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className="tl-mobile-github">
            <GitHubIcon className="tl-github-icon" />
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
