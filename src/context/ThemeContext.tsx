"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export const THEME_KEY = "saans-theme-v3";

type Ctx = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<Ctx>({ theme: "dark", toggleTheme: () => {} });

/**
 * The inline script in layout.tsx sets <html data-theme> before hydration
 * (no flash). This provider reads it back and keeps it in sync.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with pre-hydration script
    if (t === "light" || t === "dark") setTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((cur) => {
      const next: Theme = cur === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/**
 * Runs in <head> before React.
 * 1. Theme: dark is the default.
 * 2. Hero intro gate: hide [data-intro] until the heading font is ready (max 1s), then play once.
 */
export const themeBootstrapScript = `(function(){var h=document.documentElement;
try{var t=localStorage.getItem('${THEME_KEY}');h.dataset.theme=(t==='light'||t==='dark')?t:'dark';}catch(e){h.dataset.theme='dark';}
try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
h.classList.add('intro-wait');var done=false;
var go=function(){if(done)return;done=true;h.classList.add('intro-go');h.classList.remove('intro-wait');};
setTimeout(go,1000);var f=document.fonts;
if(f&&f.load){var wait=function(){f.load('700 48px Comfortaa').then(function(){return f.ready;}).then(function(){requestAnimationFrame(go);},go);};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();}else{go();}
}catch(e){h.classList.remove('intro-wait');}})();`;
