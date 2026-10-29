"use client";

import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "saans-theme";

/** Runs before hydration (inlined in layout.tsx) so the first paint already has the right theme. */
export const themeBootstrap = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "light" ? t : null;
  } catch {
    return null;
  }
}

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Swap the theme with a circular reveal from the click point (cross-fade on touch / narrow screens). */
function applyWithTransition(t: Theme, x?: number, y?: number) {
  const root = document.documentElement;
  const set = () => root.setAttribute("data-theme", t);
  if (reduced()) return set();
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition) {
    root.classList.add("sm-theming");
    set();
    setTimeout(() => root.classList.remove("sm-theming"), 650);
    return;
  }
  const coarse = matchMedia("(pointer: coarse)").matches;
  if (coarse || innerWidth < 900) {
    doc.startViewTransition(set).ready.then(() => {
      root.animate({ opacity: [0, 1] }, { duration: 260, easing: "ease-out", pseudoElement: "::view-transition-new(root)" });
      root.animate({ opacity: [1, 0] }, { duration: 260, easing: "ease-out", pseudoElement: "::view-transition-old(root)" });
    }).catch(() => {});
    return;
  }
  const cx = x || innerWidth - 60;
  const cy = y || 38;
  const r = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 4;
  const ease = "cubic-bezier(.65,0,.35,1)";
  doc.startViewTransition(set).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${r}px at ${cx}px ${cy}px)`], filter: ["blur(8px)", "blur(0)"] },
      { duration: 700, easing: ease, pseudoElement: "::view-transition-new(root)" }
    );
    root.animate(
      { transform: ["scale(1)", "scale(.96)"], filter: ["brightness(1)", "brightness(.8)"] },
      { duration: 700, easing: ease, pseudoElement: "::view-transition-old(root)" }
    );
  }).catch(() => {});
}

/** Light/dark theme: persisted in localStorage, follows the OS until the user picks one. */
export function useTheme() {
  // null until mounted: the server can't know the theme, the bootstrap script already set it on <html>.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (stored()) return;
      const t: Theme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", t);
      setTheme(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback((e?: MouseEvent) => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    applyWithTransition(next, e?.clientX, e?.clientY);
    setTheme(next);
  }, []);

  return { theme, toggle };
}
