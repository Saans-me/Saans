// README §12. Pushes to window.dataLayer (GTM). Swap for any provider here.

export type AnalyticsEvent =
  | "waitlist_open"
  | "waitlist_submit"
  | "clinician_pilot_submit"
  | "college_contact_submit"
  | "survey_click"
  | "film_play"
  | "get_help_open"
  | "breath_start";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: AnalyticsEvent, data?: Record<string, unknown>) {
  try {
    (window.dataLayer = window.dataLayer || []).push({ event, ...(data || {}) });
  } catch {
    /* ignore */
  }
}
