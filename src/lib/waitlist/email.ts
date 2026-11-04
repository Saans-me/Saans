import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { markEmailFailed, markEmailSent, WaitlistConfigError, WaitlistStoreError, type InterestTable } from "./server";

const SEND_TIMEOUT_MS = 8_000;

/** A failed send. Carries only the status: the provider's reply could echo the address. 0 means no reply. */
export class WaitlistEmailError extends Error {
  constructor(readonly status: number) {
    super(`email failed (status ${status})`);
  }
}

/** The link's secret. Only its hash is stored, so a database leak gives nobody a working link. */
export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * An IP as a keyed hash, for counting emails per IP without keeping any IP. Null when it can't be counted:
 * without the salt the hash could be reversed, and "unknown" would put everyone in one bucket.
 */
export function hashIp(ip: string) {
  const salt = process.env.WAITLIST_IP_SALT;
  if (!salt) {
    console.error("[waitlist] WAITLIST_IP_SALT is not set, so emails per IP aren't limited");
    return null;
  }
  return ip === "unknown" ? null : createHmac("sha256", salt).update(ip).digest("hex");
}

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

type Message = { to: string; subject: string; text: string; html: string };

/** Returns Resend's id for the email. */
async function send(message: Message) {
  const { key, from, url } = mailConfig();
  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      body: JSON.stringify({ from, ...message, to: [message.to] }),
    });
  } catch {
    throw new WaitlistEmailError(0);
  }
  if (!r.ok) throw new WaitlistEmailError(r.status);
  const { id } = (await r.json().catch(() => ({}))) as { id?: string };
  if (!id) throw new WaitlistEmailError(r.status);
  return id;
}

const BODY_STYLE = "font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#16141D;max-width:480px";
const SMALL_STYLE = "font-size:14px;color:#5F5A6E";
const BUTTON_STYLE = "display:inline-block;padding:12px 22px;border-radius:999px;background:#3B3355;color:#FFFFFF;font-weight:700;text-decoration:none";

/**
 * Nothing about why someone joined goes in these emails: not their answer, not their role. Inboxes get seen
 * by other people, and the address may not belong to the person who typed it.
 *
 * The token is in the URL's fragment, which browsers don't send to servers, so it stays out of access logs.
 */
function confirmMessage(to: string, token: string, reminder: boolean): Message {
  const { site } = mailConfig();
  const link = `${site}/waitlist/confirm#token=${token}`;
  const notMe = `${site}/waitlist/not-me#token=${token}`;
  const lead = reminder ? "Your spot on the SAANS waitlist still needs confirming. This is the last email we'll send about it." : "Please confirm your spot on the SAANS waitlist.";
  return {
    to,
    subject: reminder ? "Still want your spot on the SAANS waitlist?" : "Confirm your spot on the SAANS waitlist",
    text: `Hi,\n\n${lead}\n${link}\n\nThis link works for 30 days.\n\nDidn't sign up? Someone may have typed your address by mistake. Remove it here, and we won't email you again:\n${notMe}\n\nSAANS\n`,
    html: `<div style="${BODY_STYLE}">
<p>Hi,</p>
<p>${lead}</p>
<p><a href="${link}" style="${BUTTON_STYLE}">Confirm my spot</a></p>
<p style="${SMALL_STYLE}">This link works for 30 days.</p>
<p style="${SMALL_STYLE}">Didn't sign up? Someone may have typed your address by mistake. <a href="${notMe}" style="color:#5F5A6E">Remove it here</a>, and we won't email you again.</p>
<p>SAANS</p>
</div>`,
  };
}

/** Someone already confirmed filled in the form again. Only this inbox learns that they're on the list. */
function alreadyMessage(to: string): Message {
  return {
    to,
    subject: "You're already on the SAANS waitlist",
    text: "Hi,\n\nYou're already on the SAANS waitlist, so there's nothing else to do. We'll email you when we open.\n\nIf this wasn't you, someone may have typed your address by mistake. You can ignore this email.\n\nSAANS\n",
    html: `<div style="${BODY_STYLE}">
<p>Hi,</p>
<p>You're already on the SAANS waitlist, so there's nothing else to do. We'll email you when we open.</p>
<p style="${SMALL_STYLE}">If this wasn't you, someone may have typed your address by mistake. You can ignore this email.</p>
<p>SAANS</p>
</div>`,
  };
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A new clinician or college form, for the team. What they wrote stays in the database, out of an inbox. */
function teamMessage(to: string, table: InterestTable, form: { name: string; email: string; role: string }): Message {
  const what = table === "clinician_interest" ? "clinician" : "college";
  const lines = [`Name: ${form.name}`, `Email: ${form.email}`, `Role: ${form.role}`];
  return {
    to,
    subject: `New ${what} form on saans.me`,
    text: `A new ${what} form came in.\n\n${lines.join("\n")}\n\nThe full answers are in Supabase, in ${table}.\n`,
    html: `<div style="${BODY_STYLE}">
<p>A new ${what} form came in.</p>
<p>${lines.map(escapeHtml).join("<br>")}</p>
<p style="${SMALL_STYLE}">The full answers are in Supabase, in ${table}.</p>
</div>`,
  };
}

/** What a failure means for the next try. */
function nextStep(e: unknown) {
  if (e instanceof WaitlistConfigError) return "queue";
  const status = e instanceof WaitlistEmailError ? e.status : 0;
  if (status === 401 || status === 403 || status === 429) return "queue"; // our key or quota: wait, no try used up
  return status >= 400 && status < 500 ? "never" : "retry"; // Resend refused this message, or it's having a bad time
}

/**
 * Sends one email and records what happened. Never throws: the form fill is already safe, and a failed email
 * is on record for the daily job to try again.
 */
async function deliver(emailId: string, build: () => Message) {
  let resendId: string;
  try {
    resendId = await send(build());
  } catch (e) {
    if (e instanceof WaitlistConfigError) console.error(`[waitlist] not configured: ${e.message}`);
    else console.error(`[waitlist] ${e instanceof WaitlistEmailError ? e.message : "email failed"}`);
    await markEmailFailed(emailId, e instanceof WaitlistEmailError ? e.status : 0, nextStep(e)).catch(logStoreFailure);
    return false;
  }
  await markEmailSent(emailId, resendId).catch(logStoreFailure);
  return true;
}

function logStoreFailure(e: unknown) {
  console.error(`[waitlist] couldn't record an email's result (${e instanceof WaitlistStoreError ? e.message : e instanceof Error ? e.name : "unknown"})`);
}

export function deliverSignupEmail(emailId: string, kind: "confirm" | "reminder" | "already", to: string, token: string) {
  return deliver(emailId, () => (kind === "already" ? alreadyMessage(to) : confirmMessage(to, token, kind === "reminder")));
}

export function deliverTeamNotice(emailId: string, to: string, table: InterestTable, form: { name: string; email: string; role: string }) {
  return deliver(emailId, () => teamMessage(to, table, form));
}

/** Where the team's notifications go. */
export const teamAddress = () => (process.env.WAITLIST_TEAM_EMAIL || "admin@saans.me").trim().toLowerCase();
