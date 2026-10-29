"use client";

import { Mic } from "./icons";
import { useUI } from "./UIProvider";
import ui from "./ui.module.css";
import s from "./WhatItDoes.module.css";

const LANGUAGES = ["English", "हिन्दी", "Hinglish", "বাংলা", "मराठी", "தமிழ்", "తెలుగు", "ગુજરાતી", "ಕನ್ನಡ", "മലയാളം", "ਪੰਜਾਬੀ", "ଓଡ଼ିଆ", "অসমীয়া", "اردو", "राजस्थानी"];

// [day, bar height %, highlighted]
const WEEK: [string, number, boolean][] = [["M", 62, false], ["T", 48, false], ["W", 70, false], ["T", 40, false], ["F", 55, false], ["S", 82, true], ["S", 76, false]];

const WAVE = [50, 80, 35, 100, 60, 90, 45, 75, 30, 95, 55, 70, 40, 85, 65, 100, 50, 90, 60, 45];

export function WhatItDoes() {
  const { open } = useUI();
  return (
    <section id="how" aria-labelledby="how-title" className={ui.section}>
      <div className={s.head}>
        <div>
          <p data-reveal="up" className={ui.eyebrow}>WHAT IT DOES</p>
          <h2 data-reveal="line" data-reveal-delay="80" id="how-title" className={ui.h2} style={{ maxWidth: 640 }}>A companion, not a chatbot.</h2>
        </div>
        <button data-reveal="up" data-reveal-delay="160" type="button" onClick={e => open("coming", e)} className={s.tryBtn}>Try it now</button>
      </div>

      <div className={s.grid}>
        <article data-reveal="up" className={`${s.card} ${s.chatCard}`}>
          <span className={s.num}>01 · Talk freely</span>
          <h3 className={`${s.h3} ${s.chatTitle}`}>Say it messy. saans keeps up.</h3>
          <p className={s.body}>Type or speak, at 3pm or 3am. Start with a word, a worry or a whole ramble.</p>
          <div aria-hidden="true" data-chat="1" className={s.chat}>
            <div className={s.me}>idk, today just felt heavy</div>
            <div className={s.them}>That&apos;s okay. Heavy how, like tired, or like worried?</div>
            <div className={s.me}>worried, mostly</div>
            <div className={s.them}>Let&apos;s slow it down together. Talk it through, or breathe first?</div>
            <div className={s.chips}><span>Talk it through</span><span>Breathe first</span></div>
            <div className={s.composer}>
              <span className={s.placeholder}>Type, or hold to talk</span>
              <span className={s.mic}><Mic size={18} /></span>
            </div>
          </div>
        </article>

        <article data-reveal="up" data-reveal-delay="120" className={`${s.card} ${s.langCard}`}>
          <span className={`${s.num} ${s.onDeep2}`}>02 · Your language</span>
          <h3 className={s.h3} style={{ maxWidth: "calc(100% - 120px)" }}>Speaks the way you do.</h3>
          <div aria-hidden="true" className={s.marqueeBox}>
            <div className={s.marquee}>
              {[...LANGUAGES, ...LANGUAGES].map((l, i) => <span key={i}>{l}</span>)}
            </div>
          </div>
          <p className={s.langNote}>15 Indian languages, by voice or text.</p>
        </article>

        <article data-reveal="up" data-reveal-delay="200" className={`${s.card} ${s.breathCard}`}>
          <span className={s.num}>03 · Breathe</span>
          <h3 className={s.h3} style={{ maxWidth: "12ch" }}>One minute, slower.</h3>
          <span aria-hidden="true" className={s.breathOrb} />
          <button type="button" onClick={e => open("breath", e)} className={s.breathBtn}>Breathe with me</button>
        </article>

        <article data-reveal="up" data-bars="1" className={`${s.card} ${s.patternCard}`}>
          <span className={s.num}>04 · Notice patterns</span>
          <h3 className={s.h3}>See what helps, over time.</h3>
          <div aria-hidden="true" className={s.bars}>
            {WEEK.map(([d, h, on], i) => (
              <span key={i} className={s.barCol}>
                <span data-bar="1" className={s.bar} style={{ height: `${h}%`, background: on ? "var(--primary)" : "var(--accent)", opacity: on ? 1 : 0.75 }} />
                <span className={s.day}>{d}</span>
              </span>
            ))}
          </div>
        </article>

        <article data-reveal="up" data-reveal-delay="120" className={`${s.card} ${s.voiceCard}`}>
          <span className={s.num}>05 · Voice</span>
          <h3 className={s.h3}>Talk out loud. Interrupt any time.</h3>
          <div aria-hidden="true" className={s.wave}>
            {WAVE.map((h, i) => (
              <span key={i} style={{ height: `${h}%`, animationDuration: `${(0.9 + (i % 5) * 0.18).toFixed(2)}s`, animationDelay: `${(-i * 0.13).toFixed(2)}s` }} />
            ))}
          </div>
          <button type="button" onClick={e => open("coming", e)} className={s.voiceBtn}>Try voice</button>
        </article>
      </div>
    </section>
  );
}
