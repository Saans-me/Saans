"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 60-second breath: 6 rounds of 10s (in 4s, out 6s). README §9 "Breath".
 * Starts on mount (BreathModal is keyed per open, so each open restarts it).
 * Runs even with reduced motion (only the orb animation is disabled by CSS).
 */
export function useBreath() {
  const [sec, setSec] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const run = useCallback(() => {
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setSec((s) => {
        if (s + 1 >= 60) {
          clearInterval(timer.current);
          return 60;
        }
        return s + 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    run();
    return () => clearInterval(timer.current);
  }, [run]);

  const stop = useCallback(() => clearInterval(timer.current), []);

  const s10 = sec % 10;
  const inhale = s10 < 4;
  return {
    done: sec >= 60,
    stop,
    phase: inhale ? "Breathe in" : "Breathe out",
    count: String(inhale ? 4 - s10 : 10 - s10),
    round: `Round ${Math.min(6, Math.floor(sec / 10) + 1)} of 6`,
    pct: `${Math.round((sec / 60) * 100)}%`,
  };
}
