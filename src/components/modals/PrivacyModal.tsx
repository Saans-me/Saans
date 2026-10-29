"use client";

import type { ReactNode } from "react";
import { ArrowRight, Heart, Info, Lock, Mic, Shield, Toggle } from "../icons";
import { useUI } from "../UIProvider";
import { GlassModal, PanelClose } from "./GlassModal";
import p from "./Panel.module.css";
import s from "./PrivacyModal.module.css";

const CONTROLS: [string, boolean][] = [
  ["Remember my preferences", true],
  ["Save chat history", false],
  ["Share notes with my professional", false],
];

const TILES: [ReactNode, string, string][] = [
  [<Lock key="i" size={20} sw={1.8} />, "Your words stay yours", "Encrypted. Never sold. Delete in one tap."],
  [<Toggle key="i" size={20} sw={1.8} />, "Memory only with consent", "See, edit or erase it any time."],
  [<Heart key="i" size={20} sw={1.8} />, "Real help when it matters", "Crisis lines and clear next steps, right away."],
  [<Mic key="i" size={20} sw={1.8} />, "Voice, only when you say so", "Mic on only when you tap it."],
  [<Info key="i" size={20} sw={1.8} />, "Honest about what it is", "A companion, not a doctor."],
  [<Shield key="i" size={20} sw={1.8} />, "Verified professionals", "Credential-checked before they appear."],
];

export function PrivacyModal() {
  const { modal, close, open } = useUI();
  return (
    <GlassModal open={modal === "privacy"} onClose={close} labelledBy="priv-ov-title" variant="dark" zIndex={95} padding="clamp(12px,4vw,48px)">
      <PanelClose onClose={close} label="Close privacy and safety" />
      <div className={p.body}>
        <div className={s.top}>
          <div data-ci="1">
            <p className={p.eyebrow}>PRIVACY &amp; SAFETY</p>
            <h2 id="priv-ov-title" className={p.h2}>Private by design. <span className={p.muted}>Honest about limits.</span></h2>
            <p className={p.lead}>What you share with saans is yours.</p>
          </div>
          <div data-ci="1" role="group" aria-label="Preview of privacy controls in saans" className={`${p.preview} ${s.controls}`}>
            <div className={p.previewHead}>
              <span className={s.lockBadge}><Lock size={16} /></span>
              <strong style={{ fontSize: 15 }}>Your privacy</strong>
              <span className={p.previewBadge}>Preview</span>
            </div>
            <div className={s.controlList}>
              {CONTROLS.map(([label, on]) => (
                <div key={label} className={s.control}>
                  <span className={s.controlLabel}>{label}</span>
                  <span className={`${s.switch} ${on ? s.switchOn : ""}`}><span /></span>
                </div>
              ))}
              <div className={s.delete}>Delete everything</div>
            </div>
          </div>
        </div>

        <div data-ci="1" className={s.tiles}>
          {TILES.map(([icon, title, body]) => (
            <div key={title} className={`${p.tile} ${p.tileHover} ${s.tile}`}>
              <span className={s.tileIcon}>{icon}</span>
              <strong className={s.tileTitle}>{title}</strong>
              <span className={s.tileBody}>{body}</span>
            </div>
          ))}
        </div>

        <div data-ci="1" className={`${p.tile} ${s.ctaRow}`}>
          <p className={s.ctaText}>Want to talk to a qualified person?</p>
          <button type="button" onClick={() => open("care")} className={s.ctaBtn}>
            See how care works<ArrowRight size={16} />
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
