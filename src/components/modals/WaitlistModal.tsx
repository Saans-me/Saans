"use client";

import { useModal } from "@/context/ModalContext";
import { LogoMark } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { SurveyLink } from "@/components/shared/Actions";
import { COUNTRY_OPTIONS, ROLE_OPTIONS } from "@/lib/content";
import { Select } from "@/components/shared/Select";
import { Honeypot } from "@/components/shared/Honeypot";
import { StrugglesField } from "@/components/shared/StrugglesField";
import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";
import styles from "./Modal.module.css";

export function WaitlistModal() {
  const { forms, open, close } = useModal();
  const f = forms.wl;
  const v = f.values;

  if (f.done) {
    return (
      <div className={styles.done}>
        <span className={styles.tick}>
          <Icon name="check" size={28} strokeWidth={2.6} />
        </span>
        <h3 id="modal-title" className={styles.doneTitle}>
          You&apos;re on the list.
        </h3>
        <p className={styles.doneText}>Thank you. While you wait, want to try a 1-minute breath?</p>
        <div className={styles.doneActions}>
          <button type="button" onClick={() => open("breath")} className="btn btn-primary btn-block">
            Try a 1-minute breath
          </button>
          <SurveyLink className="btn btn-ghost btn-block">
            Take the survey
            <Icon name="external" size={15} />
          </SurveyLink>
          <button type="button" onClick={close} className={styles.plainClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <span style={{ marginBottom: 14 }}>
          <LogoMark width={29} height={32} />
        </span>
        <h2 id="modal-title" className={styles.title}>
          Be one of the first to try SAANS.
        </h2>
        <p className={styles.sub}>We&apos;ll email you once, when we open. Nothing else.</p>
      </div>
      <form onSubmit={f.submit} noValidate className={styles.form}>
        <label className="field-label">
          <span>Email</span>
          <input type="email" value={v.email} onChange={f.set("email")} required autoComplete="email" className="field" />
        </label>
        <label className="field-label">
          <span>I am</span>
          <Select ariaLabel="I am" value={v.role} onChange={f.setValue("role")} options={ROLE_OPTIONS} required />
        </label>
        {v.role === "A clinician" && (
          <a
            href="#"
            className={styles.more}
            onClick={(e) => {
              e.preventDefault();
              open("clinician");
            }}
          >
            Want to tell us more?
          </a>
        )}
        {v.role === "From a college" && (
          <a
            href="#"
            className={styles.more}
            onClick={(e) => {
              e.preventDefault();
              open("college");
            }}
          >
            Want to tell us more?
          </a>
        )}
        <label className="field-label">
          <span>Country</span>
          <Select ariaLabel="Country" value={v.country} onChange={f.setValue("country")} options={COUNTRY_OPTIONS} />
        </label>
        <StrugglesField value={v.struggles} onChange={f.set("struggles")} />
        <label className={styles.check}>
          <input type="checkbox" checked={!!v.survey} onChange={f.set("survey")} />
          I&apos;d also like to answer a 3-minute survey
        </label>
        <Honeypot value={v[HONEYPOT_FIELD]} onChange={f.set(HONEYPOT_FIELD)} />
        {f.err && (
          <p role="alert" className="form-error">
            {f.err}
          </p>
        )}
        <button type="submit" disabled={f.sending} className={`btn btn-primary btn-block ${styles.submit}`}>
          {f.sending ? "Joining…" : "Join the waitlist"}
        </button>
      </form>
    </>
  );
}
