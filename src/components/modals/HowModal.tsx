"use client";

import { ArrowRight } from "../icons";
import { useUI } from "../UIProvider";
import { GlassModal, PanelClose } from "./GlassModal";
import p from "./Panel.module.css";
import s from "./HowModal.module.css";

const FEATURES: [string, string][] = [
  ["Talk freely", "Type or speak, at 3pm or 3am. Say it messy; saans keeps up and asks gentle questions."],
  ["Your language", "15 Indian languages including Hindi and Hinglish, by voice or text. Switch any time, even mid-sentence."],
  ["Breathe", "One-minute breathing and grounding exercises for when your body needs to slow down."],
  ["Notice patterns", "Optional mood check-ins build a picture over time, so you can see what helps."],
  ["Voice", "Talk out loud and interrupt any time. The mic is on only when you tap it."],
];

const TOOLS = ["Mood tracker", "Private journal", "Daily check-ins", "Reflection prompts", "Coping toolkit", "Progress insights", "Your preferences"];

export function HowModal() {
  const { modal, close, open, closeThen } = useUI();
  return (
    <GlassModal open={modal === "how"} onClose={close} labelledBy="how-ov-title" variant="dark" zIndex={95} padding="clamp(12px,4vw,48px)">
      <PanelClose onClose={close} label="Close what it does" />
      <div className={`${p.body} ${p.bodyRoomy}`}>
        <div data-ci="1" style={{ maxWidth: 720 }}>
          <p className={`${p.eyebrow} ${p.eyebrowLg}`}>WHAT IT DOES</p>
          <h2 id="how-ov-title" className={`${p.h2} ${p.h2Lg}`}>A companion, not a chatbot.</h2>
          <p className={`${p.lead} ${p.leadLg}`}>saans listens first, asks gentle questions, and offers small things that help. Use it by text or voice, whenever you need.</p>
        </div>
        <div className={s.features}>
          {FEATURES.map(([title, body], i) => (
            <div key={title} data-ci="1" className={`${p.divider} ${s.feature}`}>
              <span className={s.num}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={s.h3}>{title}</h3>
              <p className={s.body}>{body}</p>
            </div>
          ))}
        </div>
        <div data-ci="1" className={s.tools}>
          <div className={s.toolsCopy}>
            <h3 className={s.toolsTitle}>Gentle tools, all optional.</h3>
            <p className={s.toolsBody}>No streaks, and no guilt for a missed day or a hard one.</p>
          </div>
          <ul className={s.toolList}>{TOOLS.map(t => <li key={t}>{t}</li>)}</ul>
        </div>
        <div data-ci="1" className={s.actions}>
          <button type="button" onClick={() => open("coming")} className={p.accentBtn}>Start talking<ArrowRight size={16} /></button>
          <button type="button" onClick={() => closeThen("breath", 620)} className={p.ghostBtn}>Try a 1-minute breath<ArrowRight size={16} /></button>
        </div>
      </div>
    </GlassModal>
  );
}
