"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { MEMS } from "@/lib/content";
import { Icon } from "./Icon";
import styles from "./PrivacyCard.module.css";

type SwitchKey = "pref" | "hist" | "share";
type Priv = Record<SwitchKey, boolean>;

const DEFAULT_PRIV: Priv = { pref: true, hist: false, share: false };
const ALL_OFF: Priv = { pref: false, hist: false, share: false };
const KEYS: SwitchKey[] = ["pref", "hist", "share"];

/** Switch labels differ between the home preview and the /privacy hero (reference lines 173 and 312). */
const LABELS: Record<"home" | "page", Record<SwitchKey, string>> = {
  home: { pref: "Memory", hist: "Chat history", share: "Microphone" },
  page: { pref: "Remember my preferences", hist: "Save chat history", share: "Share notes with my professional" },
};

/**
 * Interactive "Your privacy" preview card.
 * - 3 switches (Memory on by default), toggled independently.
 * - Memory chips from MEMS, each removable ("Forget this").
 * - "Delete everything" clears memories, turns every switch off and shows the "Memory cleared" toast.
 * - When nothing is saved, "Reset preview" restores the defaults.
 * `variant` defaults to "page" on /privacy and "home" everywhere else.
 */
export function PrivacyCard({ className, variant }: { className?: string; variant?: "home" | "page" }) {
  const pathname = usePathname();
  const labels = LABELS[variant ?? (pathname === "/privacy" ? "page" : "home")];
  const { toast } = useToast();
  const [priv, setPriv] = useState<Priv>(DEFAULT_PRIV);
  const [mems, setMems] = useState<string[]>(() => MEMS.slice());

  const toggle = (k: SwitchKey) => setPriv((p) => ({ ...p, [k]: !p[k] }));
  const forget = (m: string) => setMems((s) => s.filter((x) => x !== m));
  const deleteAll = () => {
    setMems([]);
    setPriv(ALL_OFF);
    toast("Memory cleared");
  };
  const reset = () => {
    setMems(MEMS.slice());
    setPriv(DEFAULT_PRIV);
  };

  return (
    <div
      data-reveal="scale"
      role="group"
      aria-label="Preview of privacy controls"
      className={`${styles.card} ${className ?? ""}`}
    >
      <div className={styles.head}>
        <strong className={styles.title}>Your privacy</strong>
        <span className={styles.badge}>Preview</span>
      </div>

      {KEYS.map((k) => (
        <div key={k} className={styles.row}>
          <span className={styles.label}>{labels[k]}</span>
          <button
            type="button"
            role="switch"
            aria-checked={priv[k]}
            aria-label={labels[k]}
            onClick={() => toggle(k)}
            className={styles.switch}
          >
            <span className={styles.knob} />
          </button>
        </div>
      ))}

      <div className={styles.mem}>
        <span className={styles.memLabel}>WHAT SAANS REMEMBERS</span>
        {mems.length > 0 ? (
          <div className={styles.chips}>
            {mems.map((m) => (
              <span key={m} className={styles.chip}>
                {m}
                <button type="button" onClick={() => forget(m)} aria-label="Forget this" className={styles.forget}>
                  <Icon name="close" size={11} strokeWidth={2.6} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span>Nothing saved.</span>
            <button type="button" onClick={reset} className={styles.reset}>
              Reset preview
            </button>
          </div>
        )}
      </div>

      <button type="button" onClick={deleteAll} className={styles.delete}>
        Delete everything
      </button>
    </div>
  );
}
