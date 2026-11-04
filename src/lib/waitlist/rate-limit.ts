import "server-only";

/**
 * Fixed-window, in-memory rate limiter.
 *
 * LIMITS: the counters live in this one process. On serverless hosts every instance
 * counts separately and a cold start resets it, so the real ceiling is the numbers
 * below times the number of live instances. This slows casual abuse and scripts; it
 * does not stop a distributed attacker. For a hard limit, move it to a shared store
 * (Upstash Redis, for example) or the host's firewall.
 *
 * The per-IP limit is generous because a whole college can share one IP.
 */
const WINDOW_MS = 10 * 60_000;
const MAX_PER_IP = 20;
/** Ceiling for this process across all IPs, in case the IP header can be forged. */
const MAX_TOTAL = 2_000;
/** Forged IPs must not be able to grow the map without bound. */
const MAX_TRACKED_IPS = 10_000;

let windowStart = 0;
let total = 0;
const perIp = new Map<string, number>();

/** IPs are held in memory for one window at most and are never logged or stored. */
export function isRateLimited(ip: string, now = Date.now()) {
  if (now - windowStart >= WINDOW_MS) {
    windowStart = now;
    total = 0;
    perIp.clear();
  }
  const count = (perIp.get(ip) ?? 0) + 1;
  if (count > MAX_PER_IP) return true;
  if (perIp.size < MAX_TRACKED_IPS || perIp.has(ip)) perIp.set(ip, count);

  // Counted after the per-IP check, so one blocked IP can't use up everyone's allowance.
  total += 1;
  return total > MAX_TOTAL;
}

/**
 * The client IP, from a header the deployment's proxy controls. A client can send any
 * of these headers itself, so which one is safe depends on the host:
 * - Vercel sets x-real-ip and overwrites x-forwarded-for: the default works.
 * - Netlify: set TRUSTED_CLIENT_IP_HEADER=x-nf-client-connection-ip.
 * - `next start` with no proxy in front: the headers pass through as sent, so the
 *   per-IP limit can be dodged and only MAX_TOTAL holds. Put a proxy in front.
 */
export function clientIp(headers: Headers) {
  const trusted = process.env.TRUSTED_CLIENT_IP_HEADER;
  if (trusted) return headers.get(trusted)?.trim() || "unknown";
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  // Rightmost entry: the one added by the nearest proxy, not by the client.
  return headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
}
