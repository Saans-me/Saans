import { ModalButton, SectionLink } from "@/components/shared/Actions";
import { Icon } from "@/components/shared/Icon";
import styles from "./Who.module.css";

/** Home §4: three kinds of moments (third card dark in both themes). */
export function Who() {
  return (
    <section id="who" data-screen-label="Who" className={`section zoom-md ${styles.section}`}>
      <div className="container">
        <h2 data-reveal="up" data-reveal-delay="60" className={`h2 ${styles.h2}`}>
          Built for three kinds of moments.
        </h2>
        <div className={styles.grid}>
          <article data-lift data-reveal="up" data-reveal-delay="0" className={styles.card}>
            <span className={styles.icon}>
              <Icon name="moon" size={24} strokeWidth={1.8} />
            </span>
            <h3 className={`h3 ${styles.h3}`}>When you feel alone</h3>
            <p className={styles.body}>
              It&apos;s 2 AM, your mind won&apos;t stop, and there&apos;s no one to call. SAANS is there, and it listens
              first.
            </p>
            <ModalButton modal="waitlist" asLink className={styles.link}>
              Join the waitlist
              <Icon name="arrow" size={16} strokeWidth={2} />
            </ModalButton>
          </article>

          <article data-lift data-reveal="up" data-reveal-delay="100" className={styles.card}>
            <span className={styles.icon}>
              <Icon name="chat" size={24} strokeWidth={1.8} />
            </span>
            <h3 className={`h3 ${styles.h3}`}>When you&apos;re not okay, but not ready for a doctor</h3>
            <p className={styles.body}>Talk it through, track your mood and sleep, and see what actually helps you.</p>
            <SectionLink id="for-you" tab={0} className={styles.link}>
              See what&apos;s inside
              <Icon name="arrow" size={16} strokeWidth={2} />
            </SectionLink>
          </article>

          <article data-lift data-reveal="up" data-reveal-delay="200" className={`${styles.card} ${styles.cardDark}`}>
            <span className={styles.icon}>
              <Icon name="stethoscope" size={24} strokeWidth={1.8} />
            </span>
            <h3 className={`h3 ${styles.h3}`}>When it&apos;s been hard for a while</h3>
            <p className={styles.body}>
              SAANS notices when things are getting worse and connects you to a verified professional, any time.
            </p>
            <SectionLink id="for-you" tab={4} className={styles.link}>
              How care works
              <Icon name="arrow" size={16} strokeWidth={2} />
            </SectionLink>
          </article>
        </div>
      </div>
    </section>
  );
}
