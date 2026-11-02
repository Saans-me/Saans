import { ModalButton } from "@/components/shared/Actions";
import { Icon } from "@/components/shared/Icon";
import { CollegesTabs } from "./CollegesTabs";
import styles from "./Colleges.module.css";

/** 16 semester weeks; `e` marks exam weeks (mid-sems: 7–8, end-sems: 15–16). */
const WEEKS: { h: number; e?: boolean }[] = [
  { h: 32 }, { h: 36 }, { h: 34 }, { h: 40 }, { h: 44 }, { h: 52 },
  { h: 78, e: true }, { h: 86, e: true },
  { h: 48 }, { h: 42 }, { h: 40 }, { h: 46 }, { h: 50 }, { h: 58 },
  { h: 84, e: true }, { h: 92, e: true },
];

const STATS = [
  { n: "4,212", label: "Students using SAANS" },
  { n: "49", label: "Requests this week" },
  { n: "10+", label: "Smallest group shown" },
];

const URGENT = "#E8792F";
const SOON = "#B9A23A";
const WEEK = "#7A8FD6";

const REQUESTS = [
  { initials: "AV", name: "Aman V.", course: "B.Tech · 1st year", urgency: "Urgent today", color: URGENT, action: "Contact now" },
  { initials: "TJ", name: "Tanvi J.", course: "BA Psychology · 2nd year", urgency: "Within 3 days", color: SOON, action: "Book a 1:1" },
  { initials: "MS", name: "Mohit S.", course: "M.Com · 1st year", urgency: "Within 3 days", color: SOON, action: "Offer a group" },
  { initials: "RS", name: "Riya S.", course: "B.Com · Final year", urgency: "This week", color: WEEK, action: "Start a program" },
];

const CONCERNS = [
  { label: "Missed classes", on: false },
  { label: "Withdrawn or very quiet", on: true },
  { label: "Seems very tired", on: false },
  { label: "Said something worrying", on: true },
];

function StressView() {
  return (
    <>
      <div className={styles.chartHead}>
        <strong className={styles.panelTitle}>Stress by week · Semester</strong>
        <span className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.swatch} />
            Normal
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swatchExam}`} />
            Exam week
          </span>
        </span>
      </div>
      <div
        role="img"
        aria-label="Weekly stress across 16 weeks, highest in mid-semester and end-semester exam weeks"
        className={styles.chart}
      >
        <span className={styles.examLabel} style={{ left: "37.5%" }}>
          Mid-sems
        </span>
        <span className={styles.examLabel} style={{ left: "87.5%" }}>
          End-sems
        </span>
        {WEEKS.map((w, i) => (
          <span
            key={i}
            data-grow="y"
            className={`${styles.bar} ${w.e ? styles.barExam : ""}`}
            style={{ height: `${w.h}%` }}
          />
        ))}
      </div>
      <div className={styles.stats}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statNum} data-count>
              {s.n}
            </span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function RequestsView() {
  return (
    <>
      <strong className={styles.panelTitle}>Requests · sorted by urgency</strong>
      <div className={styles.list}>
        {REQUESTS.map((r) => (
          <div key={r.initials} className={styles.row}>
            <span className={styles.avatar}>{r.initials}</span>
            <span className={styles.who}>
              <strong>{r.name}</strong>
              <span>{r.course}</span>
            </span>
            <span
              className={styles.urgency}
              style={{ background: `color-mix(in srgb, ${r.color} 18%, transparent)`, color: r.color }}
            >
              {r.urgency}
            </span>
            <span className={styles.action}>{r.action}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function FacultyView() {
  return (
    <>
      <strong className={styles.panelTitle}>Worried about a student?</strong>
      <div className={styles.form}>
        <div className={styles.fakeInput}>Student&apos;s name or roll number</div>
        <div className={styles.chips}>
          {CONCERNS.map((c) => (
            <span key={c.label} className={`${styles.chip} ${c.on ? styles.chipOn : ""}`}>
              {c.label}
            </span>
          ))}
        </div>
        <div className={styles.received}>
          <span className={styles.receivedTick}>
            <Icon name="check" size={14} strokeWidth={3} />
          </span>
          <span className={styles.receivedText}>Received. A counsellor will reach out gently.</span>
        </div>
      </div>
    </>
  );
}

export function Colleges() {
  return (
    <section id="colleges" data-screen-label="Colleges" className={`section zoom-md ${styles.section}`}>
      <div className="container">
        <CollegesTabs
          intro={
            <>
              <div>
                <p data-reveal="up" className={styles.eyebrow}>
                  For colleges · SAANS Campus
                </p>
                <h2 data-reveal="up" data-reveal-delay="60" className={styles.title}>
                  See when students struggle most.
                </h2>
              </div>
              <p data-reveal="up" data-reveal-delay="120" className={styles.copy}>
                Spot stress before exams, route every request by urgency, and let faculty flag a concern in under a
                minute. Colleges see totals, never names.
              </p>
            </>
          }
          actions={
            <div data-reveal="up" data-reveal-delay="220" className={styles.actions}>
              <ModalButton modal="college" className="btn btn-primary">
                Talk to us
              </ModalButton>
            </div>
          }
          panels={[<StressView key="stress" />, <RequestsView key="req" />, <FacultyView key="fac" />]}
        />
      </div>
    </section>
  );
}
