import Image from "next/image";
import { ModalButton } from "@/components/shared/Actions";
import { Icon, type IconName } from "@/components/shared/Icon";
import styles from "./Solution.module.css";

const STEPS: { n: string; icon: IconName; title: string; body: string; delay: string }[] = [
  { n: "01", icon: "chat", title: "Listens, any hour", body: "Text or voice, in English, Hindi or Hinglish.", delay: "0" },
  { n: "02", icon: "pulse", title: "Learns what helps you", body: "Notices patterns in your mood and sleep.", delay: "100" },
  {
    n: "03",
    icon: "stethoscope",
    title: "Brings in real care",
    body: "Your therapist or college, only if you say so.",
    delay: "200",
  },
];

/** Home §3: what SAANS is, the film (opens FilmModal), and three steps. */
export function Solution() {
  return (
    <section id="solution" data-screen-label="Solution" className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.head}>
          <p data-reveal="up" className={`eyebrow ${styles.eyebrow}`}>
            The solution
          </p>
          <h2 data-reveal="up" data-reveal-delay="60" className={`h2 ${styles.h2}`}>
            We built an AI companion that knows when to bring in a human.
          </h2>
          <p data-reveal="up" data-reveal-delay="120" className={styles.lead}>
            SAANS talks with you any hour and learns your patterns. When things get harder, it connects you to your
            therapist or your college, sharing only what you choose.
          </p>
        </div>

        <ModalButton
          modal="film"
          id="film"
          data-reveal="scale"
          aria-label="Play the film: SAANS in two minutes"
          className={styles.film}
        >
          <Image
            src="/film/frame-3.webp"
            alt=""
            fill
            sizes="(max-width: 1160px) 100vw, 1080px"
            className={styles.poster}
          />
          <span aria-hidden="true" className={styles.play}>
            <span className={styles.playRing} />
            <span className={styles.playDisc}>
              <Icon name="play" size={28} strokeWidth={1.8} />
            </span>
          </span>
          <span className={styles.caption}>SAANS in two minutes · 2:03</span>
        </ModalButton>

        <div className={styles.steps}>
          {STEPS.map((s) => (
            <div key={s.n} data-reveal="up" data-reveal-delay={s.delay} data-lift className={styles.step}>
              <span className={styles.stepNum}>{s.n}</span>
              <span className={styles.stepIcon}>
                <Icon name={s.icon} size={22} strokeWidth={1.8} />
              </span>
              <span className={styles.stepText}>
                <strong className={styles.stepTitle}>{s.title}</strong>
                <span className={styles.stepBody}>{s.body}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
