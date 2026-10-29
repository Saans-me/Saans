"use client";

import type { ReactNode } from "react";
import { ArrowRight, Chat, Check, Close, Mic, Toggle } from "./icons";
import { useUI } from "./UIProvider";
import ui from "./ui.module.css";
import s from "./Privacy.module.css";

const SETTINGS: [ReactNode, string, string, boolean][] = [
  [<Toggle key="i" size={16} />, "Memory", "Remember what I share", true],
  [<Chat key="i" size={16} />, "Chat history", "Keep for 30 days", false],
  [<Mic key="i" size={16} />, "Microphone", "Only when I tap", true],
];

const MEMORIES = ["Prefers Hindi", "Exams in March", "Likes short replies"];

export function Privacy() {
  const { open } = useUI();
  return (
    <section id="privacy" aria-labelledby="privacy-title" className={ui.section}>
      <div data-reveal="scale" data-scroll="grow" className={s.grid}>
        <div className={s.copy}>
          <div>
            <p className={ui.eyebrow}>PRIVACY &amp; SAFETY</p>
            <h2 id="privacy-title" className={ui.h2} style={{ maxWidth: 560 }}>
              Private by design.<br /><span className={s.muted}>Honest about limits.</span>
            </h2>
          </div>
          <p className={s.lead}>What you share is yours. Always.</p>
          <button type="button" onClick={e => open("privacy", e)} className={s.cta}>
            All privacy details<ArrowRight size={16} />
          </button>
        </div>

        <div aria-hidden="true" className={s.demo}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <strong>Privacy</strong>
              <span className={s.encrypted}><span className={s.greenDot} />Encrypted</span>
            </div>
            {SETTINGS.map(([icon, title, sub, on]) => (
              <div key={title} className={s.row}>
                <span className={s.rowIcon}>{icon}</span>
                <span className={s.rowText}><strong>{title}</strong><span>{sub}</span></span>
                <span className={`${s.switch} ${on ? s.switchOn : ""}`}><span /></span>
              </div>
            ))}
            <div className={s.memories}>
              <span className={s.memLabel}>WHAT SAANS REMEMBERS</span>
              <div className={s.memList}>
                {MEMORIES.map(m => (
                  <span key={m} className={s.mem}>{m}<span className={s.memX}><Close size={10} sw={2.6} /></span></span>
                ))}
              </div>
            </div>
            <div className={s.delete}>Delete everything</div>
          </div>
          <div className={s.cleared}>
            <span className={s.clearedIcon}><Check size={14} sw={2.8} /></span>Memory cleared
          </div>
        </div>
      </div>
    </section>
  );
}
