"use client";

import { useEffect } from "react";
import { prefersReducedMotion, useParallax, useReveal } from "@/hooks/useReveal";

/** Press feedback: a quick squash and a soft ripple from the pointer on buttons and pill links. */
function usePressRipple() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (prefersReducedMotion() || e.button !== 0) return;
      const el = (e.target as Element | null)?.closest?.("button, a[href]") as HTMLElement | null;
      if (!el) return;
      const cs = getComputedStyle(el);
      const isBtn = el.tagName === "BUTTON" || /flex|grid/.test(cs.display);
      if (!isBtn || el.offsetWidth < 30 || el.offsetHeight < 30 || el.dataset.scrim) return;
      el.animate([{ transform: "scale(1)" }, { transform: "scale(.96)", offset: .3 }, { transform: "scale(1)" }], {
        duration: 560, easing: "cubic-bezier(.22,1,.36,1)", composite: "add",
      });
      if (cs.position === "static") el.style.position = "relative";
      el.style.overflow = "hidden";
      el.style.isolation = "isolate";
      const b = el.getBoundingClientRect(), s = Math.max(b.width, b.height) * 2.2;
      const r = document.createElement("span");
      r.className = "sm-ripple";
      r.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - b.left - s / 2}px;top:${e.clientY - b.top - s / 2}px`;
      el.appendChild(r);
      r.animate([{ transform: "scale(0)", opacity: .28 }, { transform: "scale(1)", opacity: 0 }], {
        duration: 900, easing: "cubic-bezier(.22,1,.36,1)",
      }).finished.then(() => r.remove(), () => r.remove());
    };
    addEventListener("pointerdown", onDown, true);
    return () => removeEventListener("pointerdown", onDown, true);
  }, []);
}

/** Mounts the page-wide motion: scroll reveals, parallax and press ripples. Renders nothing. */
export function Motion() {
  useReveal();
  useParallax();
  usePressRipple();
  return null;
}
