import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { WaitlistConfigError } from "./server";

const SEND_TIMEOUT_MS = 8_000;

/** A failed send. Carries only the status: the provider's reply could echo the address. */
export class WaitlistEmailError extends Error {
  constructor(readonly status: number) {
    super(`confirmation email failed (status ${status})`);
  }
}

/** The link's secret. Only its hash is stored, so a database leak gives nobody a working link. */
export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function mailConfig() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.WAITLIST_FROM_EMAIL;
  if (!key || !from) throw new WaitlistConfigError("RESEND_API_KEY and WAITLIST_FROM_EMAIL must both be set");
  return {
    key,
    from,
    url: process.env.RESEND_API_URL || "https://api.resend.com/emails",
    // From config, never the request's Host header: a forged header must not put another site in the email.
    site: (process.env.SITE_URL || "https://saans.me").replace(/\/$/, ""),
  };
}

/** Called before anything is stored, so a missing key fails cleanly. */
export const assertMailConfigured = () => void mailConfig();

async function send(message: { to: string; subject: string; text: string; html: string }) {
  const { key, from, url } = mailConfig();
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    body: JSON.stringify({ from, ...message, to: [message.to] }),
  });
  if (!r.ok) throw new WaitlistEmailError(r.status);
}

const BODY_STYLE = "font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#16141D;max-width:480px";

/**
 * Nothing about why someone joined goes in these emails: not their answer, not their role. Inboxes get seen
 * by other people, and the address may not belong to the person who typed it.
 *
 * The token is in the URL's fragment, which browsers don't send to servers, so it stays out of access logs.
 */
export async function sendConfirmEmail(to: string, token: string) {
  const { site } = mailConfig();
  const link = `${site}/waitlist/confirm#token=${token}`;
  await send({
    to,
    subject: "Confirm your spot on the SAANS waitlist",
    text: `Hi,\n\nPlease confirm your spot on the SAANS waitlist:\n${link}\n\nThis link works for 7 days. If this wasn't you, just ignore this email and what was sent will be deleted.\n\nSAANS\n`,
    html: `<div style="${BODY_STYLE}">
<p>Hi,</p>
<p>Please confirm your spot on the SAANS waitlist.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#3B3355;color:#FFFFFF;font-weight:700;text-decoration:none">Confirm my spot</a></p>
<p style="font-size:14px;color:#5F5A6E">This link works for 7 days. If this wasn't you, just ignore this email and what was sent will be deleted.</p>
<p>SAANS</p>
</div>`,
  });
}

/** Someone already confirmed filled in the form again. Only this inbox learns that they're on the list. */
export async function sendAlreadyOnListEmail(to: string) {
  await send({
    to,
    subject: "You're already on the SAANS waitlist",
    text: "Hi,\n\nYou're already on the SAANS waitlist, so there's nothing else to do. We'll email you when we open.\n\nIf this wasn't you, someone may have typed your address by mistake. You can ignore this email.\n\nSAANS\n",
    html: `<div style="${BODY_STYLE}">
<p>Hi,</p>
<p>You're already on the SAANS waitlist, so there's nothing else to do. We'll email you when we open.</p>
<p style="font-size:14px;color:#5F5A6E">If this wasn't you, someone may have typed your address by mistake. You can ignore this email.</p>
<p>SAANS</p>
</div>`,
  });
}
