import type { ChangeEvent, ReactNode } from "react";
import { ModalButton } from "@/components/shared/Actions";
import { STRUGGLES_MAX } from "@/lib/waitlist/constants";
import styles from "./StrugglesField.module.css";

/**
 * The optional open question on both waitlist forms, worded for who is answering. All answers go in the
 * same column; the row's `role` says which question it answers.
 */
const QUESTIONS: Record<string, { question: string; placeholder: string; hint: ReactNode }> = {
  // Nobody watches this field live and someone may write here on a very bad day, so it says so and points to help.
  "Someone looking for support": {
    question: "What's been hard for you lately?",
    placeholder: "Sleep, exams, family, feeling alone… a line or two is plenty.",
    hint: (
      <>
        It helps us build SAANS around what people really go through. Only our team reads it, and we can&apos;t reply
        here. If you need someone right now,{" "}
        <ModalButton modal="help" asLink className={styles.link}>
          get help now
        </ModalButton>
        .
      </>
    ),
  },
  "A clinician": {
    question: "What's hardest about your practice right now?",
    placeholder: "Notes, no-shows, clients going quiet between sessions…",
    hint: "It helps us build SAANS around how you really work. Only our team reads it. Please leave out client names and details.",
  },
  "From a college": {
    question: "What's your biggest challenge with student wellbeing?",
    placeholder: "Long waits for counsellors, students not reaching out, exam season…",
    hint: "It helps us build SAANS around what your campus really needs. Only our team reads it. Please leave out student names and details.",
  },
};

export function StrugglesField({ role, value, onChange }: { role: string; value: string; onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void }) {
  const q = QUESTIONS[role];
  if (!q) return null;
  return (
    <div className={styles.wrap}>
      <label className="field-label">
        <span>
          {q.question} <span className="field-optional">(optional)</span>
        </span>
        <textarea value={value} onChange={onChange} rows={3} maxLength={STRUGGLES_MAX} placeholder={q.placeholder} className="field" />
      </label>
      <p className={styles.hint}>{q.hint}</p>
    </div>
  );
}
