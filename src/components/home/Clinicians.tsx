import { ModalButton } from "@/components/shared/Actions";
import { Laptop } from "@/components/shared/Devices";
import { Icon, type IconName } from "@/components/shared/Icon";
import styles from "./Clinicians.module.css";

const SCREEN = "/screens/pro-ask.webp";
const ALT = "SAANS Pro: Ask SAANS about a client, with cited answers";

/** ≥1200px: floating callouts beside the laptop (exact reference positions). */
const CALLOUTS: { pos: React.CSSProperties; title: string; text: string }[] = [
  { pos: { left: -232, top: 60 }, title: "Morning brief", text: "Who needs you first today, and why." },
  { pos: { left: -232, top: 270 }, title: "Between sessions", text: "Early flags when someone drifts off track." },
  { pos: { right: -232, top: 60 }, title: "Notes drafted for you", text: "Review and sign in minutes." },
  { pos: { right: -232, top: 270 }, title: "Ask about any client", text: "Cited answers, from shared data only." },
];

/** <1200px: the same four features as a grid under the laptop. */
const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "search", title: "Ask about any client", text: "Cited answers, from shared data only." },
  { icon: "sunrise", title: "Morning brief", text: "Who needs you first today, and why." },
  {
    icon: "pulse",
    title: "Between sessions",
    text: "Check-ins, sleep and measures as they happen. Early flags when someone drifts off track.",
  },
  { icon: "doc", title: "Notes drafted for you", text: "Review and sign in minutes." },
];

export function Clinicians() {
  return (
    <section id="clinicians" data-screen-label="Clinicians" className={styles.section}>
      <span aria-hidden="true" className={styles.glow} />
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <p data-reveal="up" className={styles.eyebrow}>
            For clinicians · SAANS Pro
          </p>
          <h2 data-reveal="up" data-reveal-delay="60" className={styles.title}>
            Stuck on a case? Ask SAANS.
          </h2>
          <p data-reveal="up" data-reveal-delay="120" className={styles.copy}>
            SAANS Pro gives therapists and psychiatrists context between sessions. Ask about a client and get answers
            with sources, drawn only from what they chose to share.
          </p>
          <div data-reveal="up" data-reveal-delay="180" className={styles.actions}>
            <ModalButton modal="clinician" className="btn btn-lav">
              Join the clinician pilot
            </ModalButton>
          </div>
        </div>

        {/* ≥1200px */}
        <div data-reveal="scale" className={styles.annot}>
          <Laptop src={SCREEN} alt={ALT} sizes="700px" />
          {CALLOUTS.map((c) => (
            <div key={c.title} className={styles.callout} style={c.pos}>
              <strong>{c.title}</strong>
              <span>{c.text}</span>
            </div>
          ))}
        </div>

        {/* <1200px */}
        <div className={styles.plain}>
          <div data-reveal="scale" className={styles.plainLaptop}>
            <Laptop src={SCREEN} alt={ALT} />
          </div>
          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <Icon name={f.icon} size={20} strokeWidth={1.8} />
                </span>
                <span className={styles.featureText}>
                  <strong>{f.title}</strong>
                  <span>{f.text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
