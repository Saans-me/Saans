import Image from "next/image";
import { Icon } from "@/components/shared/Icon";
import { ModalButton } from "@/components/shared/Actions";
import inner from "./inner.module.css";
import styles from "./AboutPage.module.css";

const PROMISE = ["Always private", "Always honest about its limits", "Always in your language"];

export const TEAM: { id: string; name: string; role: string; line: string; photo: string }[] = [
  { id: "team-1", name: "Divyansh", role: "CEO", line: "FDE @ Vanna Protocol", photo: "/team/divyansh-portrait.webp" },
  { id: "team-2", name: "Arshdeep", role: "Co-founder", line: "Software Engineer @ JA Assure", photo: "/team/arshdeep-portrait.webp" },
  { id: "team-3", name: "Advay", role: "Co-founder", line: "SDE @ Vanna Protocol", photo: "/team/advay-portrait.webp" },
];

/** /about (reference lines 328–357). */
export function AboutPage() {
  return (
    <>
      <section data-screen-label="About hero" className={inner.hero}>
        <div className="container">
          <p data-reveal="up" className={`eyebrow ${styles.eyebrow}`}>
            About SAANS
          </p>
          <h1 data-reveal="up" data-reveal-delay="60" className={`${inner.h1} ${styles.h1}`}>
            Built for the moments in between.
          </h1>
          <p data-reveal="up" data-reveal-delay="140" className={styles.story}>
            Most hard moments don&apos;t happen in a therapist&apos;s office.{" "}
            <span className={styles.storyMuted}>They happen at 2 AM, the night before an exam, on the walk home.</span>{" "}
            We built SAANS for three kinds of people: those who feel alone, those who aren&apos;t okay but won&apos;t
            see a doctor, and those who need a clinician fast. SAANS is there for all three.
          </p>
        </div>
      </section>

      <section id="promise" data-screen-label="Promise and vision" className={inner.section}>
        <div className="container">
          <div className={styles.promiseGrid}>
            <div data-reveal="up" className={inner.card}>
              <p className={`eyebrow ${styles.cardEyebrow}`}>Our promise</p>
              <ul className={styles.promiseList}>
                {PROMISE.map((p) => (
                  <li key={p} className={styles.promiseItem}>
                    <span className={styles.promiseCheck}>
                      <Icon name="check" size={15} strokeWidth={2.6} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal="up" data-reveal-delay="100" className={styles.vision}>
              <p className={`eyebrow ${styles.visionEyebrow}`}>Our vision</p>
              <p className={styles.visionCopy}>
                Wherever you are in the world, SAANS is the first place you turn when you&apos;re struggling, and it
                connects you to everyone who can help.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="team" data-screen-label="Team" className={inner.section}>
        <div className="container">
          <h2 data-reveal="up" data-reveal-delay="60" className={`${inner.h2} ${styles.teamTitle}`}>
            Team
          </h2>
          <div className={styles.teamGrid}>
            {TEAM.map((m, i) => (
              <div key={m.id} data-reveal="up" data-reveal-delay={String(i * 80)} data-lift className={styles.member}>
                <div className={styles.photo}>
                  <Image src={m.photo} alt={m.name} fill sizes="(max-width: 640px) 100vw, 380px" className={styles.photoImg} />
                </div>
                <span className={styles.memberMeta}>
                  <strong className={styles.memberName}>{m.name}</strong>
                  <span className={styles.memberRole}>{m.role}</span>
                </span>
                <span className={styles.memberLine}>{m.line}</span>
              </div>
            ))}
          </div>
          <p data-reveal="up" className={styles.teamCopy}>
            We met organising hackathons together and have been building side by side ever since.
          </p>
          <div data-reveal="up" className={styles.cta}>
            <ModalButton modal="waitlist" className="btn btn-primary">
              Join the waitlist
            </ModalButton>
          </div>
        </div>
      </section>
    </>
  );
}
