"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Close } from "../icons";
import { useUI } from "../UIProvider";
import s from "./GlassModal.module.css";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const lite = () => matchMedia("(pointer: coarse)").matches || innerWidth < 760;

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /** dark: deep tinted glass (Care, Privacy, For, How). light: surface glass (Coming soon, Breath). plain: solid surface (Help). */
  variant: "dark" | "light" | "plain";
  /** Accessible name for the full-screen scrim button. */
  scrimLabel?: string;
  zIndex: number;
  /** Overlay padding (how close the card may get to the viewport edge). */
  padding: string;
  /** The Breath pop-up uses a flat accent blob instead of the accent→primary radial. */
  flatBlob?: boolean;
  cardClassName?: string;
  cardStyle?: CSSProperties;
  children: ReactNode;
};

/**
 * Shared pop-up shell: scrim, drifting blobs and a glass card, with the
 * enter/exit motion from the prototype. Stays mounted until the exit animation
 * finishes (700ms safety timeout), then tells the provider so focus can return.
 */
export function GlassModal({ open, onClose, labelledBy, variant, scrimLabel = "Close", zIndex, padding, flatBlob, cardClassName, cardStyle, children }: Props) {
  const { exited } = useUI();
  const [mounted, setMounted] = useState(open);
  const rootRef = useRef<HTMLDivElement>(null);
  if (open && !mounted) setMounted(true);

  // Enter: runs before paint so the first frame is already animating.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    root.getAnimations({ subtree: true }).forEach(a => { if (a.effect?.getTiming().iterations !== Infinity) a.cancel(); });
    const card = root.querySelector<HTMLElement>("[data-modal]");
    const focusT = setTimeout(() => card?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true }), 80);
    if (!reduced()) {
      const l = lite();
      const ease = "cubic-bezier(.16,1,.3,1)";
      root.querySelectorAll<HTMLElement>("[data-scrim]").forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: "cubic-bezier(.33,1,.68,1)", fill: "backwards" }));
      root.querySelectorAll<HTMLElement>("[data-blob]").forEach((el, i) => el.animate(
        [{ opacity: 0, transform: "scale(.6)" }, { opacity: getComputedStyle(el).opacity, transform: "scale(1)" }],
        { duration: 1400, delay: 80 + i * 120, easing: ease, fill: "backwards" }
      ));
      // No `filter` on the card: animating it switches off the card's own backdrop blur
      // in Chrome, which flashes the translucent glass white before it settles.
      card?.animate(
        [{ opacity: 0, transform: `translateY(28px) scale(${l ? .97 : .96})` }, { opacity: 1, transform: "none" }],
        { duration: l ? 700 : 900, delay: 60, easing: ease, fill: "backwards" }
      );
      root.querySelectorAll<HTMLElement>("[data-ci]").forEach((el, i) => el.animate(
        [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
        { duration: 750, delay: 220 + Math.min(i, 8) * 80, easing: ease, fill: "backwards" }
      ));
    }
    return () => clearTimeout(focusT);
  }, [open, mounted]);

  // Exit: fade out, then unmount.
  useEffect(() => {
    const root = rootRef.current;
    if (open || !mounted || !root) return;
    let done = false;
    const finish = () => { if (done) return; done = true; setMounted(false); exited(); };
    if (reduced()) { finish(); return; }
    const ease = "cubic-bezier(.4,0,.2,1)";
    root.querySelectorAll<HTMLElement>("[data-scrim],[data-blob]").forEach(el => el.animate(
      [{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }],
      { duration: 480, delay: 60, easing: ease, fill: "forwards" }
    ));
    const card = root.querySelector<HTMLElement>("[data-modal]");
    const a = card?.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(18px) scale(.97)" }],
      { duration: 420, easing: ease, fill: "forwards" }
    );
    if (a) a.finished.then(finish, finish); else finish();
    const t = setTimeout(finish, 700);
    return () => { clearTimeout(t); done = true; };
  }, [open, mounted, exited]);

  // Esc closes the top-most open pop-up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div ref={rootRef} className={s.overlay} style={{ zIndex, padding, pointerEvents: open ? undefined : "none" }}>
      <button
        type="button"
        data-scrim="1"
        tabIndex={-1}
        aria-label={scrimLabel}
        onClick={onClose}
        className={`${s.scrim} ${variant === "plain" ? s.scrimHelp : ""}`}
      />
      {variant !== "plain" && (
        <>
          <span aria-hidden="true" data-blob="1" className={`${s.blobA} ${flatBlob ? s.blobFlat : ""}`} />
          <span aria-hidden="true" data-blob="1" className={s.blobB} />
        </>
      )}
      <div
        data-modal="1"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`${s.card} ${s[variant]} ${cardClassName ?? ""}`}
        style={cardStyle}
      >
        {children}
      </div>
    </div>
  );
}

/** Sticky round close button for the dark, internally scrolling panels. */
export function PanelClose({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <div className={s.panelCloseBar}>
      <button type="button" onClick={onClose} aria-label={label} className={s.panelClose}>
        <Close size={16} />
      </button>
    </div>
  );
}

/** Round close button for the light glass cards. */
export function GlassClose({ onClose, label, size = 16, still }: { onClose: () => void; label: string; size?: number; still?: boolean }) {
  return (
    <button type="button" onClick={onClose} aria-label={label} className={`${s.glassClose} ${still ? s.still : ""}`}>
      <Close size={size} />
    </button>
  );
}
