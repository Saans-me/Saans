import { Icon, type IconName } from "@/components/shared/Icon";
import { LogoMark } from "@/components/shared/Logo";
import styles from "./Next.module.css";

const ROADMAP: { icon: IconName; label: string }[] = [
  { icon: "watch", label: "Wearables" },
  { icon: "video", label: "Video calls with SAANS" },
  { icon: "sparkle", label: "Our own models, built for how people really talk" },
];

export function Next() {
  return (
    <section id="next" data-screen-label="Next" className={styles.section}>
      <span aria-hidden="true" className={styles.glow} />
      <div className={styles.inner}>
        <p data-reveal="up" className={styles.eyebrow}>
          Where we&apos;re going
        </p>
        <h2 data-reveal="up" data-reveal-delay="60" className={styles.title}>
          Help that reaches you before you ask.
        </h2>
        <p data-reveal="up" data-reveal-delay="120" className={styles.copy}>
          Today, someone to talk to. Next, SAANS connects to your wearable, so it can notice a bad night or a racing
          heart and check in first.
        </p>

        <div data-reveal="scale" aria-hidden="true" className={styles.stage}>
          <div className={styles.watchWrap}>
            <span className={`${styles.ring} ${styles.ring1}`} />
            <span className={`${styles.ring} ${styles.ring2}`} />
            <span className={`${styles.ring} ${styles.ring3}`} />
            <div className={styles.watch}>
              <span className={styles.crown} />
              <div className={styles.screen}>
                <span className={styles.top}>
                  <span className={styles.hr}>
                    <span className={styles.beat}>
                      <Icon name="heart" size={15} strokeWidth={2.4} />
                    </span>
                    Heart rate
                  </span>
                  <span className={styles.muted}>9:48</span>
                </span>
                <span className={styles.bpmRow}>
                  <span className={styles.bpm} data-count>
                    118
                  </span>
                  <span className={styles.bpmUnit}>BPM</span>
                </span>
                <svg viewBox="0 0 160 50" aria-hidden="true" className={styles.line}>
                  <path
                    d="M2 40 C 20 38, 30 42, 44 36 S 70 34, 84 28 S 110 20, 124 14 S 148 6, 158 4"
                    fill="none"
                    stroke="#FF8A4C"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray="100"
                    data-draw="1"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.note}>
            <span className={styles.noteHead}>
              <LogoMark width={15} height={16} />
              <span className={styles.noteApp}>SAANS</span>
              <span className={styles.noteTime}>now</span>
            </span>
            <span className={styles.noteText}>Your heart&apos;s been racing all evening. Want to talk?</span>
          </div>
        </div>

        <ul data-reveal="up" className={styles.chips}>
          {ROADMAP.map((r) => (
            <li key={r.label} className={styles.chip}>
              <span className={styles.chipIcon}>
                <Icon name={r.icon} size={17} strokeWidth={1.8} />
              </span>
              {r.label}
              <span className={styles.coming}>COMING</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
