"use client";

import { useModal } from "@/context/ModalContext";
import { Icon } from "@/components/shared/Icon";
import { CLIENT_COUNTS, CLINICIAN_ROLES, COUNTRY_OPTIONS } from "@/lib/content";
import { Select } from "@/components/shared/Select";
import styles from "./Modal.module.css";

export function ClinicianModal() {
  const { forms, close } = useModal();
  const f = forms.cp;
  const v = f.values;

  if (f.done) {
    return (
      <div className={styles.done}>
        <span className={styles.tick}>
          <Icon name="check" size={28} strokeWidth={2.6} />
        </span>
        <h3 id="modal-title" className={styles.doneTitle}>
          Thank you, we&apos;ll be in touch.
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
        <span className={styles.badge}>SAANS PRO</span>
        <h2 id="modal-title" className={styles.title}>
          Join the SAANS Pro pilot.
        </h2>
        <p className={styles.sub}>We&apos;ll reach out within a week.</p>
      </div>
      <form onSubmit={f.submit} noValidate className={styles.form}>
        <label className="field-label">
          <span>Full name</span>
          <input type="text" value={v.name} onChange={f.set("name")} required autoComplete="name" className="field" />
        </label>
        <label className="field-label">
          <span>Work email</span>
          <input type="email" value={v.email} onChange={f.set("email")} required autoComplete="email" className="field" />
        </label>
        <div className={styles.grid2}>
          <label className="field-label">
            <span>Role</span>
            <Select ariaLabel="Role" value={v.role} onChange={f.setValue("role")} options={CLINICIAN_ROLES} required />
          </label>
          <label className="field-label">
            <span>Country</span>
            <Select ariaLabel="Country" value={v.country} onChange={f.setValue("country")} options={COUNTRY_OPTIONS} />
          </label>
        </div>
        <label className="field-label">
          <span>Number of active clients</span>
          <Select ariaLabel="Number of active clients" value={v.clients} onChange={f.setValue("clients")} options={CLIENT_COUNTS} />
        </label>
        <label className="field-label">
          <span>
            What slows you down most between sessions? <span className="field-optional">(optional)</span>
          </span>
          <textarea value={v.note} onChange={f.set("note")} rows={3} className="field" />
        </label>
        {f.err && (
          <p role="alert" className="form-error">
            {f.err}
          </p>
        )}
        <button type="submit" disabled={f.sending} className={`btn btn-primary btn-block ${styles.submit}`}>
          {f.sending ? "Sending…" : "Request access"}
        </button>
      </form>
    </>
  );
}

