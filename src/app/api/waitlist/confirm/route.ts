import { hashToken } from "@/lib/waitlist/email";
import { failed, isSameOrigin, readBody, reply } from "@/lib/waitlist/http";
import { clientIp, isRateLimited } from "@/lib/waitlist/rate-limit";
import { clickLink, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";
import { TOKEN_RE } from "@/lib/waitlist/token";

const MAX_BODY_BYTES = 256;

/**
 * The confirm page calls this as soon as it opens, so clicking the email's link is the confirmation. It's a POST
 * with the token from the URL's fragment, so a tool that only fetches the link can't confirm anything.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return failed(403, "forbidden");
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return failed(415, "unsupported_media_type");
  }
  if (isRateLimited(clientIp(req.headers))) return failed(429, "rate_limited");

  const raw = await readBody(req, MAX_BODY_BYTES);
  if (raw === null) return failed(413, "too_large");

  let token: unknown;
  try {
    token = (JSON.parse(raw) as { token?: unknown } | null)?.token;
  } catch {
    return failed(400, "invalid");
  }
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return failed(400, "invalid");

  try {
    // Opening the link again, or a second link after the first, is still good news.
    return (await clickLink(hashToken(token))) === "expired" ? failed(410, "expired") : reply(200, { ok: true });
  } catch (e) {
    if (e instanceof WaitlistConfigError) console.error(`[waitlist] not configured: ${e.message}`);
    else if (e instanceof WaitlistStoreError) console.error(`[waitlist] ${e.message}`);
    else console.error(`[waitlist] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    return failed(503, "unavailable");
  }
}
