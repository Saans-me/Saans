"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { useSaansForm } from "@/lib/forms";
import { useUI } from "@/context/UIContext";

export type ModalName = "waitlist" | "clinician" | "college" | "breath" | "help" | "film";

const initWl = { email: "", role: "", country: "", survey: false };
const initCp = { name: "", email: "", role: "", country: "", clients: "", note: "" };
const initCc = { name: "", email: "", college: "", role: "", students: "", message: "" };

function useForms() {
  const wl = useSaansForm(initWl, { type: "user", required: ["role"], event: "waitlist_submit" });
  const cp = useSaansForm(initCp, { type: "clinician", required: ["name", "role"], event: "clinician_pilot_submit" });
  const cc = useSaansForm(initCc, { type: "college", required: ["name", "college", "role"], event: "college_contact_submit" });
  return { wl, cp, cc };
}
export type Forms = ReturnType<typeof useForms>;

type Ctx = {
  modal: ModalName | null;
  helpNote: boolean;
  /** Bumps every time a modal is (re)opened, so Breath can restart. */
  openId: number;
  open: (name: ModalName, opts?: { helpNote?: boolean }) => void;
  /** Animated close (the shell runs the exit animation, then unmounts). */
  close: () => void;
  forms: Forms;
  /** Internal: wiring between context and ModalShell. */
  _registerExit: (fn: (() => void) | null) => void;
  _finishClose: () => void;
};

const ModalContext = createContext<Ctx | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalName | null>(null);
  const [helpNote, setHelpNote] = useState(false);
  const [openId, setOpenId] = useState(0);
  const forms = useForms();
  const { setMenuOpen } = useUI();
  const returnFocus = useRef<HTMLElement | null>(null);
  const exitFn = useRef<(() => void) | null>(null);
  const modalRef = useRef<ModalName | null>(null);
  const { wl, cp, cc } = forms;
  const resetters = useRef({ wl: wl.resetStatus, cp: cp.resetStatus, cc: cc.resetStatus });
  useLayoutEffect(() => {
    modalRef.current = modal;
    resetters.current = { wl: wl.resetStatus, cp: cp.resetStatus, cc: cc.resetStatus };
  });

  const open = useCallback((name: ModalName, opts?: { helpNote?: boolean }) => {
    if (!modalRef.current) returnFocus.current = document.activeElement as HTMLElement | null;
    if (name === "waitlist") resetters.current.wl();
    if (name === "clinician") resetters.current.cp();
    if (name === "college") resetters.current.cc();
    setMenuOpen(false); // reference showModal: opening a popup closes the mobile menu
    setHelpNote(!!opts?.helpNote);
    setModal(name);
    setOpenId((n) => n + 1);
    const ev = ({ waitlist: "waitlist_open", help: "get_help_open", film: "film_play", breath: "breath_start" } as const)[
      name as "waitlist" | "help" | "film" | "breath"
    ];
    if (ev) track(ev, opts?.helpNote ? { from: "breath" } : undefined);
  }, [setMenuOpen]);

  const _finishClose = useCallback(() => {
    setModal(null);
    setHelpNote(false);
    const r = returnFocus.current;
    returnFocus.current = null;
    if (r && typeof r.focus === "function") r.focus({ preventScroll: true });
  }, []);

  const close = useCallback(() => {
    if (!modalRef.current) return;
    if (exitFn.current) exitFn.current();
    else _finishClose();
  }, [_finishClose]);

  const _registerExit = useCallback((fn: (() => void) | null) => {
    exitFn.current = fn;
  }, []);

  const value = useMemo(
    () => ({ modal, helpNote, openId, open, close, forms, _registerExit, _finishClose }),
    [modal, helpNote, openId, open, close, forms, _registerExit, _finishClose],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const c = useContext(ModalContext);
  if (!c) throw new Error("useModal must be used inside <ModalProvider>");
  return c;
}
