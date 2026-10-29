"use client";

import { useEffect } from "react";

const EASE = "cubic-bezier(.22,1,.36,1)";

type Frames = Keyframe[];
const KEYS: Record<string, Frames> = {
  up: [{ opacity: 0, transform: "translateY(44px) scale(.97)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
  scale: [{ opacity: 0, transform: "translateY(40px) scale(.92)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
  line: [{ opacity: 0, transform: "translateY(24px)", clipPath: "inset(0 100% 0 0)" }, { opacity: 1, transform: "translateY(0)", clipPath: "inset(0 0% 0 0)" }],
};

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Touch screens and small viewports skip blur filters and use shorter durations. */
export const isLite = () => matchMedia("(pointer: coarse)").matches || innerWidth < 760;

/**
 * Entrance motion: `[data-hero]` elements rise in on load, `[data-reveal]` elements
 * (up | scale | line) animate in once when they scroll into view.
 */
export function useReveal() {
  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const lite = isLite();
    const nb = (f: Frames) => (lite ? f.map(k => { const c = { ...k }; delete c.filter; return c; }) : f);

    document.querySelectorAll<HTMLElement>("[data-hero]").forEach((el, i) => {
      el.animate(nb([{ opacity: 0, transform: "translateY(32px)" }, { opacity: 1, transform: "translateY(0)" }]), {
        duration: 900, delay: 80 + i * 110, easing: EASE, fill: "backwards",
      });
    });

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    els.forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight * 0.95) el.style.opacity = "0";
      else el.dataset.revealed = "1";
    });

    // Bento extras: pattern bars grow, chat bubbles pop in one by one.
    const extras = (el: HTMLElement) => {
      if (el.dataset.bars) {
        el.querySelectorAll<HTMLElement>("[data-bar]").forEach((b, k) => {
          b.animate([{ transform: "scaleY(0)", opacity: 0 }, { transform: "scaleY(1)" }], { duration: 900, delay: 200 + k * 70, easing: EASE, fill: "backwards" });
        });
      }
      el.querySelectorAll<HTMLElement>("[data-chat] > div").forEach((m, k) => {
        m.animate([{ opacity: 0, transform: "translateY(16px) scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 300 + k * 260, easing: EASE, fill: "backwards" });
      });
    };

    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      el.animate(nb(KEYS[el.dataset.reveal || "up"] || KEYS.up), {
        duration: lite ? 800 : 1050,
        delay: Math.min(240, (+(el.dataset.revealDelay || 0)) * 0.7),
        easing: EASE,
        fill: "backwards",
      });
      el.style.opacity = "";
      extras(el);
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    els.forEach(el => io.observe(el));

    return () => {
      io.disconnect();
      els.forEach(el => { el.style.opacity = ""; });
    };
  }, []);
}

type Item = { el: HTMLElement; kind: string; k: number; cur: number; tgt: number };

/**
 * Scroll-linked motion, lerped for smoothness. Uses the individual `translate` /
 * `scale` properties so it composes with CSS animations on `transform`.
 *  - `data-parallax="0.03"`: light vertical drift around the viewport centre
 *  - `data-scroll="hero"`: hero panel shrinks/fades slightly as you scroll away
 *  - `data-scroll="grow"`: grows from .96 to 1 as it enters
 */
export function useParallax() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const items: Item[] = [];
    document.querySelectorAll<HTMLElement>("[data-parallax]").forEach(el => items.push({ el, kind: "px", k: +(el.dataset.parallax || 0), cur: 0, tgt: 0 }));
    document.querySelectorAll<HTMLElement>("[data-scroll]").forEach(el => items.push({ el, kind: el.dataset.scroll || "", k: 0, cur: 0, tgt: 0 }));
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const measure = () => {
      const vh = innerHeight, small = innerWidth < 700;
      items.forEach(it => {
        const r = it.el.getBoundingClientRect();
        if (it.kind === "px") { const top = r.top - it.cur; it.tgt = clamp((top + r.height / 2 - vh / 2) * it.k * (small ? .5 : 1), -90, 90); }
        else if (it.kind === "hero") it.tgt = clamp(scrollY / (vh * 0.9), 0, 1);
        else it.tgt = clamp((vh - r.top) / (vh * 0.75), 0, 1);
      });
    };
    const apply = (it: Item) => {
      const v = it.cur, s = it.el.style;
      if (it.kind === "px") s.translate = "0 " + v.toFixed(2) + "px";
      else if (it.kind === "hero") { s.scale = (1 - v * 0.03).toFixed(4); s.opacity = (1 - v * 0.2).toFixed(3); }
      else if (it.kind === "grow") s.scale = (0.96 + v * 0.04).toFixed(4);
    };

    let raf = 0;
    const tick = () => {
      raf = 0;
      let moving = false;
      items.forEach(it => {
        const d = it.tgt - it.cur;
        if (Math.abs(d) > (it.kind === "px" ? 0.05 : 0.0005)) { it.cur += d * 0.22; moving = true; } else it.cur = it.tgt;
        apply(it);
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => { measure(); if (!raf) raf = requestAnimationFrame(tick); };

    items.forEach(it => { it.el.style.willChange = it.kind === "px" ? "translate" : "scale, opacity"; });
    measure();
    items.forEach(it => { it.cur = it.tgt; apply(it); });
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      items.forEach(({ el }) => { el.style.translate = ""; el.style.scale = ""; el.style.opacity = ""; el.style.willChange = ""; });
    };
  }, []);
}
