"use client";

import { useCallback, useState } from "react";
import { track, type AnalyticsEvent } from "./analytics";

// README §9 "Forms". Every form POSTs JSON to one endpoint with a `type` field.

export type FormType = "user" | "clinician" | "college";
export type FormStatus = "idle" | "sending" | "done";

export const ERR_EMAIL = "Please enter a valid email.";
export const ERR_REQUIRED = "Please fill in the required fields.";
export const ERR_GENERIC = "Something went wrong. Please try again.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function roleType(role: string): FormType {
  return role === "A clinician" ? "clinician" : role === "From a college" ? "college" : "user";
}

export async function postForm(type: FormType, data: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_FORM_ENDPOINT;
  const body = { type, ...data };
  if (url) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error("bad");
  } else {
    // No endpoint configured: simulate success (same as the reference).
    await new Promise((r) => setTimeout(r, 700));
  }
}

type Values = Record<string, string | boolean>;

/**
 * Small form state machine shared by every SAANS form.
 * `required` lists fields (besides email) that must be non-empty.
 */
export function useSaansForm<T extends Values>(
  initial: T,
  opts: {
    type: FormType | ((v: T) => FormType);
    required: (keyof T)[];
    event: AnalyticsEvent;
  },
) {
  const [values, setValues] = useState<T>(initial);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [err, setErr] = useState("");

  const set = useCallback(
    <K extends keyof T>(k: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const t = e.target as HTMLInputElement;
        const v = (t.type === "checkbox" ? t.checked : t.value) as T[K];
        setValues((s) => ({ ...s, [k]: v }));
        setErr("");
      },
    [],
  );

  /** For custom controls (e.g. <Select onChange={setValue("role")} />). */
  const setValue = useCallback(
    <K extends keyof T>(k: K) =>
      (v: T[K]) => {
        setValues((s) => ({ ...s, [k]: v }));
        setErr("");
      },
    [],
  );

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!EMAIL_RE.test(String(values.email || "").trim())) return setErr(ERR_EMAIL);
      for (const k of opts.required) {
        if (!String(values[k] ?? "").trim()) return setErr(ERR_REQUIRED);
      }
      setStatus("sending");
      setErr("");
      const type = typeof opts.type === "function" ? opts.type(values) : opts.type;
      try {
        await postForm(type, values);
        setStatus("done");
        track(opts.event, { type });
      } catch {
        setStatus("idle");
        setErr(ERR_GENERIC);
      }
    },
    [values, opts],
  );

  /** Reset only the status/error, keeping typed values (reference behaviour on re-open). */
  const resetStatus = useCallback(() => {
    setStatus("idle");
    setErr("");
  }, []);

  return { values, set, setValue, submit, status, err, resetStatus, sending: status === "sending", done: status === "done" };
}
