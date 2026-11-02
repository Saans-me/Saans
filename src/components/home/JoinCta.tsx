"use client";

import { Icon } from "@/components/shared/Icon";
import { LogoMark } from "@/components/shared/Logo";
import { ROLE_OPTIONS } from "@/lib/content";
import { roleType, useSaansForm } from "@/lib/forms";
import { Select } from "@/components/shared/Select";
import styles from "./JoinCta.module.css";

const FORM_OPTS = {
  type: (v: { email: string; role: string }) => roleType(v.role as string),
  required: ["role" as const],
  event: "waitlist_submit" as const,
};

export function JoinCta() {
  const { values, set, setValue, submit, err, sending, done } = useSaansForm({ email: "", role: "" }, FORM_OPTS);

  return (
    <section id="join" data-screen-label="Join" className={`zoom-md ${styles.section}`}>
      <div className={styles.inner}>
        <span data-reveal="up">
          <LogoMark width={37} height={40} />
        </span>
        <h2 data-reveal="up" data-reveal-delay="60" className={styles.title}>
          You don&apos;t have to carry it alone.
        </h2>
        <p data-reveal="up" data-reveal-delay="120" className={styles.sub}>
          Be one of the first to try SAANS.
        </p>

        {!done && (
          <>
            <form data-reveal="up" data-reveal-delay="180" onSubmit={submit} noValidate className={styles.form}>
              <input
                type="email"
                aria-label="Email"
                placeholder="Your email"
                autoComplete="email"
                value={values.email}
                onChange={set("email")}
                className={styles.email}
              />
              <div className={styles.role}>
                <Select
                  ariaLabel="I am"
                  value={values.role}
                  onChange={setValue("role")}
                  options={ROLE_OPTIONS}
                  placeholder="I am…"
                  required
                  className={styles.roleBtn}
                />
              </div>
              <button type="submit" disabled={sending} className={`btn btn-primary ${styles.submit}`}>
                {sending ? "Joining…" : "Join the waitlist"}
              </button>
            </form>
            {err && (
              <p role="alert" className={styles.error}>
                {err}
              </p>
            )}
          </>
        )}

        {done && (
          <div role="status" className={styles.done}>
            <span className={styles.doneTick}>
              <Icon name="check" size={17} strokeWidth={2.8} />
            </span>
            <strong className={styles.doneText}>You&apos;re on the list.</strong>
          </div>
        )}

        <p className={styles.note}>No spam. One email when we open.</p>
      </div>
    </section>
  );
}
