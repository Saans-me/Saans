import { timingSafeEqual } from "node:crypto";
import { deliverSignupEmail, deliverTeamNotice, newToken } from "@/lib/waitlist/email";
import { failed, reply } from "@/lib/waitlist/http";
import { hourlyMailCap } from "@/lib/waitlist/limits";
import { claimEmail, dueEmails, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";

/** Vercel sends the project's CRON_SECRET as a bearer token. Resend allows 10 requests a second; this does about 3. */
function isVercelCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Runs once a day (vercel.json): emails that failed, and emails held back by the hourly limit. Each run sends no
 * more than that limit, so a backlog drains slowly instead of using up the day's quota at once.
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron] not configured: CRON_SECRET must be set");
    return failed(503, "unavailable");
  }
  if (!isVercelCron(req)) return failed(401, "unauthorized");

  let sent = 0;
  let notSent = 0;
  try {
    for (const id of await dueEmails(hourlyMailCap())) {
      const { token, tokenHash } = newToken();
      const m = await claimEmail(id, tokenHash);
      if (!m) continue;
      const ok =
        m.kind === "team_notice"
          ? await deliverTeamNotice(m.email_id, m.email, m.interest_table, m.interest)
          : await deliverSignupEmail(m.email_id, m.kind, m.email, token);
      if (ok) sent += 1;
      else notSent += 1;
    }
  } catch (e) {
    if (e instanceof WaitlistConfigError) console.error(`[cron] not configured: ${e.message}`);
    else if (e instanceof WaitlistStoreError) console.error(`[cron] ${e.message}`);
    else console.error(`[cron] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    return failed(503, "unavailable");
  }
  return reply(200, { ok: true, sent, notSent });
}
