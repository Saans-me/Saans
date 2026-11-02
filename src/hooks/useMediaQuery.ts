"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query. Returns `serverValue` during SSR/hydration, then the real value.
 * Prefer CSS media queries for layout; use this only for behaviour (e.g. modal sheet animation).
 */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const PHONE_QUERY = "(max-width: 639px)";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function isPhone() {
  return typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches;
}
