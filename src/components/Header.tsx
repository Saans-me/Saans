"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Logo, Moon, Sun } from "./icons";
import { useUI } from "./UIProvider";
import type { ModalKey } from "./UIProvider";
import s from "./Header.module.css";

const NAV: { id: string; label: string; modal: ModalKey; menuLabel?: string }[] = [
  { id: "how", label: "What it does", modal: "how" },
  { id: "for", label: "Who it's for", modal: "for" },
  { id: "care", label: "Professionals", modal: "care" },
  { id: "privacy", label: "Privacy", modal: "privacy", menuLabel: "Privacy & safety" },
];

export function Header() {
  const { open, active, menuOpen, setMenuOpen, goTo } = useUI();
  const { theme, toggle } = useTheme();
  const headerRef = useRef<HTMLElement>(null);
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  // Lift the header with a shadow once the page scrolls.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (headerRef.current) headerRef.current.style.boxShadow = scrollY > 8 ? "0 12px 32px -20px var(--shadow)" : "none";
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [menuOpen, setMenuOpen]);

  return (
    <header ref={headerRef} className={s.header}>
      <nav aria-label="Main" className={s.nav}>
        <a href="#top" onClick={e => goTo(e, "top")} aria-label="saans, back to top" className={s.brand}>
          <Logo width={36} height={40} className={s.brandLogo} />
          <span className={s.brandName}>saans</span>
        </a>

        <div className={s.links}>
          {NAV.map(n => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={e => open(n.modal, e)}
              aria-current={active === n.id ? "location" : "false"}
              className={s.link}
            >
              {n.label}
            </a>
          ))}
        </div>

        <div className={s.actions}>
          <button type="button" onClick={toggle} aria-label={themeLabel} title={themeLabel} className={s.themeBtn}>
            <Sun size={20} sw={1.8} className={s.sun} />
            <Moon size={20} sw={1.8} className={s.moon} />
          </button>
          <button type="button" onClick={e => open("coming", e)} className={s.cta}>Start talking</button>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className={s.menuBtn}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className={s.menu}>
            {NAV.map(n => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={e => open(n.modal, e)}
                className={s.menuLink}
                data-active={active === n.id || undefined}
              >
                {n.menuLabel ?? n.label}
              </a>
            ))}
            <a href="#story" onClick={e => goTo(e, "story")} className={s.menuLink} data-active={active === "story" || undefined}>
              Our story
            </a>
            <button type="button" onClick={e => open("coming", e)} className={s.menuCta}>Start talking</button>
          </div>
        )}
      </nav>
    </header>
  );
}
