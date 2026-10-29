"use client";

import { Logo } from "../icons";
import { useUI } from "../UIProvider";
import { GlassClose, GlassModal } from "./GlassModal";
import s from "./ComingSoonModal.module.css";

export function ComingSoonModal() {
  const { modal, close, closeThen } = useUI();
  return (
    <GlassModal open={modal === "coming"} onClose={close} labelledBy="cs-title" variant="light" zIndex={100} padding="20px" cardClassName={s.card}>
      <span aria-hidden="true" className={s.glowA} />
      <span aria-hidden="true" className={s.glowB} />
      <GlassClose onClose={close} label="Close" />
      <div className={s.content}>
        <span data-ci="1" aria-hidden="true" className={s.mark}>
          <span className={s.ring} />
          <span className={s.halo} />
          <Logo width={40} height={44} style={{ position: "relative" }} />
        </span>
        <span data-ci="1" className={s.badge}>COMING SOON</span>
        <h2 data-ci="1" id="cs-title" className={s.title}>saans is almost ready to listen.</h2>
        <p data-ci="1" className={s.text}>Voice and text conversations open soon, private from day one.</p>
        <div data-ci="1" className={s.actions}>
          <button type="button" onClick={() => closeThen("breath", 420)} className={s.primary}>Try a 1-minute breath</button>
          <button type="button" onClick={close} className={s.ghost}>Back to saans</button>
        </div>
      </div>
    </GlassModal>
  );
}
