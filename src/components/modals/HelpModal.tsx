"use client";

import { Close } from "../icons";
import { useUI } from "../UIProvider";
import { GlassModal } from "./GlassModal";
import s from "./HelpModal.module.css";

type Line = { name: string; detail: string; href: string; cta: string; primary?: boolean; external?: boolean };

const LINES: Line[] = [
  { name: "Emergency services", detail: "112 in India & Europe · 911 US · 999 UK", href: "tel:112", cta: "Call 112", primary: true },
  { name: "Tele-MANAS · India", detail: "24/7, free, many languages", href: "tel:14416", cta: "14416" },
  { name: "iCall · India", detail: "Trained counsellors, Mon–Sat", href: "tel:+919152987821", cta: "Call" },
  { name: "988 Lifeline · US", detail: "Call or text, 24/7", href: "tel:988", cta: "988" },
  { name: "Samaritans · UK & Ireland", detail: "24/7, free to call", href: "tel:116123", cta: "116 123" },
  { name: "Somewhere else?", detail: "Find a free line in your country", href: "https://findahelpline.com", cta: "Find a line", external: true },
];

/** Crisis lines, opened from the footer's "Get Help." */
export function HelpModal() {
  const { modal, close } = useUI();
  return (
    <GlassModal open={modal === "help"} onClose={close} labelledBy="help-title" variant="plain" scrimLabel="Close help options" zIndex={90} padding="16px">
      <button type="button" onClick={close} aria-label="Close help options" className={s.close}>
        <Close size={18} />
      </button>
      <h2 id="help-title" className={s.title}>You don&apos;t have to do this alone.</h2>
      <p className={s.lead}>If you&apos;re in danger right now, call your local emergency number. These lines are free, confidential and staffed by people who care.</p>
      <ul className={s.list}>
        {LINES.map(l => (
          <li key={l.name}>
            <span className={s.who}><strong>{l.name}</strong><span>{l.detail}</span></span>
            <a
              href={l.href}
              className={l.primary ? s.primary : s.outline}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {l.cta}
            </a>
          </li>
        ))}
      </ul>
    </GlassModal>
  );
}
