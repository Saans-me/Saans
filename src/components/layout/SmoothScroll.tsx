"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useModal } from "@/context/ModalContext";
import { useUI } from "@/context/UIContext";
import { prefersReducedMotion } from "@/hooks/useMediaQuery";
import { getLenis, setLenis } from "@/lib/smooth";

/**
 * Smooth, inertial page scrolling (Lenis). Off for reduced motion and touch
 * devices keep native scrolling (Lenis default). Paused while a popup or the
 * mobile menu is open; scrollable popups/menus opt out with `data-lenis-prevent`.
 */
export function SmoothScroll() {
  const { modal } = useModal();
  const { menuOpen } = useUI();
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
      anchors: false,
      autoRaf: true,
    });
    setLenis(lenis);
    return () => {
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // Pause page scrolling under popups / menu.
  useEffect(() => {
    const l = getLenis();
    if (!l) return;
    if (modal || menuOpen) l.stop();
    else l.start();
  }, [modal, menuOpen]);

  // New page: recalculate the scroll height once the content is in.
  useEffect(() => {
    const t = setTimeout(() => getLenis()?.resize(), 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
