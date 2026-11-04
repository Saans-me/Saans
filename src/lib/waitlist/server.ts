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
    super(`insert failed (code ${code}, status ${status})`);
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

export type WaitlistRow = {
  email: string;
  role: string;
  country: string | null;
  struggles: string | null;
  wants_survey: boolean;
  source: string;
};

/**
 * Adds the row, or does nothing if the email is already on the list (ON CONFLICT DO
 * NOTHING). The caller can't tell which happened, and an existing signup's answers
 * can't be overwritten by someone who only knows the address.
 */
export async function addToWaitlist(row: WaitlistRow) {
  const { error, status } = await getClient()
    .from("waitlist")
    .upsert(row, { onConflict: "email", ignoreDuplicates: true });
  if (error) throw new WaitlistStoreError(error.code || "unknown", status);
}
