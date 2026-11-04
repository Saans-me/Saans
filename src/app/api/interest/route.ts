import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";
import { deliverTeamNotice, teamAddress } from "@/lib/waitlist/email";
import { failed, isSameOrigin, readBody, reply } from "@/lib/waitlist/http";
import { interestSchema } from "@/lib/waitlist/interest";
import { teamNoticeDailyCap } from "@/lib/waitlist/limits";
import { clientIp, isRateLimited } from "@/lib/waitlist/rate-limit";
import { addInterest, startTeamNotice, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";

// Room for the longest answers in any script: 2,000 characters can be 8,000 bytes.
const MAX_BODY_BYTES = 10_240;

/** The clinician and college forms. Same protections as the waitlist's route. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return failed(403, "forbidden");
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
  if ((body as Record<string, unknown>)[HONEYPOT_FIELD]) return reply(200, { ok: true });

  const parsed = interestSchema.safeParse(body);
  // Only the error code goes back. Zod issues can echo the input, so they are never returned or logged.
  if (!parsed.success) return failed(400, "invalid");

  const { type, ...row } = parsed.data;
  const table = type === "clinician" ? "clinician_interest" : "college_interest";
  let interestId: string;
  try {
    interestId = await addInterest(table, row);
  } catch (e) {
    if (e instanceof WaitlistConfigError) console.error(`[interest] not configured: ${e.message}`);
    else if (e instanceof WaitlistStoreError) console.error(`[interest] ${e.message}`);
    else console.error(`[interest] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    return failed(503, "unavailable");
  }

  // The form is saved, so a problem from here on is only logged.
  try {
    const to = teamAddress();
    const noticeId = await startTeamNotice(to, table, interestId, teamNoticeDailyCap());
    if (noticeId) await deliverTeamNotice(noticeId, to, table, { name: row.name, email: row.email, role: row.role });
  } catch (e) {
    console.error(`[interest] team notice not started (${e instanceof WaitlistStoreError ? e.message : e instanceof Error ? e.name : "unknown"})`);
  }
  return reply(200, { ok: true });
}
