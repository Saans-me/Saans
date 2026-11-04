import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { ModalButton, SectionLink, SurveyLink } from "@/components/shared/Actions";
import { CONTACT_EMAIL, SOCIAL } from "@/lib/content";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Logo letterSpacing={false} />
          <p className={styles.tag}>Someone to talk to, any hour. Real care when you need it.</p>
          <div className={styles.social}>
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                title={s.title}
                className={styles.socialLink}
                {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.col}>
          <span className={styles.colHead}>Product</span>
          <SectionLink id="for-you" className={styles.link}>
            For you
          </SectionLink>
          <SectionLink id="clinicians" className={styles.link}>
            For clinicians
          </SectionLink>
          <SectionLink id="colleges" className={styles.link}>
            For colleges
          </SectionLink>
          <ModalButton modal="film" asLink className={styles.link}>
            Watch the film
          </ModalButton>
        </div>

        <div className={styles.col}>
          <span className={styles.colHead}>Company</span>
          <Link href="/about" className={styles.link}>
            About
          </Link>
          <Link href="/faq" className={styles.link}>
            FAQ
          </Link>
          <SurveyLink className={styles.link}>
            Take the survey
            <Icon name="external" size={13} />
          </SurveyLink>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
            Contact <span className={styles.muted}>{CONTACT_EMAIL}</span>
          </a>
        </div>

        <div className={styles.col}>
          <span className={styles.colHead}>Trust</span>
          <Link href="/privacy" className={styles.link}>
            Privacy and safety
          </Link>
          <Link href="/privacy-policy" className={styles.link}>
            Privacy policy
          </Link>
          <Link href="/terms" className={styles.link}>
            Terms
          </Link>
          <Link href="/help" className={styles.link}>
            Get help now
          </Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <span className={styles.nowrap}>© 2026 SAANS</span>
          <span className={styles.disclaimer}>
            SAANS is a supportive companion, not a medical or emergency service. If you&apos;re in danger, call your local
            emergency number.
          </span>
        </div>
      </div>
    </footer>
  );
}
