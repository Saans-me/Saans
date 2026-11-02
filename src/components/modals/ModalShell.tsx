"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useModal } from "@/context/ModalContext";
import { Icon } from "@/components/shared/Icon";
import { isPhone, prefersReducedMotion } from "@/hooks/useMediaQuery";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { WaitlistModal } from "./WaitlistModal";
import { ClinicianModal } from "./ClinicianModal";
import { CollegeModal } from "./CollegeModal";
import { BreathModal } from "./BreathModal";
import { HelpModal } from "./HelpModal";
import { FilmModal } from "./FilmModal";
import styles from "./Modal.module.css";

const ENTER = "cubic-bezier(.16,1,.3,1)";
const EXIT = "cubic-bezier(.4,0,.2,1)";

/** One shell drives every popup (README §9). Rendered outside the zoomed .page wrapper. */
export function ModalShell() {
  const { modal, close, _registerExit, _finishClose } = useModal();
  if (!modal) return null;
  return <ModalInner key="modal" modal={modal} close={close} registerExit={_registerExit} finishClose={_finishClose} />;
}

function ModalInner({
  modal,
  close,
  registerExit,
  finishClose,
}: {
  modal: NonNullable<ReturnType<typeof useModal>["modal"]>;
  close: () => void;
  registerExit: (fn: (() => void) | null) => void;
  finishClose: () => void;
}) {
  const scrimRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  useFocusTrap(cardRef, true);

  // Enter animation (once per open).
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const sheet = isPhone();
    scrimRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-out", fill: "backwards" });
    cardRef.current?.animate(
      sheet
        ? [{ transform: "translateY(100%)" }, { transform: "none" }]
        : [{ opacity: 0, transform: "translateY(26px) scale(.97)" }, { opacity: 1, transform: "none" }],
      { duration: sheet ? 560 : 650, easing: ENTER, fill: "backwards" },
    );
  }, []);

  // Exit animation, registered with the context so close() from anywhere animates out.
  useEffect(() => {
    registerExit(() => {
      if (closing.current) return;
      closing.current = true;
      let fin = false;
      const go = () => {
        if (fin) return;
        fin = true;
        finishClose();
      };
      if (prefersReducedMotion() || !cardRef.current) return go();
      const sheet = isPhone();
      scrimRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: "ease-in", fill: "forwards" });
      const a = cardRef.current.animate(
        sheet
          ? [{ transform: "none" }, { transform: "translateY(100%)" }]
          : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(16px) scale(.98)" }],
        { duration: 360, easing: EXIT, fill: "forwards" },
      );
      a.finished.then(go, go);
      setTimeout(go, 600);
    });
    return () => registerExit(null);
  }, [registerExit, finishClose]);

  // Esc to close + body scroll lock.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  // Focus the first control whenever the content changes (open, or waitlist → breath, breath → help).
  useEffect(() => {
    const card = cardRef.current;
    const f = card?.querySelector<HTMLElement>("button,a[href],input,select");
    const t = setTimeout(() => f?.focus({ preventScroll: true }), 90);
    return () => clearTimeout(t);
  }, [modal]);

  const width = { film: styles.wFilm, help: styles.wHelp, breath: styles.wBreath }[modal as "film" | "help" | "breath"] ?? styles.wForm;

  return (
    <div className={styles.overlay}>
      <div ref={scrimRef} className={styles.scrim} onClick={close} aria-hidden="true" />
      <div ref={cardRef} data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`${styles.card} ${width}`}>
        <span aria-hidden="true" className={styles.handle} />
        <button type="button" onClick={close} aria-label="Close" className={styles.close}>
          <Icon name="close" size={18} />
        </button>
        {modal === "waitlist" && <WaitlistModal />}
        {modal === "clinician" && <ClinicianModal />}
        {modal === "college" && <CollegeModal />}
        {modal === "breath" && <BreathModal />}
        {modal === "help" && <HelpModal />}
        {modal === "film" && <FilmModal />}
      </div>
    </div>
  );
}
