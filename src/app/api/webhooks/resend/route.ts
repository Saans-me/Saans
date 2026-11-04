import { createHmac, timingSafeEqual } from "node:crypto";
import { failed, readBody, reply } from "@/lib/waitlist/http";
import { recordEmailEvent, WaitlistConfigError, WaitlistStoreError } from "@/lib/waitlist/server";

const MAX_BODY_BYTES = 64 * 1024;
/** An older signed message is refused, so a captured one can't be replayed later. */
const TOLERANCE_SECONDS = 5 * 60;
const HANDLED = new Set(["email.sent", "email.delivered", "email.delivery_delayed", "email.bounced", "email.complained", "email.failed", "email.suppressed"]);

/** https://docs.svix.com/receiving/verifying-payloads/how-manual */
function isSigned(req: Request, raw: string, secret: string) {
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signatures = req.headers.get("svix-signature");
  if (!id || !timestamp || !signatures || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${raw}`).digest();
  // Usually one signature, but the header can list several during a key change.
  return signatures.split(" ").some((entry) => {
    const [version, value] = entry.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/**
 * What happened to each email, from Resend. Only messages signed with the webhook's secret count, and
 * anything but success makes Resend send the event again later.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] not configured: RESEND_WEBHOOK_SECRET must be set");
    return failed(503, "unavailable");
  }
  const raw = await readBody(req, MAX_BODY_BYTES);
  if (raw === null) return failed(413, "too_large");
  if (!isSigned(req, raw, secret)) return failed(401, "unauthorized");

  let event: { type?: unknown; created_at?: unknown; data?: { email_id?: unknown } };
  try {
    event = JSON.parse(raw);
  } catch {
    return failed(400, "invalid");
  }
  const type = event?.type;
  // Other kinds of event are fine to receive and of no use here.
  if (typeof type !== "string" || !HANDLED.has(type)) return reply(200, { ok: true });

  const resendId = typeof event.data?.email_id === "string" ? event.data.email_id : null;
  const at = typeof event.created_at === "string" && !Number.isNaN(Date.parse(event.created_at)) ? event.created_at : null;
  try {
    await recordEmailEvent(req.headers.get("svix-id")!, type, resendId, at, event);
    return reply(200, { ok: true });
  } catch (e) {
    if (e instanceof WaitlistConfigError) console.error(`[webhook] not configured: ${e.message}`);
    else if (e instanceof WaitlistStoreError) console.error(`[webhook] ${e.message}`);
    else console.error(`[webhook] backend unreachable (${e instanceof Error ? e.name : "unknown"})`);
    return failed(503, "unavailable");
  }
}
