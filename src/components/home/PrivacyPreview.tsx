import { Icon, type IconName } from "@/components/shared/Icon";
import { PrivacyCard } from "@/components/shared/PrivacyCard";
import styles from "./PrivacyPreview.module.css";

type PromiseItem = { icon: IconName; title: string; text: string };

const LEFT: PromiseItem[] = [
  { icon: "lock", title: "Your words stay yours", text: "Encrypted. Never sold. Delete in one tap." },
  { icon: "toggle", title: "Memory only with consent", text: "See, edit or erase what SAANS remembers." },
  { icon: "lifebuoy", title: "Real help when it matters", text: "Crisis lines and clear next steps, right away." },
];

const RIGHT: PromiseItem[] = [
  { icon: "mic", title: "Voice only when you say so", text: "The mic turns on only when you tap." },
  { icon: "info", title: "Honest about what it is", text: "A companion, not a doctor." },
  { icon: "shield", title: "Verified professionals", text: "Credentials checked before they appear." },
];

function Promises({ items, className }: { items: PromiseItem[]; className: string }) {
  return (
    <div className={`${styles.col} ${className}`}>
      {items.map((p, i) => (
        <div key={p.title} data-reveal="up" data-reveal-delay={String(i * 80)} className={styles.promise}>
          <span className={styles.icon}>
            <Icon name={p.icon} size={19} strokeWidth={1.8} />
          </span>
          <span className={styles.text}>
            <strong>{p.title}</strong>
            <span>{p.text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function PrivacyPreview() {
  return (
    <section id="privacy" data-screen-label="Privacy" className={`section zoom-md ${styles.section}`}>
      <div className="container">
        <div className={styles.head}>
          <h2 data-reveal="up" data-reveal-delay="60" className={styles.title}>
            Private by design. Honest about limits.
          </h2>
        </div>
        <div className={styles.row}>
          <Promises items={LEFT} className={styles.left} />
          <div className={styles.center}>
            <PrivacyCard variant="home" />
          </div>
          <Promises items={RIGHT} className={styles.right} />
        </div>
      </div>
    </section>
  );
}
