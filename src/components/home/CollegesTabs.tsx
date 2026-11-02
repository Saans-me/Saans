"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/hooks/useMediaQuery";
import styles from "./Colleges.module.css";

const TABS = ["Stress patterns", "Requests by urgency", "Faculty concerns"];

/**
 * Client island for the Colleges section: the tab pills (in the text column) and the panel they drive.
 * The static copy, the buttons row and the three panel views are rendered on the server and passed in.
 */
export function CollegesTabs({
  intro,
  actions,
  panels,
}: {
  intro: React.ReactNode;
  actions: React.ReactNode;
  panels: React.ReactNode[];
}) {
  const [tab, setTab] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const prev = useRef(tab);

  // Reference: panel fades in from opacity .4 / translateY(8px) on every tab switch.
  useEffect(() => {
    if (prev.current === tab) return;
    prev.current = tab;
    const el = panelRef.current;
    if (!el || prefersReducedMotion() || typeof el.animate !== "function") return;
    el.animate([{ opacity: 0.4, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], {
      duration: 450,
      easing: "cubic-bezier(.22,1,.36,1)",
    });
  }, [tab]);

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = TABS.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i + n - 1) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(next);
    document.getElementById(`col-tab-${next}`)?.focus();
  };

  return (
    <div className={styles.grid}>
      <div className={styles.text}>
        {intro}
        <div
          data-reveal="up"
          data-reveal-delay="160"
          role="tablist"
          aria-label="SAANS Campus views"
          className={styles.tabs}
        >
          {TABS.map((label, i) => (
            <button
              key={label}
              id={`col-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === tab}
              aria-controls="col-panel"
              tabIndex={i === tab ? 0 : -1}
              onClick={() => setTab(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={styles.tab}
            >
              {label}
            </button>
          ))}
        </div>
        {actions}
      </div>
      <div
        ref={panelRef}
        id="col-panel"
        data-reveal="scale"
        role="tabpanel"
        aria-labelledby={`col-tab-${tab}`}
        className={styles.panel}
      >
        {panels[tab]}
      </div>
    </div>
  );
}
