"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/hooks/useMediaQuery";
import { getLenis } from "@/lib/smooth";

type Ctx = {
  /** Selected tab in the home "For you" section (0..4). */
  forTab: number;
  setForTab: (i: number | ((p: number) => number)) => void;
  /** Mobile menu */
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((p: boolean) => boolean)) => void;
};

const UIContext = createContext<Ctx | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [forTab, setForTab] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  return <UIContext.Provider value={{ forTab, setForTab, menuOpen, setMenuOpen }}>{children}</UIContext.Provider>;
}

export function useUI() {
  const c = useContext(UIContext);
  if (!c) throw new Error("useUI must be used inside <UIProvider>");
  return c;
}

const targetTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY - 76;

/**
 * Scroll to an element id with the 76px header offset (reference scrollToId).
 * Uses Lenis when active; when the scroll ends it re-measures and corrects if
 * layout moved meanwhile (images/fonts loading after a route change).
 */
export function scrollToId(id: string, attempt = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  // Numeric target (rect is zoom-aware; Lenis' element mode isn't with the laptop `zoom`).
  const top = targetTop(el);
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(top, {
      duration: attempt ? 0.5 : 1.4,
      onComplete: () => {
        const again = document.getElementById(id);
        if (again && attempt < 2 && Math.abs(again.getBoundingClientRect().top - 76) > 4) scrollToId(id, attempt + 1);
      },
    });
    return;
  }
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/** Wait (up to ~3s) for an element to exist and the page to settle, then scroll to it. */
function scrollWhenReady(id: string) {
  const started = Date.now();
  const tick = () => {
    const el = document.getElementById(id);
    if (el && document.readyState !== "loading") {
      getLenis()?.resize();
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(id)));
    } else if (Date.now() - started < 3000) {
      setTimeout(tick, 50);
    }
  };
  tick();
}

/**
 * Returns a click handler factory for links to home sections, e.g.
 * `goSection('for-you', 4)` → selects "Professional care" and scrolls there.
 * Works from any page: off home it navigates to `/#id` first.
 */
export function useGoSection() {
  const { setForTab, setMenuOpen } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  return useCallback(
    (id: string, tab?: number) => (e?: React.MouseEvent) => {
      e?.preventDefault();
      setMenuOpen(false);
      if (tab != null) setForTab(tab);
      if (pathname !== "/") {
        router.push("/#" + id);
        // Scroll once the home page has rendered (Lenis owns the scroll position).
        setTimeout(() => scrollWhenReady(id), 60);
      } else {
        scrollToId(id);
      }
    },
    [pathname, router, setForTab, setMenuOpen],
  );
}
