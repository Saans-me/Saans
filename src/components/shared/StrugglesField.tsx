import type { ChangeEvent } from "react";
import { ModalButton } from "@/components/shared/Actions";
import { STRUGGLES_MAX } from "@/lib/waitlist/constants";
import styles from "./StrugglesField.module.css";

/**
 * The optional "what's been hard" question on both waitlist forms. Nobody watches this field live, so
 * it always says so and points to help: someone may write here on a very bad day.
 */
export function StrugglesField({ value, onChange }: { value: string; onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <div className={styles.wrap}>
      <label className="field-label">
        <span>
          What&apos;s been hard for you lately? <span className="field-optional">(optional)</span>
        </span>
        <textarea
          value={value}
          onChange={onChange}
          rows={3}
          maxLength={STRUGGLES_MAX}
          placeholder="Sleep, exams, family, feeling alone… a line or two is plenty."
          className="field"
        />
      </label>
      <p className={styles.hint}>
        It helps us build SAANS around what people really go through. Only our team reads it, and we can&apos;t reply
        here. If you need someone right now,{" "}
        <ModalButton modal="help" asLink className={styles.link}>
          get help now
        </ModalButton>
        .
      </p>
    </div>
  );
}
