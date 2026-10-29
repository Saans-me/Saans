"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Logo } from "./icons";
import { useUI } from "./UIProvider";
import s from "./Hero.module.css";

/** Seconds per breath of the hero orb (the prototype's `orbCycle` prop). */
const ORB_CYCLE = 6;

// [left %, top %, size px, colour]
const MOTES: [number, number, number, string][] = [
  [18, 22, 10, "var(--accent)"], [78, 18, 7, "var(--primary)"], [86, 64, 12, "var(--accent)"],
  [12, 72, 8, "var(--primary)"], [64, 86, 6, "var(--primary)"], [40, 10, 6, "var(--accent)"],
];

export function Hero() {
  const { open } = useUI();
  // The example chat plays on a loop: 0 first message, 1 reply, 2 typing, 3–5 full exchange.
  const [step, setStep] = useState(3);
  const orbRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStep(0);
    const t = setInterval(() => setStep(n => (n + 1) % 6), 2000);
    return () => clearInterval(t);
  }, []);

  // Card tilts toward the pointer and the orb drifts with it (mouse / trackpad only).
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        if (orbRef.current) orbRef.current.style.transform = `translate(${(nx * 40).toFixed(1)}px,${(ny * 32).toFixed(1)}px)`;
        if (cardRef.current) cardRef.current.style.transform = `perspective(1000px) rotateX(${(-ny * 6).toFixed(2)}deg) rotateY(${(nx * 8).toFixed(2)}deg)`;
      });
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => { removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section aria-labelledby="hero-title" className={s.section}>
      <div data-scroll="hero" className={s.panel}>
        <div className={s.copy}>
          <h1 id="hero-title" data-hero="1" className={s.title}>
            Everyone deserves <span className={s.accent}>someone to talk to.</span>
          </h1>
          <p data-hero="1" className={s.lead}>
            A caring companion that listens at any hour, by voice or text, in your language. And when you need more, a gentle path to qualified professionals.
          </p>
          <div data-hero="1" className={s.ctas}>
            <button type="button" onClick={e => open("coming", e)} className={s.primary}>Start talking, free</button>
            <button type="button" onClick={e => open("breath", e)} className={s.secondary}>
              <span aria-hidden="true" className={s.dot} />
              <span className={s.nowrap}>Try a 1-minute breath</span>
            </button>
          </div>
        </div>

        <div data-parallax="0.04" className={s.visual}>
          <div ref={orbRef} aria-hidden="true" className={s.orbWrap}>
            <div className={s.orbInner}>
              <div className={s.orb} style={{ animationDuration: `${ORB_CYCLE}s` }} />
              {MOTES.map(([l, t, sz, bg], i) => (
                <span
                  key={i}
                  className={s.mote}
                  style={{ left: `${l}%`, top: `${t}%`, width: sz, height: sz, background: bg, animationDuration: `${7 + i * 1.3}s`, animationDelay: `${-i * 1.7}s` }}
                />
              ))}
            </div>
          </div>
          <div data-hero="1" className={s.float}>
            <div ref={cardRef} role="group" aria-label="Example conversation with saans" className={s.card}>
              <div className={s.cardHead}>
                <span className={s.avatar}><Logo width={20} height={22} /></span>
                <span className={s.who}>
                  <span className={s.whoName}>saans</span>
                  <span className={s.whoSub}>Here for you, any hour</span>
                </span>
              </div>
              <div className={s.thread}>
                <div className={s.bot}>Hi, I&apos;m here. How has today been, really?</div>
                {step >= 1 && <div className={`${s.user} ${s.pop}`}>Honestly? Long. I can&apos;t switch my head off.</div>}
                {step === 2 && (
                  <div className={s.typing}>
                    <span aria-hidden="true" className={s.dots}>
                      {[0, 1, 2].map(i => <span key={i} style={{ animationDelay: `${i * 0.16}s` }} />)}
                    </span>
                  </div>
                )}
                {step >= 3 && (
                  <div className={`${s.bot} ${s.pop}`}>That sounds heavy. Want to tell me what&apos;s looping, or breathe together for a minute first?</div>
                )}
              </div>
              <button type="button" onClick={e => open("coming", e)} className={s.cardBtn}>
                Start talking<ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
