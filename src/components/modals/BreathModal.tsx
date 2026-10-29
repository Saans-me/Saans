"use client";

import { useBreathing } from "@/hooks/useBreathing";
import type { BreathPhase } from "@/hooks/useBreathing";
import { useUI } from "../UIProvider";
import { GlassClose, GlassModal } from "./GlassModal";
import s from "./BreathModal.module.css";

/** Number of breaths in one session (the prototype's `breathRounds` prop, 3–10). */
const ROUNDS = 6;

const SCALE: Record<BreathPhase, number> = { ready: 0.6, in: 1, out: 0.6, done: 0.85 };
const LABEL: Record<BreathPhase, string> = { ready: "Get comfortable", in: "Breathe in", out: "Breathe out", done: "Nicely done." };

export function BreathModal() {
  const { modal, close } = useUI();
  const open = modal === "breath";
  const b = useBreathing(open, ROUNDS);

  const sub =
    b.phase === "ready" ? `${b.rounds} slow breaths together. In for 4, out for 4.`
    : b.phase === "done" ? "Notice how you feel. That's it, that's the whole thing."
    : `Round ${b.round + 1} of ${b.rounds}`;
  const orb = { transform: `scale(${SCALE[b.phase]})`, transition: b.phase === "done" ? "transform 1.2s ease" : "transform 4s ease-in-out" };

  return (
    <GlassModal open={open} onClose={close} labelledBy="breath-label" variant="light" scrimLabel="Close breathing exercise" zIndex={80} padding="16px" flatBlob cardClassName={s.card}>
      <GlassClose onClose={close} label="Close breathing exercise" size={18} still />
      <div className={s.dial}>
        <div
          role="progressbar"
          aria-label="Breathing exercise progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(b.pct)}
          className={s.progress}
          style={{ background: `conic-gradient(var(--primary) ${b.pct.toFixed(1)}%, color-mix(in srgb, var(--primary) 16%, transparent) 0)` }}
        />
        <div aria-hidden="true" className={s.outer} style={orb} />
        <div aria-hidden="true" className={s.inner} style={orb} />
        <div aria-hidden="true" className={s.core} style={orb}>
          {(b.phase === "in" || b.phase === "out") && <span className={s.count}>{b.count}</span>}
        </div>
      </div>
      <div className={s.copy}>
        <p id="breath-label" aria-live="polite" className={s.label}>{LABEL[b.phase]}</p>
        <p className={s.sub}>{sub}</p>
      </div>
      <div className={s.actions}>
        {b.phase === "done" && <button type="button" onClick={b.restart} className={s.again}>Breathe again</button>}
        <button type="button" onClick={close} className={s.done}>Done</button>
      </div>
    </GlassModal>
  );
}
