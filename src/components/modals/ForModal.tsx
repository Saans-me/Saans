"use client";

import { ArrowRight, Check } from "../icons";
import { useUI } from "../UIProvider";
import { GlassModal, PanelClose } from "./GlassModal";
import p from "./Panel.module.css";
import s from "./ForModal.module.css";

type Level = { tag: string; title: string; body: string; cta: string; action: "coming" | "breath" | "care"; points: string[]; footnote: string };

const LEVELS: Level[] = [
  {
    tag: "Companionship",
    title: "When you feel alone",
    body: "Even with people around, it's possible to feel unheard. saans is a friendly companion you can talk to whenever you need.",
    cta: "Start talking",
    action: "coming",
    points: ["Everyday conversations by text or voice", "A non-judgemental space to share anything", "Optional mood check-ins and a private journal", "Hindi, Hinglish, English and regional languages"],
    footnote: "Built to support your real-world relationships, never to replace them.",
  },
  {
    tag: "Everyday support",
    title: "When things feel heavy",
    body: "Stress, overthinking, pressure at work or college, relationship worries, low mood. saans helps you name it and find what helps.",
    cta: "Try a 1-minute breath",
    action: "breath",
    points: ["Guided conversations to understand your feelings", "Mood and pattern tracking over time", "Breathing, grounding and coping exercises", "A gentle nudge toward a professional if things persist"],
    footnote: "saans doesn't diagnose. It helps you reflect and cope, and seek help early.",
  },
  {
    tag: "Professional care",
    title: "When it's been hard for a while",
    body: "If low mood has lasted, or getting through the day feels hard, a conversation alone may not be enough. We help you reach human care.",
    cta: "See how care works",
    action: "care",
    points: ["Supportive conversations within clear safety limits", "Verified professionals, online or in person", "Share approved notes with your professional", "Follow-up reminders, only with your consent"],
    footnote: "saans doesn't treat depression on its own. Qualified people do, and we help you get to them.",
  },
];

export function ForModal() {
  const { modal, close, open, closeThen } = useUI();
  const act = (a: Level["action"]) => (a === "breath" ? closeThen("breath", 620) : open(a));
  return (
    <GlassModal open={modal === "for"} onClose={close} labelledBy="for-ov-title" variant="dark" zIndex={95} padding="clamp(12px,4vw,48px)">
      <PanelClose onClose={close} label="Close who it's for" />
      <div className={`${p.body} ${p.bodyRoomy}`}>
        <div data-ci="1" style={{ maxWidth: 720 }}>
          <p className={`${p.eyebrow} ${p.eyebrowLg}`}>WHO IT&apos;S FOR</p>
          <h2 id="for-ov-title" className={`${p.h2} ${p.h2Lg}`}>Support that meets you where you are.</h2>
          <p className={`${p.lead} ${p.leadLg}`}>Different days need different kinds of help. Start wherever feels right, and move between levels whenever you need to.</p>
        </div>
        <div className={s.levels}>
          {LEVELS.map((l, i) => (
            <div key={l.tag} data-ci="1" className={`${p.divider} ${s.level}`}>
              <div className={s.left}>
                <span className={s.meter}>
                  <span aria-hidden="true" className={s.bars}>
                    {[0, 1, 2].map(k => <span key={k} className={k <= i ? s.barOn : s.bar} />)}
                  </span>
                  <span className={s.tag}>{l.tag}</span>
                </span>
                <h3 className={s.h3}>{l.title}</h3>
                <p className={s.body}>{l.body}</p>
                <button type="button" onClick={() => act(l.action)} className={i === 0 ? p.accentBtn : p.ghostBtn}>
                  {l.cta}<ArrowRight size={16} />
                </button>
              </div>
              <div className={s.right}>
                <ul className={s.points}>
                  {l.points.map(pt => (
                    <li key={pt}><span className={s.tick}><Check size={18} sw={2.2} style={{ flex: "none", marginTop: 3 }} /></span><span>{pt}</span></li>
                  ))}
                </ul>
                <p className={`${p.divider} ${s.footnote}`}>{l.footnote}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassModal>
  );
}
