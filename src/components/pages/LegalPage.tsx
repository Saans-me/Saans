import inner from "./inner.module.css";
import styles from "./LegalPage.module.css";

/**
 * Placeholder legal page (reference lines 372–385): /privacy-policy and /terms.
 * TODO before launch: replace the [date] and the placeholder body with the real text.
 */
export function LegalPage({
  title,
  screenLabel,
  placeholder,
}: {
  title: string;
  screenLabel: string;
  placeholder: string;
}) {
  return (
    <section data-screen-label={screenLabel} className={inner.hero}>
      <div className={`container ${styles.wrap}`}>
        <h1 data-reveal="up" data-reveal-delay="60" className={`${inner.h1} ${styles.h1}`}>
          {title}
        </h1>
        <p data-reveal="up" className={styles.updated}>
          Last updated{" "}
          <span title="Placeholder" className="ph">
            [date]
          </span>
        </p>
        <div data-reveal="up" className={styles.body}>
          <span title="Placeholder" className="ph">
            {placeholder}
          </span>
        </div>
      </div>
    </section>
  );
}
