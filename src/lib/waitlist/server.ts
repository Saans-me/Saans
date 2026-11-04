import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DB_TIMEOUT_MS = 5_000;
const RETRY_DELAY_MS = 300;

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

/** A network failure or a server-side error can pass. A refused request (bad key, bad data) won't. */
const isPassing = (e: unknown) =>
  !(e instanceof WaitlistConfigError) && (!(e instanceof WaitlistStoreError) || e.status === 0 || e.status >= 500);

/** One quiet second try, so a brief problem never reaches the person filling in the form. */
async function retryOnce<T>(run: () => Promise<T>) {
  try {
    return await run();
  } catch (e) {
    if (!isPassing(e)) throw e;
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return run();
  }
}

export type WaitlistSubmission = {
  email: string;
  role: string;
  country: string | null;
  struggles: string | null;
  wants_survey: boolean;
  source: string;
};

export type WaitlistMailKind = "confirm" | "reminder" | "already";
export type InterestTable = "clinician_interest" | "college_interest";

async function call<T>(fn: string, args: Record<string, unknown>) {
  const { data, error, status } = await getClient().rpc(fn, args);
  if (error) throw new WaitlistStoreError(error.code || "unknown", status);
  return data as T;
}

/** A clinician or college form. Added as sent; an address can write in more than once. Returns its row's id. */
export function addInterest(table: InterestTable, row: Record<string, unknown>) {
  return retryOnce(async () => {
    const { data, error, status } = await getClient().from(table).insert(row).select("id").single();
    if (error) throw new WaitlistStoreError(error.code || "unknown", status);
    return (data as { id: string }).id;
  });
}

/**
 * Stores a form fill. Returns the email to send now, or null when none should go (see the waitlist_submit
 * function in the database). The caller answers the same either way, so the form can't reveal who is on the list.
 *
 * Safe to retry: a repeat of the same answers only counts up, and an email started by a call whose reply got lost
 * is finished by the daily job.
 */
export function submitSignup(s: WaitlistSubmission, tokenHash: string, ipHash: string | null, limits: { hourly: number; perIp: number }) {
  return retryOnce(() =>
    call<{ email_id: string; kind: WaitlistMailKind } | null>("waitlist_submit", {
      p_email: s.email,
      p_role: s.role,
      p_country: s.country,
      p_struggles: s.struggles,
      p_wants_survey: s.wants_survey,
      p_source: s.source,
      p_token_hash: tokenHash,
      p_ip_hash: ipHash,
      p_hourly_cap: limits.hourly,
      p_ip_cap: limits.perIp,
    }),
  );
}

export const markEmailSent = (id: string, resendId: string) => retryOnce(() => call<void>("waitlist_email_sent", { p_id: id, p_resend_id: resendId }));

export const markEmailFailed = (id: string, errorStatus: number, next: "queue" | "retry" | "never") =>
  retryOnce(() => call<void>("waitlist_email_failed", { p_id: id, p_error_status: errorStatus, p_next: next }));

/** The email link was clicked, which is the confirmation. */
export const clickLink = (tokenHash: string) => retryOnce(() => call<"confirmed" | "already" | "expired">("waitlist_click", { p_token_hash: tokenHash }));

/** "This wasn't me": removes the address and stops all email to it. False when the link is unknown. */
export const removeAddress = (tokenHash: string) => retryOnce(() => call<boolean>("waitlist_not_me", { p_token_hash: tokenHash }));

/** Keeps what Resend reported. A repeat of the same event changes nothing. */
export const recordEmailEvent = (svixId: string, type: string, resendId: string | null, occurredAt: string | null, payload: unknown) =>
  retryOnce(() => call<void>("waitlist_email_event", { p_svix_id: svixId, p_type: type, p_resend_id: resendId, p_occurred_at: occurredAt, p_payload: payload }));

/** The row for the team's notification of a form, or null when today's limit is reached. */
export const startTeamNotice = (to: string, table: InterestTable, interestId: string, dailyCap: number) =>
  retryOnce(() => call<string | null>("waitlist_team_notice", { p_to: to, p_table: table, p_interest_id: interestId, p_daily_cap: dailyCap }));

export const dueEmails = (limit: number) => retryOnce(() => call<string[]>("waitlist_due_emails", { p_limit: limit }));

export type ClaimedEmail =
  | { email_id: string; kind: WaitlistMailKind; email: string }
  | { email_id: string; kind: "team_notice"; email: string; interest_table: InterestTable; interest: { name: string; email: string; role: string } };

/** Takes one due email for sending, with a new link. Null if it shouldn't go any more. */
export const claimEmail = (id: string, tokenHash: string) => retryOnce(() => call<ClaimedEmail | null>("waitlist_claim_email", { p_id: id, p_token_hash: tokenHash }));
