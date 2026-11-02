"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "./useMediaQuery";

const EASE = "cubic-bezier(.22,1,.36,1)";

/* ------------------------------------------------------------------------ */
/* Count-up: any [data-count] element whose text is a number ("84.5%",       */
/* "4,212", "10+", "118") counts from 0 to its own value when revealed.      */
/* ------------------------------------------------------------------------ */
function countUp(el: HTMLElement, delay: number) {
  const text = (el.dataset.countFinal ??= el.textContent ?? "");
  const m = text.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return;
  const [, prefix, num, suffix] = m;
  const target = parseFloat(num.replace(/,/g, ""));
  const decimals = (num.split(".")[1] || "").length;
  const grouped = num.includes(",");
  const fmt = (v: number) => {
    const s = grouped
      ? v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : v.toFixed(decimals);
    return prefix + s + suffix;
  };
  // Lock the width so surrounding layout doesn't shift while counting.
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  el.style.display ||= "inline-block";
  el.textContent = fmt(0);
  const dur = 1500;
  let start = 0;
  const step = (t: number) => {
    if (!start) start = t;
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = p >= 1 ? text : fmt(target * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  setTimeout(() => requestAnimationFrame(step), delay);
}

/** Extras that play inside a block when it reveals. */
function playExtras(el: HTMLElement, d: number) {
  // Lines draw in.
  el.querySelectorAll("[data-draw]").forEach((p, i) =>
    p.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
      duration: 1300,
      delay: d + 300 + i * 220,
      easing: EASE,
      fill: "backwards",
    }),
  );
  // Bars grow: data-grow="x" (wipe in from the left) or "y" (rise from the bottom).
  el.querySelectorAll<HTMLElement>("[data-grow]").forEach((g, i) => {
    const x = g.dataset.grow === "x";
    g.animate(
      x
        ? [{ clipPath: "inset(0 100% 0 0 round 12px)" }, { clipPath: "inset(0 0 0 0 round 0px)" }]
        : [{ transform: "scaleY(0)", transformOrigin: "50% 100%" }, { transform: "scaleY(1)", transformOrigin: "50% 100%" }],
      { duration: x ? 1500 : 900, delay: d + 250 + i * 45, easing: EASE, fill: "backwards" },
    );
  });
  // Numbers count up.
  const counts = [...(el.matches("[data-count]") ? [el] : []), ...el.querySelectorAll<HTMLElement>("[data-count]")];
  counts.forEach((c) => countUp(c, d + 200));
}

/**
 * README §11 + extra motion. Observes every `[data-reveal]` element on the page.
 *   data-reveal="up"    translateY(28px) → 0   (headings also un-blur)
 *   data-reveal="scale" translateY(36px) scale(.96) → none
 *   data-reveal="fade"  opacity only
 *   data-reveal-delay="160" (ms)
 * Inside a revealed block: [data-draw] paths draw in, [data-grow] bars grow,
 * [data-count] numbers count up. Elements already on screen at load are not animated.
 * Also: [data-parallax="0.1"] elements drift with scroll, and <main> fades in on route change.
 */
export function useReveal() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    // Page transition on client-side navigation (the first load has its own intro).
    if (!first.current && !reduced) {
      document
        .getElementById("main")
        ?.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
          duration: 650,
          easing: EASE,
        });
    }
    first.current = false;

    if (reduced || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          io.unobserve(el);
          const d = +(el.getAttribute("data-reveal-delay") || 0);
          const k = el.getAttribute("data-reveal");
          const heading = /^H[1-3]$/.test(el.tagName);
          el.style.opacity = "";
          const from: Keyframe =
            k === "scale"
              ? { opacity: 0, transform: "translateY(36px) scale(.96)" }
              : k === "fade"
                ? { opacity: 0 }
                : heading
                  ? { opacity: 0, transform: "translateY(28px)", filter: "blur(8px)" }
                  : { opacity: 0, transform: "translateY(28px)" };
          const to: Keyframe = heading ? { opacity: 1, transform: "none", filter: "blur(0)" } : { opacity: 1, transform: "none" };
          el.animate([from, to], { duration: 950, delay: d, easing: EASE, fill: "backwards" });
          playExtras(el, d);
        }),
      { rootMargin: "0px 0px -6% 0px" },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-rv])").forEach((el) => {
        el.setAttribute("data-rv", "1");
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
        el.style.opacity = "0";
        io.observe(el);
      });
    };

    const t = setTimeout(scan, 80);
    // Catch elements mounted later (tab panels, conditional blocks).
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    /* ---------------- Parallax ---------------- */
    let raf = 0;
    const items = () => [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of items()) {
        const speed = parseFloat(el.dataset.parallax || "0");
        const cur = parseFloat(el.dataset.pY || "0");
        const r = el.getBoundingClientRect();
        const top = r.top - cur; // position without our own offset
        if (top > vh * 1.5 || top + r.height < -vh * 0.5) continue;
        const y = (top + r.height / 2 - vh / 2) * -speed;
        el.dataset.pY = String(y);
        el.style.translate = `0 ${y.toFixed(1)}px`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const pt = setTimeout(update, 100);

    return () => {
      clearTimeout(t);
      clearTimeout(pt);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mo.disconnect();
      io.disconnect();
      // Anything still hidden must become visible if we leave before it revealed.
      document.querySelectorAll<HTMLElement>("[data-reveal][data-rv]").forEach((el) => {
        el.style.opacity = "";
      });
    };
  }, [pathname]);
}

export function RevealObserver() {
  useReveal();
  return null;
}
