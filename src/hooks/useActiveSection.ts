"use client";

import { useEffect, useState } from "react";

const IDS = ["for", "how", "care", "journey", "privacy", "story"];

/** The section crossing 40% of the viewport height, for nav and dock highlighting. */
export function useActiveSection() {
  const [active, setActive] = useState("");

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = innerHeight * 0.4;
      let a = "";
      IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) a = id;
      });
      setActive(a);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return active;
}
