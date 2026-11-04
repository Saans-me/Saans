import { hashToken } from "@/lib/waitlist/email";
import { failed, isSameOrigin, readBody, reply } from "@/lib/waitlist/http";
import { clientIp, isRateLimited } from "@/lib/waitlist/rate-limit";
import { confirmSignup, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";

const MAX_BODY_BYTES = 256;
/** 32 random bytes in base64url. Anything else can't be a real token. */
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/**
 * Only a POST from the confirm page confirms. Email security tools open every link in a message, so a GET
 * must never do it, or addresses would confirm themselves with nobody there.
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
    return (await confirmSignup(hashToken(token))) ? reply(200, { ok: true }) : failed(410, "expired");
  } catch (e) {
    if (e instanceof WaitlistConfigError) console.error(`[waitlist] not configured: ${e.message}`);
    else if (e instanceof WaitlistStoreError) console.error(`[waitlist] ${e.message}`);
    else console.error(`[waitlist] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    return failed(503, "unavailable");
  }
}
