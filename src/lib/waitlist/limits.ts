import "server-only";

/** A whole number from the environment, or the fallback. Zero is allowed: it means none. */
function limit(name: string, fallback: number) {
  const v = Number(process.env[name]);
  return process.env[name] && Number.isInteger(v) && v >= 0 ? v : fallback;
}

/** Signup emails per hour across everyone. The rest wait for the daily job. Resend's free plan allows 100 a day. */
export const hourlyMailCap = () => limit("WAITLIST_MAIL_HOURLY_CAP", 50);

/** Emails one IP can trigger in 24 hours. A college can share one IP: raise this if students report no email. */
export const perIpMailCap = () => limit("WAITLIST_MAILS_PER_IP", 5);

/** Notifications to the team in 24 hours. Past this the forms still save; they just aren't announced. */
export const teamNoticeDailyCap = () => limit("WAITLIST_TEAM_NOTICE_DAILY_CAP", 20);
