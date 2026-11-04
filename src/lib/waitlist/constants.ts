// Shared with client components. Kept apart from schema.ts so zod stays out of the browser bundle.

/** Honeypot input name. Avoids words like "url" or "company" that browsers autofill. */
export const HONEYPOT_FIELD = "leave_blank";

/** Longest "what's been hard" answer, in characters. The database enforces the same limit. */
export const STRUGGLES_MAX = 1000;

export const WAITLIST_SOURCES = ["modal", "join_section"] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];
