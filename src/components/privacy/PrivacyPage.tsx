import Link from "next/link";
import { Icon, type IconName } from "@/components/shared/Icon";
import { PrivacyCard } from "@/components/shared/PrivacyCard";
import inner from "@/components/pages/inner.module.css";
import styles from "./PrivacyPage.module.css";

const COLLECT: { icon: IconName; title: string; copy: string }[] = [
  { icon: "chat", title: "Conversations", copy: "To reply and remember what matters. Kept only as long as you choose." },
  { icon: "moon", title: "Check-ins and sleep", copy: "To show your progress and notice patterns." },
  { icon: "phone", title: "Contact details", copy: "To reach you, and your trusted person only if you've allowed it." },
];

const WHO: { icon: IconName; title: string; copy: string; primary?: boolean }[] = [
  { icon: "user", title: "You see", copy: "Everything you share, and every time your record is opened.", primary: true },
  {
    icon: "stethoscope",
    title: "Your therapist sees",
    copy: "Only what you tick: summaries, check-ins, sleep diary. Never your chats or journal.",
  },
  { icon: "campus", title: "Your college sees", copy: "Anonymous totals for groups of 10 or more. Never names." },
];

const PROMISES: { icon: IconName; label: string }[] = [
  { icon: "lock", label: "Never sold" },
  { icon: "shield", label: "Encrypted" },
  { icon: "close", label: "Delete in one tap" },
  { icon: "mic", label: "Mic only when you tap" },
  { icon: "check", label: "Verified professionals only" },
];

/** /privacy (reference lines 302–319). */
export function PrivacyPage() {
  return (
    <>
      <section data-screen-label="Privacy hero" className={`${inner.hero} ${styles.hero}`}>
        <div aria-hidden="true" className={styles.glow} />
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p data-reveal="up" className="eyebrow">
              Privacy and safety
            </p>
            <h1 data-reveal="up" data-reveal-delay="60" className={`${inner.h1} ${styles.h1}`}>
              Private by design. Honest about limits.
            </h1>
            <p data-reveal="up" data-reveal-delay="120" className={inner.lead}>
              What you share with SAANS is yours.
            </p>
          </div>
          <div data-reveal="scale" data-reveal-delay="120" className={styles.cardCol}>
            <PrivacyCard variant="page" />
          </div>
        </div>
      </section>

      <section id="collect" data-screen-label="What we collect" className={inner.section}>
        <div className="container">
          <h2 data-reveal="up" data-reveal-delay="60" className={inner.h2}>
            What we collect, and why
          </h2>
          <div data-reveal="up" className={styles.collect}>
            {COLLECT.map((row) => (
              <div key={row.title} className={styles.collectRow}>
                <span className={styles.collectLabel}>
                  <span className={styles.collectIcon}>
                    <Icon name={row.icon} size={22} strokeWidth={1.8} />
                  </span>
                  <strong className={styles.collectTitle}>{row.title}</strong>
                </span>
                <span className={styles.collectCopy}>{row.copy}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="who-sees" data-screen-label="Who sees what" className={inner.section}>
        <div className="container">
          <h2 data-reveal="up" data-reveal-delay="60" className={`${inner.h2} ${styles.whoTitle}`}>
            Who sees what
          </h2>
          <div className={styles.whoGrid}>
            {WHO.map((c, i) => (
              <div key={c.title} data-reveal="up" data-reveal-delay={String(i * 100)} data-lift className={`${inner.card} ${styles.whoCard}`}>
                <span className={c.primary ? `${styles.whoIcon} ${styles.whoIconPrimary}` : styles.whoIcon}>
                  <Icon name={c.icon} size={24} strokeWidth={1.8} />
                </span>
                <h3 className={inner.h3}>{c.title}</h3>
                <p className={`${inner.body} ${styles.whoCopy}`}>{c.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" data-screen-label="Safety" className={inner.section}>
        <div className="container">
          <div data-reveal="up" className={styles.safety}>
            <div className={styles.safetyHead}>
              <span className={styles.safetyIcon}>
                <Icon name="lifebuoy" size={24} strokeWidth={1.8} />
              </span>
              <h2 className={styles.safetyTitle}>Safety</h2>
            </div>
            <p className={styles.safetyCopy}>
              If SAANS sees signs of crisis, it shows helplines right away and, if you&apos;ve turned it on, alerts
              someone you trust. SAANS is a companion, not a doctor or an emergency service.
            </p>
          </div>
        </div>
      </section>

      <section id="promises" data-screen-label="Promises" className={inner.section}>
        <div className="container">
          <h2 data-reveal="up" data-reveal-delay="60" className={`${inner.h2} ${styles.promisesTitle}`}>
            Our promises
          </h2>
          <div data-reveal="up" className={styles.chips}>
            {PROMISES.map((p) => (
              <span key={p.label} className={styles.chip}>
                <span className={styles.chipIcon}>
                  <Icon name={p.icon} size={16} />
                </span>
                {p.label}
              </span>
            ))}
          </div>
          <div data-reveal="up" className={styles.legal}>
            <Link href="/privacy-policy" className={inner.arrowLink}>
              Privacy policy
              <Icon name="arrow" size={16} />
            </Link>
            <Link href="/terms" className={inner.arrowLink}>
              Terms
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
