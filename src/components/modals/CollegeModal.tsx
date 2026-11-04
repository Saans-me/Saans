"use client";

import { useModal } from "@/context/ModalContext";
import { Icon } from "@/components/shared/Icon";
import { COLLEGE_ROLES, STUDENT_COUNTS } from "@/lib/content";
import { Select } from "@/components/shared/Select";
import { Honeypot } from "@/components/shared/Honeypot";
import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";
import styles from "./Modal.module.css";

export function CollegeModal() {
  const { forms, close } = useModal();
  const f = forms.cc;
  const v = f.values;

  if (f.done) {
    return (
      <div className={styles.done}>
        <span className={styles.tick}>
          <Icon name="check" size={28} strokeWidth={2.6} />
        </span>
        <h3 id="modal-title" className={styles.doneTitle}>
          Thanks. We&apos;ll reply within two working days.
        </h3>
        <button type="button" onClick={close} className="btn btn-ghost" style={{ marginTop: 8 }}>
          Close
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <span className={styles.badge}>SAANS CAMPUS</span>
        <h2 id="modal-title" className={styles.title}>
          Bring SAANS to your campus.
        </h2>
      </div>
      <form onSubmit={f.submit} noValidate className={styles.form}>
        <label className="field-label">
          <span>Name</span>
          <input type="text" value={v.name} onChange={f.set("name")} required autoComplete="name" className="field" />
        </label>
        <label className="field-label">
          <span>Work email</span>
          <input type="email" value={v.email} onChange={f.set("email")} required autoComplete="email" className="field" />
        </label>
        <label className="field-label">
          <span>College or university</span>
          <input
            type="text"
            value={v.college}
            onChange={f.set("college")}
            required
            autoComplete="organization"
            className="field"
          />
        </label>
        <div className={styles.grid2}>
          <label className="field-label">
            <span>Your role</span>
            <Select ariaLabel="Your role" value={v.role} onChange={f.setValue("role")} options={COLLEGE_ROLES} required />
          </label>
          <label className="field-label">
            <span>Number of students</span>
            <Select ariaLabel="Number of students" value={v.students} onChange={f.setValue("students")} options={STUDENT_COUNTS} />
          </label>
        </div>
        <Honeypot value={v[HONEYPOT_FIELD]} onChange={f.set(HONEYPOT_FIELD)} />
        <label className="field-label">
          <span>
            Message <span className="field-optional">(optional)</span>
          </span>
          <textarea value={v.message} onChange={f.set("message")} rows={3} className="field" />
        </label>
        {f.err && (
          <p role="alert" className="form-error">
            {f.err}
          </p>
        )}
        <button type="submit" disabled={f.sending} className={`btn btn-primary btn-block ${styles.submit}`}>
          {f.sending ? "Sending…" : "Send"}
        </button>
      </form>
    </>
  );
}
