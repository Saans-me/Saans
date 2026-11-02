import { Faq } from "@/components/shared/Faq";
import { ModalButton } from "@/components/shared/Actions";
import { CONTACT_EMAIL } from "@/lib/content";
import inner from "./inner.module.css";
import styles from "./FaqPage.module.css";

/** /faq (reference lines 358–371). */
export function FaqPage() {
  return (
    <section data-screen-label="FAQ" className={inner.hero}>
      <div className={`container ${styles.wrap}`}>
        <h1 data-reveal="up" data-reveal-delay="60" className={`${inner.h1} ${styles.h1}`}>
          Questions
        </h1>
        <div data-reveal="up" data-reveal-delay="120" className={styles.list}>
          <Faq />
        </div>
        <div data-reveal="up" className={styles.bottom}>
          <ModalButton modal="waitlist" className="btn btn-primary">
            Join the waitlist
          </ModalButton>
          <span className={styles.contact}>
            Still unsure? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.email}>
              {CONTACT_EMAIL}
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
