"use client";

import { useUI } from "./UIProvider";
import type { ModalKey } from "./UIProvider";
import ui from "./ui.module.css";
import s from "./WhoItsFor.module.css";

type Level = {
  n: string; size: number; numSize: number; turn: number; breathe: number; delay: number;
  tag: string; title: string; cta: string; modal: ModalKey; primary: boolean;
};

const LEVELS: Level[] = [
  { n: "01", size: 96, numSize: 21, turn: 40, breathe: 8, delay: 0, tag: "Companionship", title: "When you feel alone", cta: "Start talking", modal: "coming", primary: true },
  { n: "02", size: 136, numSize: 30, turn: 50, breathe: 9, delay: 0.3, tag: "Everyday support", title: "When things feel heavy", cta: "Try a 1-minute breath", modal: "breath", primary: false },
  { n: "03", size: 176, numSize: 39, turn: 60, breathe: 10, delay: 0.6, tag: "Professional care", title: "When it's been hard for a while", cta: "See how it works", modal: "care", primary: true },
];

export function WhoItsFor() {
  const { open } = useUI();
  return (
    <section id="for" aria-labelledby="for-title" className={s.section}>
      <div className={s.head}>
        <p data-reveal="up" className={ui.eyebrow}>WHO IT&apos;S FOR</p>
        <h2 data-reveal="line" data-reveal-delay="80" id="for-title" className={ui.h2} style={{ maxWidth: 640 }}>Support that meets you where you are.</h2>
      </div>
      <div className={s.wrap}>
        <span aria-hidden="true" className={s.line} />
        <div className={s.grid}>
          {LEVELS.map((l, i) => (
            <article key={l.n} data-reveal="up" data-reveal-delay={i * 120} className={s.item}>
              <div className={s.orbBox}>
                <span aria-hidden="true" className={s.orb} style={{ width: l.size, height: l.size }}>
                  <span className={s.dash} style={{ animationDuration: `${l.turn}s` }} />
                  <span className={s.ring} style={{ animationDelay: `${l.delay}s` }} />
                  <span className={s.core} style={{ animationDuration: `${l.breathe}s`, animationDelay: `${l.delay}s` }} />
                  <span className={s.n} style={{ fontSize: l.numSize }}>{l.n}</span>
                </span>
              </div>
              <span className={s.tag}>{l.tag}</span>
              <h3 className={s.h3}>{l.title}</h3>
              <button type="button" onClick={e => open(l.modal, e)} className={l.primary ? s.primary : s.ghost}>{l.cta}</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
