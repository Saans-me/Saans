import { HELPLINES, HELPLINE_OTHER } from "@/lib/content";
import { Icon } from "./Icon";
import styles from "./Helplines.module.css";

/**
 * Helpline list (README §10). Same content in HelpModal and /help.
 * `flushTop`: drop the top border of the first row (the /help page card, reference line 325).
 */
export function Helplines({ flushTop = false }: { flushTop?: boolean } = {}) {
  return (
    <ul className={styles.list}>
      {HELPLINES.map((h, i) => (
        <li key={h.name} className={flushTop && i === 0 ? `${styles.row} ${styles.flushTop}` : styles.row}>
          <span className={styles.meta}>
            <strong className={styles.name}>{h.name}</strong>
            <span className={styles.detail}>{h.detail}</span>
          </span>
          <a href={`tel:${h.tel}`} className={styles.call}>
            <Icon name="phone" size={15} />
            {h.display}
          </a>
        </li>
      ))}
      <li className={styles.row}>
        <span className={styles.otherText}>{HELPLINE_OTHER.text}</span>
        <a href={HELPLINE_OTHER.href} target="_blank" rel="noopener" className={styles.other}>
          <span title="Placeholder" className="ph">
            {HELPLINE_OTHER.display}
          </span>
          <Icon name="external" size={15} />
        </a>
      </li>
    </ul>
  );
}
