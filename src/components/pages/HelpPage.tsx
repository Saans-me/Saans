import { Helplines } from "@/components/shared/Helplines";
import inner from "./inner.module.css";
import styles from "./HelpPage.module.css";

/** /help (reference lines 320–327). No waitlist button on this page (README §8). */
export function HelpPage() {
  return (
    <section data-screen-label="Get help" className={inner.hero}>
      <div className={`container ${styles.wrap}`}>
        <span data-reveal="up" className={styles.badge}>
          <span className={styles.dot} />
          Get help now
        </span>
        <h1 data-reveal="up" data-reveal-delay="60" className={`${inner.h1} ${styles.h1}`}>
          You don&apos;t have to do this alone.
        </h1>
        <p data-reveal="up" data-reveal-delay="120" className={`${inner.lead} ${styles.lead}`}>
          If you&apos;re in danger right now, call your local emergency number. These lines are free, confidential and
          staffed by people who care.
        </p>
        <div data-reveal="up" data-reveal-delay="160" className={styles.card}>
          <Helplines flushTop />
        </div>
      </div>
    </section>
  );
}
