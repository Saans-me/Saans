"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import { useActiveSection } from "@/hooks/useActiveSection";

export type ModalKey = "coming" | "breath" | "care" | "privacy" | "help" | "for" | "how";

type UI = {
  modal: ModalKey | null;
  /** Open a pop-up. Remembers the opener so focus can return to it on close. */
  open: (key: ModalKey, e?: SyntheticEvent) => void;
  close: () => void;
  /** Close the current pop-up, then open another once its exit animation has played. */
  closeThen: (key: ModalKey, delay: number) => void;
  /** Called by a pop-up after its exit animation finished and it unmounted. */
  exited: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  active: string;
  /** Smooth-scroll to a section (or "top"), closing the mobile menu. */
  goTo: (e: SyntheticEvent | null, id: string) => void;
};

const Ctx = createContext<UI | null>(null);

export function useUI() {
  const ui = useContext(Ctx);
  if (!ui) throw new Error("useUI must be used inside <UIProvider>");
  return ui;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalKey | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection();
  const modalRef = useRef<ModalKey | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  modalRef.current = modal;

  const open = useCallback((key: ModalKey, e?: SyntheticEvent) => {
    e?.preventDefault();
    if (pending.current) { clearTimeout(pending.current); pending.current = null; }
    if (!modalRef.current) returnFocus.current = (e?.currentTarget as HTMLElement) || (document.activeElement as HTMLElement);
    if (navigator.vibrate && matchMedia("(pointer: coarse)").matches && ["care", "for", "how", "privacy"].includes(key)) {
      try { navigator.vibrate(8); } catch {}
    }
    setModal(key);
    setMenuOpen(false);
  }, []);

  const close = useCallback(() => setModal(null), []);

  const closeThen = useCallback((key: ModalKey, delay: number) => {
    setModal(null);
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => { pending.current = null; setModal(key); }, delay);
  }, []);

  const exited = useCallback(() => {
    // Another pop-up is open or about to open: it manages focus instead.
    if (modalRef.current || pending.current) return;
    const r = returnFocus.current;
    if (r && document.contains(r)) r.focus({ preventScroll: true });
  }, []);

  const goTo = useCallback((e: SyntheticEvent | null, id: string) => {
    e?.preventDefault();
    setMenuOpen(false);
    const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (id === "top") { scrollTo({ top: 0, behavior }); return; }
    const el = document.getElementById(id);
    if (!el) return;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - 84, behavior });
  }, []);

  // Lock page scroll while a pop-up (or the phone menu) is open.
  useEffect(() => {
    const lock = modal !== null || (menuOpen && innerWidth < 960);
    document.body.style.overflow = lock ? "hidden" : "";
  }, [modal, menuOpen]);

  // The menu only exists below the header breakpoint.
  useEffect(() => {
    const onResize = () => { if (innerWidth >= 1080) setMenuOpen(false); };
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  useEffect(() => () => { if (pending.current) clearTimeout(pending.current); }, []);

  const value = useMemo<UI>(
    () => ({ modal, open, close, closeThen, exited, menuOpen, setMenuOpen, active, goTo }),
    [modal, open, close, closeThen, exited, menuOpen, active, goTo]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
