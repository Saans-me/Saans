import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DB_TIMEOUT_MS = 8_000;

export class WaitlistConfigError extends Error {}

/**
 * Failures carry only the Postgres/PostgREST code and HTTP status. The message and
 * details are dropped on purpose: a failing row's values, email included, can appear
 * in them, and these errors end up in the logs.
 */
export class WaitlistStoreError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(`database call failed (code ${code}, status ${status})`);
  }
}

let client: SupabaseClient | null = null;

// Env is read per request, not at import, so a missing value fails the request
// clearly instead of failing the build or being baked in.
function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new WaitlistConfigError("SUPABASE_URL and SUPABASE_SECRET_KEY must both be set");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(DB_TIMEOUT_MS) }),
    },
  });
  return client;
}

export type WaitlistRequest = {
  email: string;
  role: string;
  country: string | null;
  struggles: string | null;
  wants_survey: boolean;
  source: string;
};

async function call<T>(fn: string, args: Record<string, unknown>) {
  const { data, error, status } = await getClient().rpc(fn, args);
  if (error) throw new WaitlistStoreError(error.code || "unknown", status);
  return data as T;
}

/**
 * Records a request (see the waitlist_request function in the database). True means a confirmation email
 * should go out; false means nothing changed, because the address is already confirmed or was emailed
 * recently. The caller answers the same either way, so the form can't reveal who is on the list.
 */
export function requestSignup(r: WaitlistRequest, tokenHash: string) {
  return call<boolean>("waitlist_request", {
    p_email: r.email,
    p_role: r.role,
    p_country: r.country,
    p_struggles: r.struggles,
    p_wants_survey: r.wants_survey,
    p_source: r.source,
    p_token_hash: tokenHash,
  });
}

/** The email couldn't be sent: forget the request, so the person can try again straight away. */
export function cancelSignup(tokenHash: string) {
  return call<void>("waitlist_cancel", { p_token_hash: tokenHash });
}

/** Moves the request onto the list. False when the link is expired, used or unknown. */
export function confirmSignup(tokenHash: string) {
  return call<boolean>("waitlist_confirm", { p_token_hash: tokenHash });
}
