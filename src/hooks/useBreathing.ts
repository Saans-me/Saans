"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type BreathPhase = "ready" | "in" | "out" | "done";

type State = { phase: BreathPhase; round: number; pct: number; count: number };

const INITIAL: State = { phase: "ready", round: 0, pct: 0, count: 4 };
const BREATH_MS = 8000; // 4s in + 4s out
const LEAD_IN_MS = 1500;

/**
 * Breathing timer: a 1.5s "Get comfortable" lead-in, then `rounds` cycles of
 * 4s in / 4s out. Runs while `running` is true; `restart` starts it over.
 */
export function useBreathing(running: boolean, rounds = 6) {
  const [state, setState] = useState<State>(INITIAL);
  const [run, setRun] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout effect so a reopened pop-up never paints the previous session's last frame.
  useLayoutEffect(() => {
    if (!running) return;
    setState(INITIAL);
    const start = Date.now() + LEAD_IN_MS;
    const total = rounds * BREATH_MS;
    const tick = () => {
      const el = Date.now() - start;
      if (el < 0) return;
      if (el >= total) {
        if (timer.current) clearInterval(timer.current);
        setState({ phase: "done", pct: 100, round: rounds - 1, count: 4 });
        return;
      }
      const inPhase = el % BREATH_MS;
      setState({
        phase: inPhase < BREATH_MS / 2 ? "in" : "out",
        round: Math.floor(el / BREATH_MS),
        pct: (el / total) * 100,
        count: 4 - Math.floor((inPhase % (BREATH_MS / 2)) / 1000),
      });
    };
    timer.current = setInterval(tick, 100);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running, rounds, run]);

  const restart = useCallback(() => setRun(n => n + 1), []);

  return { ...state, rounds, restart };
}
