"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Chat, Check, Heart, HeartPulse, Lock, Pill, Refresh, Search, Video } from "../icons";
import { useUI } from "../UIProvider";
import { GlassModal, PanelClose } from "./GlassModal";
import p from "./Panel.module.css";
import s from "./CareModal.module.css";

const STEPS: [ReactNode, string, string][] = [
  [<Search key="i" size={18} sw={1.8} />, "Choose someone who fits", "01"],
  [<Video key="i" size={18} sw={1.8} />, "Meet online or in person", "02"],
  [<Lock key="i" size={18} sw={1.8} />, "Share only what you choose", "03"],
];

const DAYS: [string, string][] = [["Mon", "14"], ["Tue", "15"], ["Wed", "16"], ["Thu", "17"], ["Fri", "18"]];
const TIMES = ["10:00", "12:30", "4:00", "6:30"];

const PROS: { initials: string; avatar: string; name: string; role: string; tags: string[]; where: string }[] = [
  { initials: "AS", avatar: "var(--soft2)", name: "Dr. Ananya Sharma", role: "Clinical psychologist", tags: ["Hindi · English", "Anxiety", "Stress"], where: "Online & in person" },
  { initials: "RM", avatar: "var(--soft1)", name: "Rahul Mehta", role: "Counselling psychologist", tags: ["Hindi · Gujarati", "Work stress", "Sleep"], where: "Online" },
];

const WHO: [ReactNode, string, string, string][] = [
  [<Chat key="i" size={22} sw={1.8} />, "Counsellors", "Stress, life changes, relationships.", "Talk"],
  [<HeartPulse key="i" size={22} sw={1.8} />, "Clinical psychologists", "Anxiety, depression, therapy.", "Therapy"],
  [<Refresh key="i" size={22} sw={1.8} />, "Psychotherapists", "Longer-term work on patterns.", "Long-term"],
  [<Pill key="i" size={22} sw={1.8} />, "Psychiatrists", "Diagnosis and medication.", "Medical"],
];

const HELPS = ["Anxiety", "Stress", "Low mood and depression", "Sleep", "Relationships", "Family", "Grief and loss", "Work and study pressure", "Self-esteem", "Loneliness", "Anger", "Trauma"];

const FIRST: [string, string][] = [
  ["01 · BEFORE", "Pick a time that suits you."],
  ["02 · DURING", "Get to know each other, at your pace."],
  ["03 · AFTER", "Book again, switch, or take a break."],
];

const SIGNS = [
  "Low mood or worry has lasted two weeks or more",
  "Sleep, appetite or energy have changed a lot",
  "Work, studies or relationships are getting harder to manage",
  "Things you used to enjoy no longer feel the same",
  "You'd simply like to talk to a trained person",
];

export function CareModal() {
  const { modal, close } = useUI();
  return (
    <GlassModal open={modal === "care"} onClose={close} labelledBy="care-ov-title" variant="dark" zIndex={95} padding="clamp(12px,4vw,48px)">
      <PanelClose onClose={close} label="Close professional care details" />
      <div className={p.body}>
        <div data-ci="1" style={{ maxWidth: 600 }}>
          <p className={p.eyebrow}>PROFESSIONAL CARE</p>
          <h2 id="care-ov-title" className={p.h2}>When you need more than a conversation.</h2>
          <p className={p.lead}>A qualified professional can help. saans helps you find the right person.</p>
        </div>

        <div className={s.split}>
          <div data-ci="1">
            <h3 className={p.h3}>Three calm steps.</h3>
            <ol className={s.steps}>
              {STEPS.map(([icon, label, n]) => (
                <li key={n} className={p.tile}>
                  <span className={s.stepIcon}>{icon}</span>
                  <strong>{label}</strong>
                  <span className={s.stepNum}>{n}</span>
                </li>
              ))}
            </ol>
            <div aria-hidden="true" className={`${p.tile} ${s.booking}`}>
              <div className={s.bookHead}><strong>Pick a time</strong><span>October</span></div>
              <div className={s.days}>
                {DAYS.map(([d, n]) => (
                  <span key={d} className={d === "Wed" ? s.dayOn : s.day}><span className={s.dayName}>{d}</span><span className={s.dayNum}>{n}</span></span>
                ))}
              </div>
              <div className={s.times}>
                {TIMES.map(t => <span key={t} className={t === "4:00" ? s.timeOn : s.time}>{t}</span>)}
              </div>
              <div className={s.share}>
                <span className={s.shareIcon}><Lock size={15} /></span>
                <span className={s.shareLabel}>Share approved notes</span>
                <span className={s.shareSwitch}><span /></span>
              </div>
              <div className={s.request}>Request Wed, 4:00 pm</div>
            </div>
          </div>

          <div data-ci="1" role="group" aria-label="Preview of finding a professional in saans" className={`${p.preview} ${s.finder}`}>
            <div className={p.previewHead}>
              <span aria-hidden="true" className={s.back}><ArrowLeft size={18} /></span>
              <strong style={{ fontSize: 15.5 }}>Find a professional</strong>
              <span className={p.previewBadge}>Preview</span>
            </div>
            <div className={s.finderBody}>
              <div className={s.search}><Search size={18} /><span>Search by concern or language</span></div>
              <div className={s.filters}>
                <span className={s.filterOn}>Anxiety</span>
                <span>Hindi</span>
                <span>Online</span>
                <span>In person</span>
              </div>
              {PROS.map(pro => (
                <div key={pro.initials} className={s.pro}>
                  <div className={s.proTop}>
                    <span aria-hidden="true" className={s.proAvatar} style={{ background: pro.avatar }}>{pro.initials}</span>
                    <span className={s.proWho}><strong>{pro.name}</strong><span>{pro.role}</span></span>
                    <span className={s.verified}><Check size={12} sw={3} />Verified</span>
                  </div>
                  <div className={s.proTags}>{pro.tags.map(t => <span key={t}>{t}</span>)}</div>
                  <div className={s.proFoot}>
                    <span className={s.proWhere}>{pro.where}</span>
                    <span className={s.viewProfile}>View profile</span>
                  </div>
                </div>
              ))}
              <div className={s.sent}>
                <span className={s.sentText}><strong>Session request sent</strong><span>Waiting for the professional to confirm</span></span>
              </div>
              <p className={s.note}>Example preview. Names are illustrative.</p>
            </div>
          </div>
        </div>

        <div data-ci="1">
          <h3 className={p.h3}>Who you can talk to.</h3>
          <div className={s.whoGrid}>
            {WHO.map(([icon, title, body, tag]) => (
              <div key={title} className={`${p.tile} ${p.tileHover} ${s.who}`}>
                <span className={s.whoIcon}>{icon}</span>
                <span className={s.whoText}><strong>{title}</strong><span>{body}</span></span>
                <span className={s.whoTag}>{tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-ci="1">
          <h3 className={p.h3}>What they can help with.</h3>
          <ul className={s.chips}>{HELPS.map(h => <li key={h} className={p.chip}>{h}</li>)}</ul>
        </div>

        <div data-ci="1">
          <h3 className={p.h3}>Your first session.</h3>
          <div className={s.firstGrid}>
            {FIRST.map(([k, v]) => (
              <div key={k} className={`${p.tile} ${s.first}`}><span className={s.firstKey}>{k}</span><span className={s.firstVal}>{v}</span></div>
            ))}
          </div>
        </div>

        <div data-ci="1">
          <h3 className={p.h3}>Is it time to reach out?</h3>
          <div className={s.reachGrid}>
            <div className={s.reachOrb}>
              <span aria-hidden="true" className={s.orb}>
                <span className={s.orbRing} />
                <span className={s.orbRing} style={{ animationDelay: "2s" }} />
                <span className={s.orbGlow} />
                <span className={s.orbCore}><Heart size={22} /></span>
              </span>
              <p className={s.reachText}>There&apos;s no wrong time.</p>
            </div>
            <ul className={s.signs}>
              {SIGNS.map(t => (
                <li key={t} className={p.tile}><span className={s.signTick}><Check size={13} sw={2.6} /></span><span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
