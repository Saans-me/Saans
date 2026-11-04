import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";
import { deliverSignupEmail, hashIp, newToken } from "@/lib/waitlist/email";
import { failed, isSameOrigin, readBody, reply } from "@/lib/waitlist/http";
import { hourlyMailCap, perIpMailCap } from "@/lib/waitlist/limits";
import { waitlistSchema } from "@/lib/waitlist/schema";
import { clientIp, isRateLimited } from "@/lib/waitlist/rate-limit";
import { submitSignup, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";

// Room for the longest answer in any script: 1,000 characters can be 4,000 bytes.
const MAX_BODY_BYTES = 6_144;

/**
 * Sending an email takes time, so without this an address already on the list (no email) would answer
 * faster than a new one, and the delay would reveal who has joined. Every accepted request takes at least
 * this long.
 */
const MIN_ACCEPTED_MS = 1_500;

export async function POST(req: Request) {
  const startedAt = Date.now();
  /** Every accepted request returns exactly this, after the same delay, whatever happened to its email. */
  const accepted = async () => {
    const left = MIN_ACCEPTED_MS - (Date.now() - startedAt);
    if (left > 0) await new Promise((r) => setTimeout(r, left));
    return reply(200, { ok: true });
  };

  if (!isSameOrigin(req)) return failed(403, "forbidden");
  // Requiring JSON also means a cross-site fetch must pass a CORS preflight, which this route never allows.
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return failed(415, "unsupported_media_type");
  }
  const ip = clientIp(req.headers);
  if (isRateLimited(ip)) return failed(429, "rate_limited");

  const raw = await readBody(req, MAX_BODY_BYTES);
  if (raw === null) return failed(413, "too_large");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return failed(400, "invalid");
  }
  if (typeof body !== "object" || body === null) return failed(400, "invalid");

  // Looks like success so a bot learns nothing; nothing is stored.
  if ((body as Record<string, unknown>)[HONEYPOT_FIELD]) return accepted();

  const parsed = waitlistSchema.safeParse(body);
  // Only the error code goes back. Zod issues can echo the input, so they are never returned or logged.
  if (!parsed.success) return failed(400, "invalid");

  const { email, role, country, struggles, survey, source } = parsed.data;
  const { token, tokenHash } = newToken();

  // The form fill is stored first, so nothing that happens to the email can lose it. Only a failure here is shown.
  let mail;
  try {
    mail = await submitSignup({ email, role, country, struggles, wants_survey: survey, source }, tokenHash, hashIp(ip), { hourly: hourlyMailCap(), perIp: perIpMailCap() });
  } catch (e) {
    if (e instanceof WaitlistConfigError) console.error(`[waitlist] not configured: ${e.message}`);
    else if (e instanceof WaitlistStoreError) console.error(`[waitlist] ${e.message}`);
    // Network failure or timeout. Only the error's name: its message or cause could carry request data.
    else console.error(`[waitlist] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    return failed(503, "unavailable");
  }

  if (mail) await deliverSignupEmail(mail.email_id, mail.kind, email, token);
  return accepted();
}
