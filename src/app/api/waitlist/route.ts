import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";
import { waitlistSchema } from "@/lib/waitlist/schema";
import { clientIp, isRateLimited } from "@/lib/waitlist/rate-limit";
import { addToWaitlist, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";

const MAX_BODY_BYTES = 2_048;

function reply(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** A new signup, a duplicate and a honeypot hit all return exactly this. */
const accepted = () => reply(200, { ok: true });
const failed = (status: number, error: string) => reply(status, { ok: false, error });

function isSameOrigin(req: Request) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = req.headers.get("origin");
  // Next.js fills x-forwarded-host from Host when no proxy has set it.
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Reads the body up to the limit. Content-Length can be absent or wrong, so the stream is what counts. */
async function readBody(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return null;
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return failed(403, "forbidden");
  // Requiring JSON also means a cross-site fetch must pass a CORS preflight, which this route never allows.
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return failed(415, "unsupported_media_type");
  }
  if (isRateLimited(clientIp(req.headers))) return failed(429, "rate_limited");

  const raw = await readBody(req);
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

  const { email, role, country, survey, source } = parsed.data;
  try {
    await addToWaitlist({ email, role, country, wants_survey: survey, source });
  } catch (e) {
    if (e instanceof WaitlistConfigError) {
      console.error(`[waitlist] not configured: ${e.message}`);
    } else if (e instanceof WaitlistStoreError) {
      console.error(`[waitlist] ${e.message}`);
    } else {
      // Network failure or timeout. Only the error's name: its message or cause could carry request data.
      console.error(`[waitlist] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    }
    return failed(503, "unavailable");
  }
  return accepted();
}
