"use client";

import { useTheme } from "@/context/ThemeContext";
import { Icon } from "@/components/shared/Icon";
import styles from "./Header.module.css";

/** Shows a sun in dark mode, a moon in light mode (as in the reference). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme} aria-label="Switch theme" className={`${styles.iconBtn} ${className ?? ""}`}>
      {/* Both icons render; CSS picks one from <html data-theme> so SSR never shows the wrong one. */}
      <span className={styles.sunIcon} data-theme-state={theme}>
        <Icon name="sun" size={19} strokeWidth={1.8} />
      </span>
      <span className={styles.moonIcon}>
        <Icon name="moon" size={19} strokeWidth={1.8} />
      </span>
    </button>
  );
}
