"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { prefersReducedMotion } from "@/hooks/useMediaQuery";
import styles from "./Select.module.css";

/**
 * Modern, accessible replacement for <select> (combobox + listbox pattern).
 * - Focus stays on the trigger; options are announced via aria-activedescendant.
 * - Keyboard: ↑/↓, Home/End, Enter/Space to pick, Esc/Tab to close, type-ahead by first letter.
 * - The list renders in a portal with fixed positioning so it is never clipped by a popup.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Choose…",
  ariaLabel,
  required,
  variant = "field",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  ariaLabel: string;
  required?: boolean;
  /** "field": full-width form field (popups). "bare": no border (inline join form). */
  variant?: "field" | "bare";
  className?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);

  const place = useCallback(() => {
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const listH = Math.min(320, options.length * 46 + 12);
    const up = r.bottom + listH + 12 > window.innerHeight && r.top > listH + 12;
    setPos({ left: r.left, top: up ? r.top - 8 : r.bottom + 8, width: Math.max(r.width, 220), up });
  }, [options.length]);

  const openList = useCallback(() => {
    place();
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  }, [options, value, place]);

  const close = useCallback((focus = true) => {
    setOpen(false);
    if (focus) btnRef.current?.focus({ preventScroll: true });
  }, []);

  const pick = (i: number) => {
    onChange(options[i]);
    close();
  };

  // Entrance animation (before paint, so no flash).
  useLayoutEffect(() => {
    if (!open || !listRef.current || prefersReducedMotion()) return;
    listRef.current.animate(
      [
        { opacity: 0, transform: `translateY(${pos?.up ? 6 : -6}px) scale(.97)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" },
    );
  }, [open, pos?.up]);

  // Close on outside press / scroll / resize.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t)) close(false);
    };
    const onMove = () => place();
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, close, place]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKey = (e: React.KeyboardEvent) => {
    const n = options.length;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // don't close the surrounding popup
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % n);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + n) % n);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(n - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active >= 0) pick(active);
    } else if (e.key === "Tab") {
      close(false);
    } else if (e.key.length === 1) {
      const k = e.key.toLowerCase();
      const start = (active + 1) % n;
      for (let j = 0; j < n; j++) {
        const i = (start + j) % n;
        if (options[i].toLowerCase().startsWith(k)) {
          setActive(i);
          break;
        }
      }
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required || undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-o${active}` : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKey}
        className={`${styles.trigger} ${variant === "bare" ? styles.bare : styles.field} ${open ? styles.isOpen : ""} ${className ?? ""}`}
      >
        <span className={value ? styles.value : styles.placeholder}>{value || placeholder}</span>
        <Icon name="chevron" size={18} strokeWidth={2.2} className={styles.chev} />
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            data-lenis-prevent
            className={styles.list}
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
              transformOrigin: pos.up ? "50% 100%" : "50% 0",
            }}
          >
            {options.map((o, i) => (
              <li
                key={o}
                id={`${id}-o${i}`}
                data-i={i}
                role="option"
                aria-selected={o === value}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(i)}
                className={`${styles.option} ${i === active ? styles.active : ""}`}
              >
                <span>{o}</span>
                {o === value && <Icon name="check" size={16} strokeWidth={2.6} className={styles.tick} />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
