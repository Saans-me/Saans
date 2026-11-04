import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";
import { assertMailConfigured, newToken, sendAlreadyOnListEmail, sendConfirmEmail, WaitlistEmailError } from "@/lib/waitlist/email";
import { failed, isSameOrigin, readBody, reply } from "@/lib/waitlist/http";
import { waitlistSchema } from "@/lib/waitlist/schema";
import { clientIp, isRateLimited } from "@/lib/waitlist/rate-limit";
import { cancelSignup, claimAlreadyNotice, requestSignup, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";

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
  /** A new signup, a duplicate and a honeypot hit all return exactly this, after the same delay. */
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
  if (isRateLimited(clientIp(req.headers))) return failed(429, "rate_limited");

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
  let stored = false;
  try {
    assertMailConfigured();
    stored = await requestSignup({ email, role, country, struggles, wants_survey: survey, source }, tokenHash);
    if (stored) await sendConfirmEmail(email, token);
  } catch (e) {
    if (e instanceof WaitlistConfigError) {
      console.error(`[waitlist] not configured: ${e.message}`);
    } else if (e instanceof WaitlistStoreError || e instanceof WaitlistEmailError) {
      console.error(`[waitlist] ${e.message}`);
    } else {
      // Network failure or timeout. Only the error's name: its message or cause could carry request data.
      console.error(`[waitlist] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    }
    // Never leave a request behind that no email went out for: it would block a retry.
    if (stored) await cancelSignup(tokenHash).catch(() => console.error("[waitlist] could not cancel a failed request"));
    return failed(503, "unavailable");
  }
  // Already on the list, or emailed recently. Their signup is safe, so a problem here is only logged: an
  // error on screen would show that this address is different from a new one.
  if (!stored) {
    try {
      if (await claimAlreadyNotice(email)) await sendAlreadyOnListEmail(email);
    } catch (e) {
      console.error(`[waitlist] already-on-list notice failed (${e instanceof WaitlistEmailError || e instanceof WaitlistStoreError ? e.message : e instanceof Error ? e.name : "unknown"})`);
    }
  }
  return accepted();
}
