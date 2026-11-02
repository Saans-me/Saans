"use client";

import { useLayoutEffect, useRef } from "react";
import { ModalButton } from "@/components/shared/Actions";
import { PhoneStack } from "@/components/shared/Devices";
import { useUI } from "@/context/UIContext";
import { prefersReducedMotion } from "@/hooks/useMediaQuery";
import { FOR } from "@/lib/content";
import styles from "./ForYou.module.css";

const N = FOR.length;
const SCREENS = FOR.map((t) => ({ src: t.img, alt: t.alt }));
const BLANK = FOR.map((t) => ({ src: t.img, alt: "" }));

/** Home §5: what SAANS does, as a tabbed phone stage. Tab state is shared (UIContext) so links can preselect it. */
export function ForYou() {
  const { forTab, setForTab } = useUI();
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevTab = useRef(forTab);

  const ft = FOR[forTab];
  const prevIdx = (forTab + N - 1) % N;
  const nextIdx = (forTab + 1) % N;

  // Panel fades and rises on tab change. useLayoutEffect: starts before paint, so the
  // new text never flashes at full opacity first.
  useLayoutEffect(() => {
    if (prevTab.current === forTab) return;
    prevTab.current = forTab;
    if (!panelRef.current || prefersReducedMotion()) return;
    panelRef.current.animate(
      [
        { opacity: 0, transform: "translateY(14px)", filter: "blur(4px)" },
        { opacity: 1, transform: "none", filter: "blur(0)" },
      ],
      { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }, [forTab]);

  const onTabKey = (e: React.KeyboardEvent) => {
    let i: number | null = null;
    if (e.key === "ArrowRight") i = (forTab + 1) % N;
    else if (e.key === "ArrowLeft") i = (forTab + N - 1) % N;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = N - 1;
    if (i == null) return;
    e.preventDefault();
    setForTab(i);
    tabRefs.current[i]?.focus();
  };

  return (
    <section id="for-you" data-screen-label="For you" className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <p data-reveal="up" className={`eyebrow ${styles.eyebrow}`}>
              For you
            </p>
            <h2 data-reveal="up" data-reveal-delay="60" className={`h2 ${styles.h2}`}>
              A companion that gets to know you.
            </h2>
          </div>
          <div data-reveal="up" role="tablist" aria-label="What SAANS does" className={styles.tablist} onKeyDown={onTabKey}>
            {FOR.map((t, i) => (
              <button
                key={t.label}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`for-tab-${i}`}
                aria-selected={i === forTab}
                aria-controls="for-panel"
                tabIndex={i === forTab ? 0 : -1}
                onClick={() => setForTab(i)}
                className={styles.tab}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div data-reveal="fade" className={styles.stage}>
          <span aria-hidden="true" className={styles.glow} />
          <button
            type="button"
            onClick={() => setForTab((p) => (p + N - 1) % N)}
            aria-label="Previous feature"
            className={styles.neighbour}
          >
            <PhoneStack screens={BLANK} active={prevIdx} sizes="240px" className={styles.phoneSide} />
          </button>
          <div className={styles.centre}>
            <PhoneStack screens={SCREENS} active={forTab} sizes="290px" className={styles.phoneMain} />
          </div>
          <button
            type="button"
            onClick={() => setForTab((p) => (p + 1) % N)}
            aria-label="Next feature"
            className={styles.neighbour}
          >
            <PhoneStack screens={BLANK} active={nextIdx} sizes="240px" className={styles.phoneSide} />
          </button>
        </div>

        <div
          ref={panelRef}
          role="tabpanel"
          id="for-panel"
          aria-labelledby={`for-tab-${forTab}`}
          className={styles.panel}
        >
          <h3 className={styles.title}>{ft.title}</h3>
          <p className={styles.copy}>{ft.copy}</p>
          <div className={styles.cta}>
            <ModalButton modal="waitlist" className="btn btn-primary">
              Join the waitlist
            </ModalButton>
          </div>
        </div>
      </div>
    </section>
  );
}
