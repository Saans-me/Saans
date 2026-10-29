"use client";

import type { ReactNode } from "react";
import { ArrowRight, Check, Lock, Search, Video } from "./icons";
import { useUI } from "./UIProvider";
import ui from "./ui.module.css";
import s from "./ProfessionalCare.module.css";

const STEPS: [ReactNode, string, string][] = [
  [<Search key="i" size={18} sw={1.8} />, "Choose someone who fits", "01"],
  [<Video key="i" size={18} sw={1.8} />, "Meet online or in person", "02"],
  [<Lock key="i" size={18} sw={1.8} />, "Share only what you choose", "03"],
];

function ProfileCard() {
  return (
    <div className={s.profile}>
      <div className={s.profileTop}>
        <span className={s.initials}>AS</span>
        <span className={s.profileWho}>
          <strong>Dr. Ananya Sharma</strong>
          <span>Clinical psychologist</span>
        </span>
        <span className={s.tick}><Check size={13} sw={3} /></span>
      </div>
      <div className={s.tags}><span>Hindi · English</span><span>Anxiety</span><span>Stress</span></div>
      <div className={s.profileFoot}>
        <span className={s.where}>Online &amp; in person</span>
        <span className={s.book}>Book session</span>
      </div>
    </div>
  );
}

export function ProfessionalCare() {
  const { open } = useUI();
  return (
    <section id="care" aria-labelledby="care-title" className={s.section}>
      <div className={s.panel}>
        <div className={s.copy}>
          <div>
            <p data-reveal="up" className={ui.eyebrow}>PROFESSIONAL CARE</p>
            <h2 data-reveal="line" data-reveal-delay="80" id="care-title" className={ui.h2} style={{ maxWidth: 520 }}>When you need more than a conversation.</h2>
          </div>
          <ul data-reveal="up" data-reveal-delay="140" className={s.steps}>
            {STEPS.map(([icon, label, n]) => (
              <li key={n}>
                <span className={s.stepIcon}>{icon}</span>
                <strong>{label}</strong>
                <span className={s.stepNum}>{n}</span>
              </li>
            ))}
          </ul>
          <button type="button" data-reveal="up" onClick={e => open("care", e)} className={s.cta}>
            See how it works<ArrowRight size={16} />
          </button>
        </div>

        {/* ≥640px: tilted, floating demo cards */}
        <div data-reveal="scale" aria-hidden="true" className={s.stage}>
          <div data-parallax="0.03" className={s.callCard}>
            <div className={s.modes}><span className={s.modeOn}>Video</span><span>Audio</span><span>In person</span></div>
            <div className={s.screen}>
              <span className={s.screenOrb} />
              <span className={s.pip} />
              <span className={s.controls}><span /><span /><span className={s.hangup} /></span>
            </div>
          </div>
          <div className={s.profileFloat}><ProfileCard /></div>
          <div className={s.notesChip}>
            <span className={s.chipIcon}><Lock size={14} /></span>Approved notes only
          </div>
          <div className={s.confirmChip}>
            <span className={s.okIcon}><Check size={14} sw={3} /></span>Session confirmed
          </div>
        </div>

        {/* Phone: a simple stack */}
        <div aria-hidden="true" className={s.phoneStack}>
          <ProfileCard />
          <div className={s.phoneChips}>
            <span className={s.phoneNotes}><span className={s.phoneChipIcon}><Lock size={13} /></span>Approved notes only</span>
            <span className={s.phoneConfirm}><span className={s.phoneOk}><Check size={13} sw={3} /></span>Session confirmed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
