import type Lenis from "lenis";

// Module-level handle to the single Lenis instance (set by <SmoothScroll />).
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;
