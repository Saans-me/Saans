import { SurveyLink } from "@/components/shared/Actions";
import { Icon } from "@/components/shared/Icon";
import styles from "./Survey.module.css";

export function Survey() {
  return (
    <section data-screen-label="Survey" className={styles.section}>
      <div className="container">
        <div data-reveal="up" className={styles.strip}>
          <p className={styles.text}>
            Help shape SAANS. <span className={styles.muted}>Take our 3-minute anonymous survey.</span>
          </p>
          <SurveyLink className={`btn btn-primary ${styles.cta}`}>
            Take the survey
            <Icon name="external" size={16} strokeWidth={2} />
          </SurveyLink>
        </div>
      </div>
    </section>
  );
}
