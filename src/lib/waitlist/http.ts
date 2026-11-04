import "server-only";

/** What both waitlist routes share: replies, the same-origin check and a size-limited body read. */

export function reply(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export const failed = (status: number, error: string) => reply(status, { ok: false, error });

export function isSameOrigin(req: Request) {
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
export async function readBody(req: Request, maxBytes: number) {
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes) return null;
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
