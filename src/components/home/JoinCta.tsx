"use client";

import { Icon } from "@/components/shared/Icon";
import { LogoMark } from "@/components/shared/Logo";
import { COUNTRY_OPTIONS, ROLE_OPTIONS } from "@/lib/content";
import { postWaitlist, roleType, useSaansForm } from "@/lib/forms";
import { Select } from "@/components/shared/Select";
import { Honeypot } from "@/components/shared/Honeypot";
import { StrugglesField } from "@/components/shared/StrugglesField";
import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";
import styles from "./JoinCta.module.css";

const INITIAL = { email: "", role: "", country: "", struggles: "", [HONEYPOT_FIELD]: "" };

const FORM_OPTS = {
  type: (v: typeof INITIAL) => roleType(v.role),
  required: ["role" as const],
  event: "waitlist_submit" as const,
  post: (v: typeof INITIAL) => postWaitlist("join_section", v),
};

export function JoinCta() {
  const { values, set, setValue, submit, err, sending, done } = useSaansForm(INITIAL, FORM_OPTS);

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
              <Honeypot value={values[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
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
              <div className={styles.role}>
                <Select
                  ariaLabel="Country"
                  value={values.country}
                  onChange={setValue("country")}
                  options={COUNTRY_OPTIONS}
                  placeholder="Country"
                  className={styles.roleBtn}
                />
              </div>
              {values.role && (
                <div className={styles.struggles}>
                  <StrugglesField role={values.role} value={values.struggles} onChange={set("struggles")} />
                </div>
              )}
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
            <strong className={styles.doneText}>Check your inbox to confirm your spot.</strong>
          </div>
        )}

        <p className={styles.note}>No spam. One email to confirm, one when we open.</p>
      </div>
    </section>
  );
}
