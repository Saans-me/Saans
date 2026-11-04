// End-to-end test of the waitlist: real browser, real production build, real Supabase.
// Only the email provider is replaced, by a local server that captures each message. Run: npm run build && npm run test:waitlist
//
// The site's env comes from .env.local; the test's own settings from .env.test.local
// (see the README). Only rows with a unique per-run address are written, and only those
// are deleted afterwards, so it is safe to run against a project that has real signups.

import { spawn, spawnSync } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = path.join(ROOT, "tests", ".artifacts");
const BROWSER_PATH = process.env.WAITLIST_TEST_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PLAYWRIGHT_FROM =
  process.env.WAITLIST_TEST_PLAYWRIGHT_FROM || "C:/Users/dell/Desktop/Saans Website/saans-platform/package.json";

const PORTS = { main: 3300, dead: 3301, badKey: 3302, noEnv: 3303, attacker: 3304, mail: 3305, noMail: 3306, capped: 3307, noSecrets: 3308 };
const VIEWPORTS = {
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } },
};
const SUCCESS = "Check your inbox";
const CONFIRMED = "You're on the list.";
const ROLE = "Someone looking for support";
const ERR_DOWN = "We couldn't add you to the list just now. Please try again in a few minutes.";
const ERR_LIMIT = "Too many attempts. Please wait a few minutes and try again.";
const ERR_EMAIL = "Please enter a valid email.";

function readEnvFile(name) {
  const file = path.join(ROOT, name);
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}
const env = { ...readEnvFile(".env.local"), ...readEnvFile(".env.test.local"), ...process.env };
const { SUPABASE_URL, SUPABASE_SECRET_KEY, WAITLIST_TEST_DATABASE_URL, WAITLIST_TEST_ANON_KEY, WAITLIST_TEST_PUBLISHABLE_KEY } = env;
for (const [k, v] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  WAITLIST_TEST_DATABASE_URL,
  // new projects have only a publishable key, older ones only an anon key
  "WAITLIST_TEST_PUBLISHABLE_KEY or WAITLIST_TEST_ANON_KEY": WAITLIST_TEST_PUBLISHABLE_KEY || WAITLIST_TEST_ANON_KEY,
})) {
  if (!v) {
    console.error(`Missing ${k}. Set it in .env.local or .env.test.local (see README).`);
    process.exit(2);
  }
}
if (!existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
  console.error("No production build found. Run npm run build first.");
  process.exit(2);
}
const isLocalStack = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(SUPABASE_URL);

// ---------------------------------------------------------------- results

const results = [];
function check(name, ok, seen = "") {
  results.push({ name, ok: !!ok, seen });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${seen ? `  [${seen}]` : ""}`);
}
function skip(name, why) {
  results.push({ name, ok: null, seen: why });
  console.log(`SKIP  ${name}  [${why}]`);
}
async function section(name, fn) {
  console.log(`\n== ${name}`);
  try {
    await fn();
  } catch (e) {
    check(`${name}: finished without an exception`, false, String(e?.message ?? e).split("\n")[0]);
  }
}

// ---------------------------------------------------------------- helpers

const runId = Date.now().toString(36);
let serial = 0;
const usedEmails = new Set();
function newEmail(tag) {
  const email = `e2e-${runId}-${++serial}-${tag}@example.com`;
  usedEmails.add(email);
  return email;
}
const usedIps = new Set();
const uniqueIp = () => {
  const ip = `ip-${runId}-${++serial}`;
  usedIps.add(ip);
  return ip;
};

const newDbClient = () =>
  new pg.Client({
    connectionString: WAITLIST_TEST_DATABASE_URL,
    ssl: isLocalStack ? undefined : { rejectUnauthorized: false },
  });
let db = newDbClient();
/** Every form fill. */
const rowsFor = async (email) =>
  (await db.query("select * from public.waitlist_submissions where lower(email) = lower($1) order by created_at", [email])).rows;
/** People who confirmed: the real list. */
const listedFor = async (email) =>
  (await db.query("select * from public.waitlist where lower(email) = lower($1)", [email])).rows;
/** Every email to an address, oldest first. */
const emailsFor = async (email) =>
  (await db.query("select * from public.waitlist_emails where email = $1 order by created_at", [email])).rows;
const overviewFor = async (email) => (await db.query("select * from public.waitlist_overview where email = $1", [email])).rows[0];
/** Moves an address's emails back in time, to test the rules that depend on time passing. */
const age = (email, interval) =>
  db.query(
    `update public.waitlist_emails set created_at = created_at - $1::interval, sent_at = sent_at - $1::interval,
       last_attempt_at = last_attempt_at - $1::interval where email = $2`,
    [interval, email],
  );
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** Raw HTTP so that every header (and the lack of one) is exactly what the test says. */
function send(port, { method = "POST", headers = {}, body, chunked = false, noOrigin = false, path: urlPath = "/api/waitlist" } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body);
    const allHeaders = {
      "content-type": "application/json",
      "x-real-ip": uniqueIp(),
      ...(noOrigin ? {} : { origin: `http://localhost:${port}` }),
      ...headers,
    };
    if (payload !== undefined && !chunked) allHeaders["content-length"] = Buffer.byteLength(payload);
    // agent: false, a fresh connection each time: the server drops the socket after refusing an oversized upload.
    const req = http.request({ host: "localhost", port, path: urlPath, method, headers: allHeaders, agent: false }, (res) => {
      let text = "";
      res.on("data", (c) => (text += c));
      res.on("end", () => resolve({ status: res.statusCode, text, headers: res.headers }));
    });
    req.on("error", (e) => (e.code === "ECONNRESET" ? resolve({ status: 0, text: "", headers: {} }) : reject(e)));
    if (chunked && payload !== undefined) {
      const size = 64 * 1024;
      for (let i = 0; i < payload.length; i += size) req.write(payload.slice(i, i + size));
    } else if (payload !== undefined) req.write(payload);
    req.end();
  });
}
const STRUGGLES_TEXT = "e2e: raat ko neend nahi aati, exams ka darr hai";
const validBody = (email, extra = {}) => ({ email, role: ROLE, country: "India", survey: false, source: "modal", ...extra });

// ---------------------------------------------------------------- servers

/** Stands in for Resend: captures every message so the test can follow its link. */
const mails = [];
let mailFailures = 0;
let mailFailureStatus = 500;
let mailSerial = 0;
const mailServer = http.createServer((req, res) => {
  let text = "";
  req.on("data", (c) => (text += c));
  req.on("end", () => {
    if (mailFailures > 0) {
      mailFailures -= 1;
      res.statusCode = mailFailureStatus;
      return res.end("{}");
    }
    const resendId = `e2e-${runId}-resend-${++mailSerial}`;
    mails.push({ ...JSON.parse(text), authorization: req.headers.authorization, resendId });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ id: resendId }));
  });
});
const mailsTo = (email) => mails.filter((m) => m.to[0] === email);
const tokenOf = (mail) => mail.text.match(/confirm#token=([\w-]+)/)?.[1];
const TEST_RESEND_KEY = "test-resend-key-not-real";
const WEBHOOK_SECRET = `whsec_${Buffer.from("e2e webhook secret, not real").toString("base64")}`;
const CRON_SECRET = "e2e-cron-secret-not-real";
const TEAM_EMAIL = `e2e-${runId}-team@example.com`;
usedEmails.add(TEAM_EMAIL);
const MAIL_ENV = {
  RESEND_API_KEY: TEST_RESEND_KEY,
  WAITLIST_FROM_EMAIL: "SAANS <test@example.com>",
  RESEND_API_URL: `http://localhost:${PORTS.mail}/emails`,
  SITE_URL: `http://localhost:${PORTS.main}`,
  RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET,
  CRON_SECRET,
  WAITLIST_IP_SALT: `e2e-salt-${runId}`,
  WAITLIST_TEAM_EMAIL: TEAM_EMAIL,
  // A test run sends far more than a real hour would. The limits have their own checks, on their own site.
  WAITLIST_MAIL_HOURLY_CAP: "100000",
  WAITLIST_TEAM_NOTICE_DAILY_CAP: "100000",
};

const logs = [];
const servers = [];
function startSite(port, overrides = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
      cwd: ROOT,
      env: { ...process.env, ...MAIL_ENV, ...overrides },
      stdio: ["ignore", "pipe", "pipe"],
    });
    servers.push(child);
    const lines = { port, text: "" };
    logs.push(lines);
    const onData = (d) => (lines.text += d);
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => code && reject(new Error(`site on ${port} exited with ${code}: ${lines.text.slice(-300)}`)));
    const deadline = Date.now() + 60_000;
    const poll = () =>
      http
        .get({ host: "localhost", port, path: "/help" }, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => (Date.now() > deadline ? reject(new Error(`site on ${port} not up`)) : setTimeout(poll, 300)));
    poll();
  });
}

// ---------------------------------------------------------------- browser helpers

const require = createRequire(PLAYWRIGHT_FROM);
const { chromium } = require("playwright-core");
let browser;

/** A page with every console error, page error, CSP violation and off-site request recorded. */
async function openPage(viewportName, port, { ip = uniqueIp() } = {}) {
  const context = await browser.newContext({ ...VIEWPORTS[viewportName], extraHTTPHeaders: { "x-real-ip": ip } });
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const page = await context.newPage();
  const seen = { console: [], offsite: [], apiRequests: [] };
  page.on("console", (m) => m.type() === "error" && seen.console.push(m.text()));
  page.on("pageerror", (e) => seen.console.push(`pageerror: ${e.message}`));
  page.on("request", (r) => {
    const u = r.url();
    if (u.startsWith("data:") || u.startsWith("blob:")) return;
    if (new URL(u).host !== `localhost:${port}`) seen.offsite.push(u);
    if (u.includes("/api/waitlist")) seen.apiRequests.push(r);
  });
  await page.goto(`http://localhost:${port}/`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("button") && Object.keys(document.querySelector("button")).some((k) => k.startsWith("__reactProps")));
  return { page, context, seen };
}

/** Everything a real person does: opens the modal from the hero and fills in the form. */
async function fillModal(page, { email, role = ROLE, country, struggles, survey = false }) {
  await page.locator("button:visible", { hasText: "Join the waitlist" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("heading", { name: "Be one of the first to try SAANS." }).waitFor();
  await dialog.locator('input[type="email"]').fill(email);
  if (role) {
    await dialog.getByRole("combobox", { name: "I am" }).click();
    await page.getByRole("option", { name: role, exact: true }).click();
  }
  if (country) {
    await dialog.getByRole("combobox", { name: "Country" }).click();
    await page.getByRole("option", { name: country, exact: true }).click();
  }
  if (struggles) await dialog.locator("textarea").fill(struggles);
  if (survey) await dialog.getByRole("checkbox").check();
  return dialog;
}
const submitModal = (dialog) => dialog.getByRole("button", { name: "Join the waitlist" }).click();

/** Only the browser's own note about the HTTP status we are provoking may appear. */
function unexpectedConsole(seen, allowedStatus) {
  return seen.console.filter((t) => !(allowedStatus && t.includes(`status of ${allowedStatus}`)));
}
async function assertClean(label, { page, seen }, allowedStatus) {
  const stray = unexpectedConsole(seen, allowedStatus);
  check(`${label}: no console errors`, stray.length === 0, stray.join(" | ").slice(0, 200));
  const csp = await page.evaluate(() => window.__csp);
  check(`${label}: no CSP violations`, csp.length === 0, csp.join(" | "));
  check(`${label}: browser only called same-origin`, seen.offsite.length === 0, seen.offsite.join(" | "));
}

// ---------------------------------------------------------------- scenarios

async function databaseAndPostgrest() {
  for (const tableName of ["waitlist", "waitlist_submissions", "waitlist_emails", "waitlist_email_events", "waitlist_suppressed", "waitlist_ip_counters", "clinician_interest", "college_interest"]) {
    const table = (await db.query(`select relrowsecurity from pg_class where oid = 'public.${tableName}'::regclass`)).rows[0];
    check(`${tableName}: RLS is enabled`, table.relrowsecurity === true);
    const policies = await db.query(`select 1 from pg_policies where schemaname='public' and tablename=$1`, [tableName]);
    check(`${tableName}: no RLS policies`, policies.rowCount === 0, `${policies.rowCount} policies`);
    for (const role of ["anon", "authenticated"]) {
      const { rows } = await db.query(
        `select bool_or(has_table_privilege($1, 'public.${tableName}', p)) as any_priv
         from unnest(array['select','insert','update','delete','truncate','references','trigger']) as p`,
        [role],
      );
      check(`${tableName}: ${role} holds no privileges`, rows[0].any_priv === false);
    }
  }
  for (const fn of [
    "waitlist_submit(text,text,text,text,boolean,text,text,text,integer,integer)",
    "waitlist_email_sent(uuid,text)",
    "waitlist_email_failed(uuid,integer,text)",
    "waitlist_email_event(text,text,text,timestamptz,jsonb)",
    "waitlist_click(text)",
    "waitlist_not_me(text)",
    "waitlist_team_notice(text,text,uuid,integer)",
    "waitlist_due_emails(integer)",
    "waitlist_claim_email(uuid,text)",
  ]) {
    const { rows } = await db.query(
      `select has_function_privilege('anon', 'public.${fn}', 'execute') as anon, has_function_privilege('authenticated', 'public.${fn}', 'execute') as auth, has_function_privilege('service_role', 'public.${fn}', 'execute') as server`,
    );
    check(`${fn.split("(")[0]}: only the server can call it`, !rows[0].anon && !rows[0].auth && rows[0].server, JSON.stringify(rows[0]));
  }
  for (const fn of ["waitlist_apply_email_event(uuid,text,timestamptz,text)"]) {
    const { rows } = await db.query(`select has_function_privilege('anon', 'public.${fn}', 'execute') as anon, has_function_privilege('authenticated', 'public.${fn}', 'execute') as auth, has_function_privilege('service_role', 'public.${fn}', 'execute') as server`);
    check(`${fn.split("(")[0]}: nobody outside the database can call it`, !rows[0].anon && !rows[0].auth && !rows[0].server, JSON.stringify(rows[0]));
  }
  {
    const { rows } = await db.query(
      `select bool_or(has_table_privilege(r, 'public.waitlist_overview', 'select')) as any_read from unnest(array['anon','authenticated','service_role']) as r`,
    );
    check("waitlist_overview: no outside role can read it", rows[0].any_read === false);
    const { rows: opts } = await db.query("select reloptions from pg_class where oid = 'public.waitlist_overview'::regclass");
    check("waitlist_overview: runs with the reader's rights", String(opts[0].reloptions).includes("security_invoker=true"), String(opts[0].reloptions));
  }

  const dbErr = async (fn) => {
    try {
      await fn();
      return null;
    } catch (e) {
      return e.code;
    }
  };
  const sqlEmail = newEmail("sql");
  const insert = (email) =>
    db.query("insert into public.waitlist (email, role, source) values ($1, 'x', 'modal')", [email]);
  await insert(sqlEmail);
  check("DB rejects a second copy of an email", (await dbErr(() => insert(sqlEmail))) === "23505");
  check("DB rejects a different-case copy of an email", (await dbErr(() => insert(sqlEmail.toUpperCase()))) === "23514");
  check("DB rejects an over-long answer", (await dbErr(() => db.query("insert into public.waitlist (email, role, source, struggles) values ($1, 'x', 'modal', $2)", [newEmail("longsql"), "x".repeat(1001)]))) === "23514");
  check("DB rejects a badly formatted email", (await dbErr(() => insert("not-an-email"))) === "23514");
  check("DB rejects an over-long email", (await dbErr(() => insert(`${"a".repeat(260)}@example.com`))) === "23514");

  const rest = `${SUPABASE_URL}/rest/v1/waitlist`;
  const anonKeys = [["anon key", WAITLIST_TEST_ANON_KEY], ["publishable key", WAITLIST_TEST_PUBLISHABLE_KEY]].filter(([, key]) => key);
  for (const [label, key] of anonKeys) {
    const headers = { apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) };
    // A wrong key, or another project's, is also refused, which would make the checks below pass for
    // the wrong reason. A valid key reaches PostgREST and gets "no such table".
    const probe = await fetch(`${SUPABASE_URL}/rest/v1/e2e_no_such_table?select=id`, { headers });
    check(`${label} is a valid key for this project`, probe.status === 404, `${probe.status}`);
    const read = await fetch(`${rest}?select=*`, { headers });
    const readText = await read.text();
    check(`${label} cannot read through PostgREST`, [401, 403].includes(read.status) && !readText.includes(sqlEmail), `${read.status} ${readText.slice(0, 90)}`);

    const anonEmail = newEmail("anon");
    const write = await fetch(rest, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ email: anonEmail, role: "x", source: "modal" }),
    });
    check(`${label} cannot insert through PostgREST`, [401, 403].includes(write.status) && (await listedFor(anonEmail)).length === 0, `${write.status}`);

    for (const table of ["waitlist_submissions", "waitlist_emails", "waitlist_email_events", "waitlist_suppressed", "waitlist_ip_counters", "waitlist_overview"]) {
      const closed = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
      check(`${label} cannot read ${table}`, [401, 403, 404].includes(closed.status), `${closed.status}`);
    }
    for (const fn of ["waitlist_click", "waitlist_not_me"]) {
      const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ p_token_hash: "0".repeat(64) }) });
      check(`${label} cannot call ${fn}`, [401, 403, 404].includes(rpc.status), `${rpc.status}`);
    }

    const patch = await fetch(`${rest}?email=eq.${encodeURIComponent(sqlEmail)}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "hacked" }),
    });
    const del = await fetch(`${rest}?email=eq.${encodeURIComponent(sqlEmail)}`, { method: "DELETE", headers });
    const after = await listedFor(sqlEmail);
    check(`${label} cannot update or delete through PostgREST`, after.length === 1 && after[0].role === "x", `PATCH ${patch.status}, DELETE ${del.status}`);
  }

  // Control: the same endpoint does answer the secret key, so the denials above mean something.
  const secretHeaders = {
    apikey: SUPABASE_SECRET_KEY,
    ...(SUPABASE_SECRET_KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${SUPABASE_SECRET_KEY}` }),
  };
  const control = await fetch(`${rest}?select=email&email=eq.${encodeURIComponent(sqlEmail)}`, { headers: secretHeaders });
  const controlRows = control.ok ? await control.json() : [];
  check("control: the secret key can read the same endpoint", control.ok && controlRows.length === 1, `${control.status}`);

  const direct = await fetch(`${rest}?email=eq.${encodeURIComponent(sqlEmail)}`, { method: "DELETE", headers: secretHeaders });
  check("the secret key has no delete privilege (least privilege)", !direct.ok, `${direct.status}`);
  const directPatch = await fetch(`${rest}?email=eq.${encodeURIComponent(sqlEmail)}`, { method: "PATCH", headers: { ...secretHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ role: "hacked" }) });
  check("the secret key has no update privilege (least privilege)", !directPatch.ok, `${directPatch.status}`);
  for (const table of ["clinician_interest", "college_interest"]) {
    for (const [label, key] of anonKeys) {
      const headers = { apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) };
      const read = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
      check(`${table}: ${label} cannot read`, [401, 403].includes(read.status), `${read.status}`);
      const write = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ name: "x", email: newEmail("anon"), role: "x", ...(table === "college_interest" ? { college: "x" } : {}) }) });
      check(`${table}: ${label} cannot add`, [401, 403].includes(write.status), `${write.status}`);
    }
    const del = await fetch(`${SUPABASE_URL}/rest/v1/${table}?email=eq.nobody@example.com`, { method: "DELETE", headers: secretHeaders });
    check(`${table}: the secret key has no delete privilege`, !del.ok, `${del.status}`);
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/${table}?email=eq.nobody@example.com`, { method: "PATCH", headers: { ...secretHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ name: "x" }) });
    check(`${table}: the secret key has no update privilege`, !upd.ok, `${upd.status}`);
  }
  for (const table of ["waitlist_submissions", "waitlist_emails", "waitlist_email_events", "waitlist_suppressed", "waitlist_ip_counters", "waitlist_overview"]) {
    const closed = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers: secretHeaders });
    check(`the secret key can't reach ${table} directly`, !closed.ok, `${closed.status}`);
  }
}

async function apiAbuse() {
  const port = PORTS.main;
  const noRow = async (email) => (await rowsFor(email)).length === 0;

  // the optional "what's been hard" answer
  const post = (body) => fetch(`http://localhost:${port}/api/waitlist`, { method: "POST", headers: { "Content-Type": "application/json", Origin: `http://localhost:${port}`, "x-real-ip": uniqueIp() }, body: JSON.stringify(body) });
  const blank = newEmail("blank");
  const blankReply = await post(validBody(blank, { struggles: "   " }));
  const blankRows = await rowsFor(blank);
  check("a blank answer is stored as no answer", blankReply.status === 200 && blankRows.length === 1 && blankRows[0].struggles === null, `${blankReply.status}`);
  const none = newEmail("none");
  const noneReply = await post(validBody(none));
  check("the answer can be left out", noneReply.status === 200 && (await rowsFor(none))[0]?.struggles === null, `${noneReply.status}`);
  const hindi = newEmail("hindi");
  const longest = "न".repeat(1000);
  const hindiReply = await post(validBody(hindi, { struggles: longest }));
  check("1,000 characters of Hindi fit", hindiReply.status === 200 && (await rowsFor(hindi))[0]?.struggles === longest, `${hindiReply.status}`);
  const tooLong = newEmail("toolong");
  const longReply = await post(validBody(tooLong, { struggles: "x".repeat(1001) }));
  check("1,001 characters are refused, no row", longReply.status === 400 && (await noRow(tooLong)), `${longReply.status}`);
  const notText = newEmail("nottext");
  const notTextReply = await post(validBody(notText, { struggles: { a: 1 } }));
  check("a non-text answer is refused, no row", notTextReply.status === 400 && (await noRow(notText)), `${notTextReply.status}`);

  let email = newEmail("origin");
  let r = await send(port, { body: validBody(email), headers: { origin: "https://evil.example" } });
  check("wrong Origin is refused", r.status === 403 && (await noRow(email)), `${r.status} ${r.text}`);

  email = newEmail("noorigin");
  r = await send(port, { body: validBody(email), noOrigin: true });
  check("missing Origin is refused", r.status === 403 && (await noRow(email)), `${r.status}`);

  email = newEmail("fetchsite");
  r = await send(port, { body: validBody(email), headers: { "sec-fetch-site": "cross-site" } });
  check("Sec-Fetch-Site: cross-site is refused", r.status === 403 && (await noRow(email)), `${r.status}`);

  email = newEmail("ctype");
  r = await send(port, { body: validBody(email), headers: { "content-type": "text/plain" } });
  check("non-JSON content type is refused", r.status === 415 && (await noRow(email)), `${r.status}`);

  email = newEmail("big");
  const big = validBody(email, { padding: "x".repeat(10_000) });
  r = await send(port, { body: big });
  check("oversized body (declared length) is refused", r.status === 413 && (await noRow(email)), `${r.status} ${r.text}`);

  email = newEmail("bigchunk");
  r = await send(port, { body: validBody(email, { padding: "x".repeat(300_000) }), chunked: true });
  check("oversized body (chunked, no length) is refused", (r.status === 413 || r.status === 0) && (await noRow(email)), `${r.status} ${r.text}`);

  for (const [label, body] of [
    ["malformed JSON", "{nope"],
    ["JSON null", "null"],
    ["JSON array", "[]"],
    ["no fields", {}],
  ]) {
    r = await send(port, { body });
    check(`${label} is refused`, r.status === 400, `${r.status} ${r.text}`);
  }

  for (const [label, make] of [
    ["invalid email", () => validBody("nope")],
    ["over-long email", () => validBody(`${"a".repeat(300)}@example.com`)],
    ["unknown role", (e) => validBody(e, { role: "Admin" })],
    ["unknown country", (e) => validBody(e, { country: "Atlantis" })],
    ["non-boolean survey", (e) => validBody(e, { survey: "yes" })],
    ["unknown source", (e) => validBody(e, { source: "evil" })],
  ]) {
    email = newEmail("bad");
    r = await send(port, { body: make(email) });
    check(`${label} is refused`, r.status === 400 && !r.text.includes("nope") && (await noRow(email)), `${r.status} ${r.text}`);
  }

  email = newEmail("hp");
  r = await send(port, { body: validBody(email, { leave_blank: "http://spam.example" }) });
  check("honeypot filled: looks like success, stores nothing", r.status === 200 && r.text === '{"ok":true}' && (await noRow(email)), `${r.status} ${r.text}`);

  email = newEmail("dup");
  const first = await send(port, { body: validBody(email) });
  const second = await send(port, { body: validBody(`  ${email.toUpperCase()}  `, { role: "A clinician", country: "Other", survey: true }) });
  const pick = (x) => ({ status: x.status, text: x.text, headers: Object.keys(x.headers).filter((h) => h !== "date").sort() });
  check("new and duplicate signups get identical responses", JSON.stringify(pick(first)) === JSON.stringify(pick(second)), `${first.status} ${first.text} / ${second.status} ${second.text}`);
  const dupRows = await rowsFor(email);
  check("duplicate sent only one email", mailsTo(email).length === 1, `${mailsTo(email).length} email(s)`);
  check("different answers are kept as their own lowercase row", dupRows.length === 2 && dupRows.every((x) => x.email === email), `${dupRows.length} row(s), ${dupRows[0]?.email}`);
  check("… and the first answers are untouched", dupRows[0]?.role === ROLE && dupRows[0]?.country === "India" && dupRows[0]?.wants_survey === false && dupRows[1]?.role === "A clinician");
  check("response is not cacheable", first.headers["cache-control"] === "no-store", first.headers["cache-control"]);

  r = await send(port, { method: "GET" });
  check("GET is not allowed", r.status === 405, `${r.status}`);
  r = await send(port, { method: "OPTIONS", headers: { "access-control-request-method": "POST" } });
  check("preflight grants no cross-origin access", !r.headers["access-control-allow-origin"], `${r.status} ACAO=${r.headers["access-control-allow-origin"] ?? "none"}`);

  const ip = uniqueIp();
  const codes = [];
  for (let i = 0; i < 21; i++) codes.push((await send(port, { body: {}, headers: { "x-real-ip": ip } })).status);
  check("IP is limited after 20 requests in a window", codes.slice(0, 20).every((c) => c === 400) && codes[20] === 429, `21st: ${codes[20]}`);
  email = newEmail("limited");
  r = await send(port, { body: validBody(email), headers: { "x-real-ip": ip } });
  check("a limited IP stores nothing, even with a valid body", r.status === 429 && (await noRow(email)), `${r.status}`);
  email = newEmail("otherip");
  r = await send(port, { body: validBody(email) });
  check("a different IP is unaffected", r.status === 200 && !(await noRow(email)), `${r.status}`);
}

async function crossOriginFromBrowser() {
  const page0 = http.createServer((_, res) => {
    res.setHeader("content-type", "text/html");
    res.end("<!doctype html><title>attacker</title>");
  });
  await new Promise((r) => page0.listen(PORTS.attacker, r));
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORTS.attacker}/`);
  const target = `http://localhost:${PORTS.main}/api/waitlist`;

  const corsEmail = newEmail("cors");
  const cors = await page.evaluate(
    async ([url, body]) => {
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        return `readable ${r.status}`;
      } catch (e) {
        return `blocked: ${e.message}`;
      }
    },
    [target, JSON.stringify(validBody(corsEmail))],
  );
  check("real browser: cross-site JSON fetch is blocked", cors.startsWith("blocked") && (await rowsFor(corsEmail)).length === 0, cors);

  const noCorsEmail = newEmail("nocors");
  await page.evaluate(
    async ([url, body]) => {
      await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body }).catch(() => {});
    },
    [target, JSON.stringify(validBody(noCorsEmail))],
  );
  check("real browser: cross-site no-cors form post stores nothing", (await rowsFor(noCorsEmail)).length === 0);
  await ctx.close();
  await new Promise((r) => page0.close(r));
}

async function modalFlows(name) {
  const label = (s) => `[${name}] ${s}`;

  // Valid signup, with the loading state held long enough to see it.
  const signup = newEmail(`modal-${name}`);
  {
    const tab = await openPage(name, PORTS.main);
    const { page, seen } = tab;
    await page.route("**/api/waitlist", async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.continue();
    });
    const dialog = await fillModal(page, { email: signup, country: "India", struggles: STRUGGLES_TEXT, survey: true });
    await page.screenshot({ path: path.join(SHOTS, `${name}-modal-filled.png`) });
    await submitModal(dialog);
    const loading = dialog.getByRole("button", { name: "Joining…" });
    await loading.waitFor();
    check(label("loading state shows and disables the button"), await loading.isDisabled());
    await dialog.getByRole("heading", { name: SUCCESS }).waitFor();
    await page.screenshot({ path: path.join(SHOTS, `${name}-modal-success.png`) });
    check(label("valid signup shows success"), true, SUCCESS);
    const rows = await rowsFor(signup);
    const row = rows[0];
    check(
      label("row exists with the submitted fields"),
      rows.length === 1 && row.email === signup && row.role === ROLE && row.country === "India" && row.struggles === STRUGGLES_TEXT && row.wants_survey === true && row.source === "modal" && row.id && row.created_at,
      rows.length ? `role=${row.role}, country=${row.country}, survey=${row.wants_survey}, source=${row.source}` : "no row",
    );
    const layer = JSON.stringify(await page.evaluate(() => window.dataLayer ?? []));
    check(label("analytics got the event but no email"), layer.includes("waitlist_submit") && !layer.toLowerCase().includes("@"), layer);
    check(label("analytics got nothing of what they wrote"), !layer.includes(STRUGGLES_TEXT.slice(0, 12)));
    const sent = seen.apiRequests[0];
    check(label("browser sent one same-origin request"), seen.apiRequests.length === 1 && new URL(sent.url()).pathname === "/api/waitlist");
    await assertClean(label("signup"), tab);
    await tab.context.close();
  }

  // Same email again, different case and with spaces.
  {
    const tab = await openPage(name, PORTS.main);
    const { page, seen } = tab;
    const dialog = await fillModal(page, { email: `  ${signup.toUpperCase()}  `, role: "A clinician", country: "Other" });
    await submitModal(dialog);
    await dialog.getByRole("heading", { name: SUCCESS }).waitFor();
    check(label("same email (case + spaces) shows the same success"), true, SUCCESS);
    const rows = await rowsFor(signup);
    check(label("both form fills kept, first answers untouched"), rows.length === 2 && rows[0].role === ROLE && rows[0].country === "India" && rows[1].role === "A clinician", `${rows.length} row(s), role=${rows[0]?.role}`);
    check(label("duplicate reached the server"), seen.apiRequests.length === 1);
    check(label("duplicate sent no second email"), mailsTo(signup).length === 1, `${mailsTo(signup).length} email(s)`);
    await assertClean(label("duplicate"), tab);
    await tab.context.close();
  }

  // Invalid email, caught in the browser.
  {
    const tab = await openPage(name, PORTS.main);
    const { page, seen } = tab;
    const dialog = await fillModal(page, { email: "not-an-email" });
    await submitModal(dialog);
    const alert = dialog.getByRole("alert");
    await alert.waitFor();
    check(label("invalid email shows an error"), (await alert.textContent()) === ERR_EMAIL, await alert.textContent());
    check(label("invalid email sends nothing"), seen.apiRequests.length === 0);
    check(label("invalid email: no success state"), (await dialog.getByRole("heading", { name: SUCCESS }).count()) === 0);
    await tab.context.close();
  }

  // Passes the browser's loose check, refused by the server.
  {
    const tab = await openPage(name, PORTS.main);
    const bad = `e2e-${runId}..${name}@example.com`;
    usedEmails.add(bad);
    const dialog = await fillModal(tab.page, { email: bad });
    await submitModal(dialog);
    const alert = dialog.getByRole("alert");
    await alert.waitFor();
    check(label("server-rejected email shows the email error"), (await alert.textContent()) === ERR_EMAIL, await alert.textContent());
    check(label("server-rejected email: no row"), (await rowsFor(bad)).length === 0);
    await assertClean(label("server-rejected email"), tab, 400);
    await tab.context.close();
  }

  // Honeypot: hidden from people, filled the way a bot would.
  {
    const tab = await openPage(name, PORTS.main);
    const { page } = tab;
    const email = newEmail(`hp-${name}`);
    const dialog = await fillModal(page, { email });
    const trap = dialog.locator('input[name="leave_blank"]');
    const box = await trap.evaluate((el) => {
      const r = el.closest("[aria-hidden]").getBoundingClientRect();
      return { w: r.width, h: r.height, tab: el.tabIndex };
    });
    check(label("honeypot is invisible, unfocusable, hidden from AT"), box.w <= 1 && box.h <= 1 && box.tab === -1, JSON.stringify(box));
    const seenFocus = [];
    await dialog.locator('input[type="email"]').focus();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      seenFocus.push(await page.evaluate(() => document.activeElement?.getAttribute("name")));
    }
    check(label("Tab never lands on the honeypot"), !seenFocus.includes("leave_blank"));
    await trap.evaluate((el) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      set.call(el, "http://spam.example");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await submitModal(dialog);
    await dialog.getByRole("heading", { name: SUCCESS }).waitFor();
    check(label("honeypot filled: same success shown"), true, SUCCESS);
    check(label("honeypot filled: no row, no email"), (await rowsFor(email)).length === 0 && mailsTo(email).length === 0);
    await tab.context.close();
  }

  // Rate limit: use up this IP's allowance, then submit through the real form.
  {
    const ip = uniqueIp();
    for (let i = 0; i < 20; i++) await send(PORTS.main, { body: {}, headers: { "x-real-ip": ip } });
    const tab = await openPage(name, PORTS.main, { ip });
    const email = newEmail(`limit-${name}`);
    const dialog = await fillModal(tab.page, { email });
    await submitModal(dialog);
    const alert = dialog.getByRole("alert");
    await alert.waitFor();
    check(label("rate limit shows its own error"), (await alert.textContent()) === ERR_LIMIT, await alert.textContent());
    check(label("rate limit: no success, no row"), (await dialog.getByRole("heading", { name: SUCCESS }).count()) === 0 && (await rowsFor(email)).length === 0);
    await assertClean(label("rate limit"), tab, 429);
    await tab.context.close();
  }

  // The home page's own "Join the waitlist" form.
  {
    const tab = await openPage(name, PORTS.main);
    const { page } = tab;
    const email = newEmail(`join-${name}`);
    const join = page.locator("#join");
    await join.scrollIntoViewIfNeeded();
    await join.locator('input[type="email"]').fill(email);
    await join.getByRole("combobox", { name: "I am" }).click();
    await page.getByRole("option", { name: ROLE, exact: true }).click();
    await join.getByRole("combobox", { name: "Country" }).click();
    await page.getByRole("option", { name: "India", exact: true }).click();
    await join.locator("textarea").fill(STRUGGLES_TEXT);
    await page.screenshot({ path: path.join(SHOTS, `${name}-join-filled.png`) });
    await join.getByRole("button", { name: "Join the waitlist" }).click();
    await join.getByText(SUCCESS).waitFor();
    const rows = await rowsFor(email);
    check(label("home page form: success and row"), rows.length === 1 && rows[0].source === "join_section" && rows[0].country === "India" && rows[0].struggles === STRUGGLES_TEXT, rows[0] ? `source=${rows[0].source}, country=${rows[0].country}` : "no row");
    await assertClean(label("home page form"), tab);
    await tab.context.close();
  }
}

/** Each audience gets its own question, and nobody gets one before saying who they are. */
async function questionsByRole(name) {
  const QUESTIONS = [
    ["Someone looking for support", "What's been hard for you lately?", true],
    ["A clinician", "What's hardest about your practice right now?", false],
    ["From a college", "What's your biggest challenge with student wellbeing?", false],
  ];
  const tab = await openPage(name, PORTS.main);
  const { page } = tab;
  await page.locator("button:visible", { hasText: "Join the waitlist" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("heading", { name: "Be one of the first to try SAANS." }).waitFor();
  const closeModal = page.getByRole("dialog").getByRole("button", { name: /close/i }).first();
  const forms = [["popup", dialog]];
  for (const [formName, form] of forms) {
    check(`[${name}] ${formName}: no question before a role is picked`, (await form.locator("textarea").count()) === 0);
    for (const [role, question, hasHelp] of QUESTIONS) {
      await form.getByRole("combobox", { name: "I am" }).click();
      await page.getByRole("option", { name: role, exact: true }).click();
      check(`[${name}] ${formName}: ${role} sees their own question`, (await form.getByText(question).count()) === 1 && (await form.locator("textarea").count()) === 1);
      check(`[${name}] ${formName}: ${role} ${hasHelp ? "gets" : "doesn't need"} the help link`, ((await form.getByText("get help now").count()) === 1) === hasHelp);
    }
  }
  await closeModal.click();
  const join = page.locator("#join");
  await join.scrollIntoViewIfNeeded();
  check(`[${name}] last section: no question before a role is picked`, (await join.locator("textarea").count()) === 0);
  for (const [role, question, hasHelp] of QUESTIONS) {
    await join.getByRole("combobox", { name: "I am" }).click();
    await page.getByRole("option", { name: role, exact: true }).click();
    check(`[${name}] last section: ${role} sees their own question`, (await join.getByText(question).count()) === 1);
    check(`[${name}] last section: ${role} ${hasHelp ? "gets" : "doesn't need"} the help link`, ((await join.getByText("get help now").count()) === 1) === hasHelp);
  }
  await tab.context.close();
}

/** The whole journey in a browser: form, email, one click on its link, list. */
async function confirmJourney(name) {
  const label = (s) => `[${name}] confirm: ${s}`;
  const email = newEmail(`journey-${name}`);
  const tab = await openPage(name, PORTS.main);
  const dialog = await fillModal(tab.page, { email, country: "India", struggles: STRUGGLES_TEXT, survey: true });
  await submitModal(dialog);
  await dialog.getByRole("heading", { name: SUCCESS }).waitFor();
  const modalText = await dialog.textContent();
  check(label("the screen mentions spam and never asks to try again"), /spam/i.test(modalText) && !/try again/i.test(modalText));
  await tab.page.screenshot({ path: path.join(SHOTS, `${name}-modal-inbox.png`) });

  const sent = mailsTo(email);
  const mail = sent[0];
  check(label("one email to that address"), sent.length === 1, `${sent.length} email(s)`);
  check(label("email says nothing about why they joined"), !!mail && !JSON.stringify(mail).includes(STRUGGLES_TEXT) && !JSON.stringify(mail).includes(ROLE) && !/hard|struggl|mental/i.test(mail.subject + mail.text));
  check(label("email authenticates with the configured key"), mail?.authorization === `Bearer ${TEST_RESEND_KEY}`);
  const token = tokenOf(mail);
  const link = mail.text.match(/http\S+confirm#token=[\w-]+/)?.[0];
  const notMe = mail.text.match(/http\S+not-me#token=[\w-]+/)?.[0];
  check(label("link points at the configured site, token in the fragment"), !!link && link.startsWith(`http://localhost:${PORTS.main}/waitlist/confirm#token=`), (link || "").slice(0, 60));
  check(label("email offers a way out"), !!notMe && mail.html.includes(notMe));
  check(label("html and text carry the same link"), mail.html.includes(link));
  check(label("email no longer promises to delete what was sent"), !/will be deleted/i.test(mail.text + mail.html));

  const [row0] = await emailsFor(email);
  const [sub] = await rowsFor(email);
  check(label("saved as unconfirmed with their answers"), !!sub && sub.struggles === STRUGGLES_TEXT && sub.confirmed_at === null);
  check(label("email on record as sent, with Resend's id"), row0?.kind === "confirm" && row0?.status === "sent" && row0?.resend_id === mail.resendId && !!row0?.sent_at);
  check(label("only the token's hash is stored"), row0?.token_hash === sha256(token) && !JSON.stringify(row0).includes(token) && !JSON.stringify(sub).includes(token));
  check(label("link lasts about 30 days"), Math.abs(new Date(row0?.expires_at) - Date.now() - 30 * 864e5) < 6e5);
  check(label("not on the list before clicking"), (await listedFor(email)).length === 0);

  // A tool that only fetches the link must do nothing: the token is in the fragment, which never reaches a server.
  const fetched = await fetch(link);
  check(label("fetching the link confirms nothing"), fetched.ok && (await listedFor(email)).length === 0 && (await emailsFor(email))[0].click_count === 0);

  const page = await tab.context.newPage();
  await page.goto(link, { waitUntil: "load" });
  await page.getByRole("heading", { name: CONFIRMED }).waitFor();
  check(label("one click confirms, with no button to press"), (await page.getByRole("button", { name: /confirm/i }).count()) === 0);
  await page.screenshot({ path: path.join(SHOTS, `${name}-confirmed.png`) });

  const [row] = await listedFor(email);
  check(label("on the list with their own answers"), !!row && row.role === ROLE && row.country === "India" && row.struggles === STRUGGLES_TEXT && row.wants_survey === true && row.source === "modal" && !!row.confirmed_at);
  const [clicked] = await emailsFor(email);
  check(label("the click is on record"), !!clicked.clicked_at && clicked.click_count === 1, `${clicked.click_count} click(s)`);
  check(label("their form fill is marked confirmed, and kept"), !!(await rowsFor(email))[0].confirmed_at);
  check(label("token no longer in the address bar"), !page.url().includes("token"));
  const over = await overviewFor(email);
  check(label("the overview has it all in one line"), over?.status === "confirmed" && Number(over.emails_sent) === 1 && Number(over.clicks) === 1 && over.last_email_kind === "confirm" && over.struggles === STRUGGLES_TEXT, JSON.stringify({ s: over?.status, e: over?.emails_sent, c: over?.clicks }));

  await page.reload({ waitUntil: "load" });
  await page.getByRole("heading", { name: CONFIRMED }).waitFor();
  check(label("reloading still says they're on the list"), true);

  const again = await tab.context.newPage();
  await again.goto(link, { waitUntil: "load" });
  await again.getByRole("heading", { name: CONFIRMED }).waitFor();
  check(label("opening the link again still says they're on the list"), (await emailsFor(email))[0].click_count === 2);
  const stray = (await again.evaluate(() => window.__csp)) || [];
  check(label("no CSP violations on the confirm page"), stray.length === 0, stray.join(" | "));

  const none = await tab.context.newPage();
  await none.goto(`http://localhost:${PORTS.main}/waitlist/confirm`, { waitUntil: "load" });
  await none.getByRole("heading", { name: "This link has expired." }).waitFor();
  check(label("no token: says so, and offers to join"), (await none.getByRole("button", { name: "Join the waitlist" }).count()) >= 1);

  // A problem on the way: the page tries once more by itself, then offers to retry.
  const shaky = newEmail(`shaky-${name}`);
  await send(PORTS.main, { body: validBody(shaky) });
  const shakyLink = mailsTo(shaky)[0].text.match(/http\S+confirm#token=[\w-]+/)[0];
  const flaky = await tab.context.newPage();
  let calls = 0;
  await flaky.route("**/api/waitlist/confirm", async (route) => {
    calls += 1;
    if (calls <= 2) return route.fulfill({ status: 503, contentType: "application/json", body: '{"ok":false,"error":"unavailable"}' });
    return route.continue();
  });
  await flaky.goto(shakyLink, { waitUntil: "load" });
  // The page's own message: Next.js keeps an empty role="alert" of its own for route changes.
  const failure = flaky.locator("p[role=alert]");
  await failure.waitFor({ timeout: 8000 });
  const shown = await failure.textContent();
  check(label("a failed confirm says so in plain words, after one quiet retry"), calls === 2 && !/database|db |supabase|server/i.test(shown), shown);
  await flaky.getByRole("button", { name: "Try again" }).click();
  await flaky.getByRole("heading", { name: CONFIRMED }).waitFor();
  check(label("… and trying again works"), (await listedFor(shaky)).length === 1);

  // "This wasn't me", through the page.
  const stranger = newEmail(`notme-${name}`);
  await send(PORTS.main, { body: validBody(stranger, { struggles: STRUGGLES_TEXT }) });
  const notMeLink = mailsTo(stranger)[0].text.match(/http\S+not-me#token=[\w-]+/)[0];
  const out = await tab.context.newPage();
  await out.goto(notMeLink, { waitUntil: "load" });
  const removeButton = out.getByRole("button", { name: "Remove my address" });
  await removeButton.waitFor();
  await out.waitForTimeout(600);
  check(label("opening the remove link removes nothing (scanners open links)"), (await rowsFor(stranger)).length === 1);
  await out.screenshot({ path: path.join(SHOTS, `${name}-not-me.png`) });
  await removeButton.click();
  await out.getByRole("heading", { name: "Done." }).waitFor();
  check(label("pressing the button removes everything about the address"), (await rowsFor(stranger)).length === 0 && (await emailsFor(stranger)).length === 0);
  await tab.context.close();
}

/** The rules behind the journey, through the real API and the real database functions. */
async function confirmRules() {
  const port = PORTS.main;
  const join = (email, extra, opts = {}) => send(port, { body: validBody(email, extra), ...opts });
  const confirm = (token, opts = {}) => send(port, { path: "/api/waitlist/confirm", body: { token }, ...opts });
  const notMe = (token, opts = {}) => send(port, { path: "/api/waitlist/not-me", body: { token }, ...opts });
  const OK = '{"ok":true}';

  // ---- the rule that protects a stranger
  let email = newEmail("stranger");
  let r = await join(email);
  for (let i = 0; i < 4; i++) r = await join(email, { struggles: `attempt ${i}` });
  check("five quick form fills send one email", mailsTo(email).length === 1, `${mailsTo(email).length} email(s)`);
  check("… every one is stored", (await rowsFor(email)).length === 5, `${(await rowsFor(email)).length} row(s)`);
  check("… and each answers the same", r.status === 200 && r.text === OK);
  await age(email, "6 days 23 hours");
  await join(email);
  check("still no second email just under 7 days later", mailsTo(email).length === 1, `${mailsTo(email).length} email(s)`);
  await age(email, "2 hours");
  await join(email);
  const [, reminder] = mailsTo(email);
  check("after 7 days, one reminder", mailsTo(email).length === 2 && /Still want/.test(reminder?.subject), reminder?.subject);
  check("… on record as a reminder", (await emailsFor(email))[1]?.kind === "reminder");
  check("… with its own link", !!tokenOf(reminder) && tokenOf(reminder) !== tokenOf(mailsTo(email)[0]));
  await age(email, "60 days");
  await join(email);
  await join(email, { struggles: "much later" });
  check("two emails ever: nothing more, however long it's been", mailsTo(email).length === 2, `${mailsTo(email).length} email(s)`);
  check("… though what they wrote is still stored", (await rowsFor(email)).some((x) => x.struggles === "much later"));

  // ---- repeats and row limits
  email = newEmail("same");
  for (let i = 0; i < 3; i++) await join(email);
  let rows = await rowsFor(email);
  check("the same answers again only count up", rows.length === 1 && rows[0].submit_count === 3, `${rows.length} row(s), count ${rows[0]?.submit_count}`);
  email = newEmail("many");
  for (let i = 0; i < 13; i++) await join(email, { struggles: `answer ${i}` });
  rows = await rowsFor(email);
  check("different answers stop at ten rows for an address", rows.length === 10, `${rows.length} row(s)`);

  // ---- failures never lose a form fill
  email = newEmail("mailfail");
  mailFailures = 1;
  mailFailureStatus = 500;
  r = await join(email, { struggles: "kept through a failure" });
  check("email failed: same answer as success", r.status === 200 && r.text === OK, `${r.status}`);
  rows = await rowsFor(email);
  check("… the form fill is safe", rows.length === 1 && rows[0].struggles === "kept through a failure");
  let [m] = await emailsFor(email);
  check("… and the email is on record as failed", m?.status === "failed" && m?.last_error_status === 500 && m?.attempts === 1, `${m?.status} ${m?.last_error_status}`);
  await join(email);
  check("filling in the form again doesn't send: the daily job has it", mailsTo(email).length === 0 && (await emailsFor(email)).length === 1);

  const quota = newEmail("quota");
  mailFailures = 1;
  mailFailureStatus = 429;
  r = await join(quota);
  [m] = await emailsFor(quota);
  check("Resend out of quota: queued, no try used up", r.status === 200 && m?.status === "queued" && m?.attempts === 0, `${m?.status} ${m?.attempts}`);

  const refused = newEmail("refused");
  mailFailures = 1;
  mailFailureStatus = 422;
  await join(refused);
  [m] = await emailsFor(refused);
  check("Resend refused the message: not tried again", m?.status === "failed" && m?.attempts === 3, `${m?.status} ${m?.attempts}`);
  mailFailureStatus = 500;

  // ---- already on the list
  email = newEmail("rejoin");
  await join(email);
  await confirm(tokenOf(mailsTo(email)[0]));
  const before = (await listedFor(email))[0];
  r = await join(email, { role: "A clinician", country: "Other" });
  const after = (await listedFor(email))[0];
  check("joining again once confirmed: same reply, the list doesn't change", r.status === 200 && r.text === OK && after.role === before.role && after.country === before.country);
  check("… what they wrote is stored all the same", (await rowsFor(email)).length === 2 && (await rowsFor(email))[1].confirmed_at === null);
  const notice = mailsTo(email)[1];
  check("… and a note goes to that inbox only", mailsTo(email).length === 2 && notice.subject === "You're already on the SAANS waitlist" && !tokenOf(notice), `${mailsTo(email).length} email(s)`);
  check("… which says nothing about why they joined", !/hard|struggl|mental/i.test(notice.subject + notice.text) && !notice.text.includes(ROLE));
  await join(email);
  await age(email, "29 days");
  await join(email);
  check("… at most one in 30 days", mailsTo(email).length === 2, `${mailsTo(email).length} email(s)`);
  await age(email, "2 days");
  await join(email);
  check("… and another after that", mailsTo(email).length === 3 && !tokenOf(mailsTo(email)[2]), `${mailsTo(email).length} email(s)`);

  const failing = newEmail("noticefail");
  await join(failing);
  await confirm(tokenOf(mailsTo(failing)[0]));
  mailFailures = 1;
  r = await join(failing);
  check("a failed note still answers like everyone else", r.status === 200 && r.text === OK, `${r.status}`);
  const stillThere = await listedFor(failing);
  check("… and the signup is untouched", stillThere.length === 1 && !!stillThere[0].confirmed_at);

  // ---- someone types a stranger's address first
  email = newEmail("squat");
  await join(email, { role: "From a college", struggles: "written by someone else" });
  await age(email, "8 days");
  await join(email, { role: ROLE, struggles: "written by the real owner" });
  const [squatterMail, ownerMail] = mailsTo(email);
  check("each form fill's email has its own link", !!ownerMail && tokenOf(squatterMail) !== tokenOf(ownerMail));
  r = await confirm(tokenOf(ownerMail));
  const [owner] = await listedFor(email);
  check("the real owner's click keeps only their own answers", r.status === 200 && owner?.role === ROLE && owner?.struggles === "written by the real owner");
  rows = await rowsFor(email);
  check("the other form fill stays on record, unconfirmed", rows.length === 2 && rows.filter((x) => x.confirmed_at).length === 1 && rows.find((x) => x.confirmed_at).struggles === "written by the real owner");
  r = await confirm(tokenOf(squatterMail));
  check("the other link can't change the answers", r.status === 200 && (await listedFor(email))[0].struggles === "written by the real owner", `${r.status}`);

  // ---- a row from before confirmation existed
  email = newEmail("legacy");
  await db.query("insert into public.waitlist (email, role, source) values ($1, 'From a college', 'modal')", [email]);
  r = await join(email, { role: ROLE });
  check("an old unconfirmed row can still get a link", r.status === 200 && mailsTo(email).length === 1);
  await confirm(tokenOf(mailsTo(email)[0]));
  const [legacy] = await listedFor(email);
  check("clicking it marks that row confirmed, with the new answers", !!legacy?.confirmed_at && legacy.role === ROLE && (await listedFor(email)).length === 1);

  // ---- expiry
  email = newEmail("expired");
  await join(email);
  await db.query("update public.waitlist_emails set expires_at = now() - interval '1 hour' where email = $1", [email]);
  r = await confirm(tokenOf(mailsTo(email)[0]));
  check("an expired link is refused and adds nobody", r.status === 410 && (await listedFor(email)).length === 0, `${r.status}`);
  check("… and the form fill is still there", (await rowsFor(email)).length === 1);
  check("… and the late click is on record", (await emailsFor(email))[0].click_count === 1);

  // ---- "this wasn't me"
  email = newEmail("out");
  await join(email, { struggles: "written by someone else" });
  const outToken = tokenOf(mailsTo(email)[0]);
  r = await send(port, { method: "GET", path: "/api/waitlist/not-me" });
  check("not-me: GET is not allowed, so a scanner can't trigger it", r.status === 405, `${r.status}`);
  r = await notMe(outToken, { headers: { origin: "https://evil.example" } });
  check("not-me: another website is refused", r.status === 403 && (await rowsFor(email)).length === 1, `${r.status}`);
  r = await notMe("A".repeat(43));
  check("not-me: an unknown link removes nothing", r.status === 410 && (await rowsFor(email)).length === 1, `${r.status}`);
  r = await send(port, { path: "/api/waitlist/not-me", body: { token: "x".repeat(1000) } });
  check("not-me: oversized body is refused", r.status === 413, `${r.status}`);
  r = await notMe(outToken);
  check("not-me: removes every form fill and email of the address", r.status === 200 && (await rowsFor(email)).length === 0 && (await emailsFor(email)).length === 0, `${r.status}`);
  const sup = await db.query("select * from public.waitlist_suppressed where email_hash = $1", [sha256(email)]);
  check("not-me: only a hash stays", sup.rowCount === 1 && !JSON.stringify(sup.rows[0]).includes(email));
  await age(email, "60 days");
  r = await join(email, { struggles: "typed again" });
  check("not-me: the same answer on screen, but nothing stored and no email", r.status === 200 && r.text === OK && (await rowsFor(email)).length === 0 && mailsTo(email).length === 1, `${mailsTo(email).length} email(s)`);
  r = await notMe(outToken);
  check("not-me: pressing it twice says nothing is left", r.status === 410, `${r.status}`);

  email = newEmail("outconfirmed");
  await join(email);
  await confirm(tokenOf(mailsTo(email)[0]));
  r = await notMe(tokenOf(mailsTo(email)[0]));
  check("not-me: works after a confirm too (a scanner can confirm with nobody there)", r.status === 200 && (await listedFor(email)).length === 0 && (await overviewFor(email)) === undefined, `${r.status}`);

  // ---- one IP, many addresses
  const ip = uniqueIp();
  const fromIp = [];
  for (let i = 0; i < 6; i++) {
    const e = newEmail(`ip${i}`);
    fromIp.push(e);
    r = await join(e, { struggles: "from one IP" }, { headers: { "x-real-ip": ip } });
  }
  check("one IP: five addresses get an email", fromIp.slice(0, 5).every((e) => mailsTo(e).length === 1));
  check("one IP: the sixth doesn't", mailsTo(fromIp[5]).length === 0);
  check("… but answers the same and is stored", r.status === 200 && r.text === OK && (await rowsFor(fromIp[5])).length === 1);
  [m] = await emailsFor(fromIp[5]);
  check("… and it's on record why", m?.status === "skipped" && m?.reason === "ip_limit" && !m?.sent_at, `${m?.status} ${m?.reason}`);
  await join(fromIp[5]);
  check("… and that person can still get one from elsewhere", mailsTo(fromIp[5]).length === 1, `${mailsTo(fromIp[5]).length} email(s)`);
  const counter = await db.query("select * from public.waitlist_ip_counters where ip_hash = $1", [createHmac("sha256", MAIL_ENV.WAITLIST_IP_SALT).update(ip).digest("hex")]);
  check("no IP is stored, only its keyed hash", counter.rowCount === 1 && !JSON.stringify(counter.rows[0]).includes(ip), `${counter.rowCount} row(s)`);
  const job = await db.query("select schedule from cron.job where jobname = 'purge-waitlist-ip-counters'");
  check("a daily job clears the IP counters", job.rowCount === 1, job.rows[0]?.schedule);
  await db.query("delete from public.waitlist_ip_counters where ip_hash = $1", [createHmac("sha256", MAIL_ENV.WAITLIST_IP_SALT).update(ip).digest("hex")]);

  // ---- the hourly limit, on a site set to zero
  email = newEmail("hourly");
  r = await send(PORTS.capped, { body: validBody(email, { struggles: "over the limit" }) });
  [m] = await emailsFor(email);
  check("over the hourly limit: same answer, stored, queued for later", r.status === 200 && r.text === OK && (await rowsFor(email)).length === 1 && m?.status === "queued" && mailsTo(email).length === 0, `${m?.status}`);

  // ---- same timing whether or not someone is on the list
  const timed = async (e) => { const t = Date.now(); await join(e); return Date.now() - t; };
  const known = newEmail("timed");
  await join(known);
  await confirm(tokenOf(mailsTo(known)[0]));
  await join(known);
  const onList = await timed(known);
  const fresh = await timed(newEmail("timedfresh"));
  check("a listed address doesn't answer faster than a new one", onList >= 1400 && fresh >= 1400 && Math.abs(onList - fresh) < 400, `${onList} ms / ${fresh} ms`);

  // ---- the confirm route itself
  r = await send(port, { method: "GET", path: "/api/waitlist/confirm" });
  check("confirm: GET is not allowed, so a scanner that only fetches can't confirm", r.status === 405, `${r.status}`);
  email = newEmail("cc");
  await join(email);
  const token = tokenOf(mailsTo(email)[0]);
  r = await confirm(token, { headers: { origin: "https://evil.example" } });
  check("confirm: another website is refused", r.status === 403 && (await listedFor(email)).length === 0, `${r.status}`);
  r = await confirm(token, { noOrigin: true });
  check("confirm: missing Origin is refused", r.status === 403 && (await listedFor(email)).length === 0, `${r.status}`);
  r = await send(port, { path: "/api/waitlist/confirm", body: "{}", headers: { "content-type": "text/plain" } });
  check("confirm: non-JSON is refused", r.status === 415, `${r.status}`);
  for (const [what, bad, want] of [["empty", "", 400], ["short", "abc", 400], ["wrong characters", "x".repeat(42) + "!", 400], ["not text", { a: 1 }, 400], ["well formed but unknown", "A".repeat(43), 410]]) {
    r = await confirm(bad);
    check(`confirm: ${what} token is refused`, r.status === want, `${r.status} ${r.text}`);
  }
  r = await send(port, { path: "/api/waitlist/confirm", body: { token: "x".repeat(1000) } });
  check("confirm: oversized body is refused", r.status === 413, `${r.status}`);
  const guessIp = uniqueIp();
  const codes = [];
  for (let i = 0; i < 21; i++) codes.push((await send(port, { path: "/api/waitlist/confirm", body: {}, headers: { "x-real-ip": guessIp } })).status);
  check("confirm: guessing is rate limited", codes[20] === 429, `21st: ${codes[20]}`);
}

/** A webhook message the way Resend signs it. */
function signed(type, data, { id = `e2e-${runId}-evt-${++serial}`, secret = WEBHOOK_SECRET, at = Math.floor(Date.now() / 1000), tamper = false } = {}) {
  const body = JSON.stringify({ type, created_at: new Date().toISOString(), data });
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signature = createHmac("sha256", key).update(`${id}.${at}.${body}`).digest("base64");
  return {
    path: "/api/webhooks/resend",
    noOrigin: true,
    body: tamper ? body.replace("email", "gmail") : body,
    headers: { "svix-id": id, "svix-timestamp": String(at), "svix-signature": `v1,${signature}` },
  };
}
const eventsFor = async (resendId) => (await db.query("select * from public.waitlist_email_events where resend_id = $1", [resendId])).rows;

/** What Resend reports reaches our database, and only Resend can report it. */
async function webhookRules() {
  const port = PORTS.main;
  const join = (email) => send(port, { body: validBody(email) });
  const post = (type, data, opts) => send(port, signed(type, data, opts));

  // Svix's published example, so the check itself is known to be right: https://docs.svix.com/receiving/verifying-payloads/how-manual
  const vector = createHmac("sha256", Buffer.from("plJ3nmyCDGBKInavdOK15jsl", "base64")).update('msg_loFOjxBNrRLzqYUf.1731705121.{"event_type":"ping","data":{"success":true}}').digest("base64");
  check("control: this test signs the way Svix documents", vector === "rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=", vector);

  let email = newEmail("wh");
  await join(email);
  let resendId = mailsTo(email)[0].resendId;
  const data = { email_id: resendId, to: [email], subject: "x" };

  let r = await post("email.delivered", data, { secret: `whsec_${Buffer.from("not the secret").toString("base64")}` });
  check("a wrong signature is refused", r.status === 401 && (await emailsFor(email))[0].status === "sent", `${r.status}`);
  r = await post("email.delivered", data, { tamper: true });
  check("a changed message is refused", r.status === 401 && (await emailsFor(email))[0].status === "sent", `${r.status}`);
  r = await post("email.delivered", data, { at: Math.floor(Date.now() / 1000) - 3600 });
  check("an old message is refused, so it can't be replayed", r.status === 401, `${r.status}`);
  r = await send(port, { path: "/api/webhooks/resend", noOrigin: true, body: JSON.stringify({ type: "email.delivered", data }) });
  check("no signature is refused", r.status === 401, `${r.status}`);
  r = await send(port, { method: "GET", path: "/api/webhooks/resend" });
  check("GET is not allowed", r.status === 405, `${r.status}`);
  r = await send(PORTS.noSecrets, { path: "/api/webhooks/resend", noOrigin: true, body: "{}" });
  check("without the secret configured it refuses everything", r.status === 503, `${r.status}`);

  r = await post("email.delivered", data);
  let [m] = await emailsFor(email);
  check("delivered: on record", r.status === 200 && m.status === "delivered" && !!m.delivered_at, `${r.status} ${m.status}`);
  check("the event itself is kept, as received", (await eventsFor(resendId))[0]?.payload?.data?.email_id === resendId && (await eventsFor(resendId))[0]?.email_id === m.id);
  const id = `e2e-${runId}-evt-repeat`;
  await post("email.delivered", data, { id });
  await post("email.delivered", data, { id });
  check("a repeated event is kept once", (await eventsFor(resendId)).length === 2, `${(await eventsFor(resendId)).length} event(s)`);
  await post("email.sent", data);
  check("a late 'sent' doesn't move it backwards", (await emailsFor(email))[0].status === "delivered");
  r = await post("email.opened", data);
  check("other kinds of event are accepted and ignored", r.status === 200 && (await eventsFor(resendId)).length === 3, `${r.status}`);
  r = await send(port, signed("email.delivered", { email_id: `e2e-${runId}-nobody` }));
  check("an email we don't know is kept without a link to anything", r.status === 200 && (await eventsFor(`e2e-${runId}-nobody`))[0]?.email_id === null, `${r.status}`);

  // a permanent bounce closes the address
  email = newEmail("hard");
  await join(email);
  resendId = mailsTo(email)[0].resendId;
  await post("email.bounced", { email_id: resendId, bounce: { type: "Permanent", subType: "General", message: "x" } });
  [m] = await emailsFor(email);
  check("permanent bounce: on record", m.status === "bounced" && !!m.bounced_at, m.status);
  await age(email, "60 days");
  await join(email);
  check("… and no email goes to that address again", mailsTo(email).length === 1, `${mailsTo(email).length} email(s)`);
  check("… though the form fill is still stored", (await rowsFor(email))[0].submit_count === 2);

  // a complaint closes it too
  email = newEmail("spamreport");
  await join(email);
  await post("email.complained", { email_id: mailsTo(email)[0].resendId });
  check("spam complaint: on record", (await emailsFor(email))[0].status === "complained" && !!(await emailsFor(email))[0].complained_at);
  await age(email, "60 days");
  await join(email);
  check("… and no email goes to that address again", mailsTo(email).length === 1);

  // Resend's own list closes it too
  email = newEmail("onlist");
  await join(email);
  await post("email.suppressed", { email_id: mailsTo(email)[0].resendId, suppressed: { type: "OnAccountSuppressionList" } });
  check("Resend suppressed it: on record, not counted as sent", (await emailsFor(email))[0].status === "suppressed" && !(await emailsFor(email))[0].sent_at);

  // a temporary bounce doesn't
  email = newEmail("soft");
  await join(email);
  await post("email.bounced", { email_id: mailsTo(email)[0].resendId, bounce: { type: "Temporary", subType: "MailboxFull", message: "x" } });
  [m] = await emailsFor(email);
  check("temporary bounce: left for the daily job", m.status === "failed" && !m.bounced_at && !m.sent_at, m.status);

  email = newEmail("delay");
  await join(email);
  await post("email.delivery_delayed", { email_id: mailsTo(email)[0].resendId });
  check("delayed: on record", (await emailsFor(email))[0].status === "delayed");
  await post("email.delivered", { email_id: mailsTo(email)[0].resendId });
  check("… and then delivered", (await emailsFor(email))[0].status === "delivered");

  // the event arrives before the send's reply has been recorded
  email = newEmail("race");
  const [fresh] = (await db.query("insert into public.waitlist_emails (email, kind, status, attempts, last_attempt_at) values ($1, 'confirm', 'sending', 1, now()) returning id", [email])).rows;
  const raceId = `e2e-${runId}-race`;
  await post("email.delivered", { email_id: raceId });
  check("an event ahead of the send's reply is kept", (await eventsFor(raceId))[0]?.email_id === null);
  await db.query("select public.waitlist_email_sent($1, $2)", [fresh.id, raceId]);
  [m] = await emailsFor(email);
  check("… and applied once the send is recorded", m.status === "delivered" && m.resend_id === raceId && (await eventsFor(raceId))[0]?.email_id === m.id, m.status);
}

/** The daily job. It takes every due email in the database, so it only runs against the local stack. */
async function cronRules() {
  const port = PORTS.main;
  const url = "/api/cron/waitlist-mail";
  let r = await send(port, { method: "GET", path: url, noOrigin: true });
  check("cron: no secret is refused", r.status === 401, `${r.status}`);
  r = await send(port, { method: "GET", path: url, noOrigin: true, headers: { authorization: "Bearer wrong" } });
  check("cron: a wrong secret is refused", r.status === 401, `${r.status}`);
  r = await send(PORTS.noSecrets, { method: "GET", path: url, noOrigin: true, headers: { authorization: `Bearer ${CRON_SECRET}` } });
  check("cron: without the secret configured it refuses everything", r.status === 503, `${r.status}`);

  if (!isLocalStack) return skip("cron: sends what's due", "only runs against the local stack: it would act on real signups");

  const run = () => send(port, { method: "GET", path: url, noOrigin: true, headers: { authorization: `Bearer ${CRON_SECRET}` } });
  const join = (email, extra) => send(port, { body: validBody(email, extra) });
  // Nothing from earlier checks should get in the way.
  await db.query("update public.waitlist_emails set status = 'skipped', reason = 'test' where status in ('queued', 'failed', 'sending') and email like $1", [`e2e-${runId}-%`]);

  const failed = newEmail("cronfail");
  mailFailures = 1;
  await join(failed, { struggles: "from before the failure" });
  const queued = newEmail("cronqueue");
  await send(PORTS.capped, { body: validBody(queued) });
  const stuck = newEmail("cronstuck");
  await join(stuck);
  await db.query("update public.waitlist_emails set status = 'sending', last_attempt_at = now() - interval '1 hour', resend_id = null where email = $1", [stuck]);
  const confirmedSince = newEmail("cronconfirmed");
  await join(confirmedSince);
  const confirmToken = tokenOf(mailsTo(confirmedSince)[0]);
  await send(port, { path: "/api/waitlist/confirm", body: { token: confirmToken } });
  await db.query("update public.waitlist_emails set status = 'queued' where email = $1", [confirmedSince]);
  const lastTry = newEmail("cronlast");
  mailFailures = 1;
  await join(lastTry);
  await db.query("update public.waitlist_emails set attempts = 3 where email = $1", [lastTry]);

  const mailsBefore = mailsTo(stuck).length;
  r = await run();
  const out = JSON.parse(r.text);
  check("cron: reports what it did", r.status === 200 && out.ok === true && out.sent >= 3, r.text);
  check("cron: a failed email goes out", mailsTo(failed).length === 1 && (await emailsFor(failed))[0].status === "sent" && (await emailsFor(failed))[0].attempts === 2);
  const token = tokenOf(mailsTo(failed)[0]);
  check("cron: it has a working link, which confirms their answers", (await send(port, { path: "/api/waitlist/confirm", body: { token } })).status === 200 && (await listedFor(failed))[0]?.struggles === "from before the failure");
  check("cron: a queued email goes out", mailsTo(queued).length === 1 && (await emailsFor(queued))[0].status === "sent");
  check("cron: one that died partway goes out", mailsTo(stuck).length === mailsBefore + 1 && (await emailsFor(stuck))[0].status === "sent");
  check("cron: someone who confirmed in the meantime gets nothing", mailsTo(confirmedSince).length === 1 && (await emailsFor(confirmedSince))[0].status === "skipped" && (await emailsFor(confirmedSince))[0].reason === "already_confirmed");
  check("cron: three tries is the most", mailsTo(lastTry).length === 0 && (await emailsFor(lastTry))[0].status === "failed");
  await run();
  check("cron: running again sends nothing twice", mailsTo(queued).length === 1 && mailsTo(failed).length === 1);

  const quota = newEmail("cronquota");
  await send(PORTS.capped, { body: validBody(quota) });
  mailFailures = 1;
  mailFailureStatus = 429;
  await run();
  mailFailureStatus = 500;
  check("cron: out of quota, it stays queued", (await emailsFor(quota))[0].status === "queued" && (await emailsFor(quota))[0].attempts === 0, (await emailsFor(quota))[0].status);
  await run();
  check("cron: and goes out on the next run", mailsTo(quota).length === 1);

  const notice = newEmail("cronteam");
  mailFailures = 1;
  const before = mailsTo(TEAM_EMAIL).length;
  await send(port, { path: "/api/interest", body: { type: "clinician", name: "E2E Retry", email: notice, role: "Psychologist" } });
  check("a failed team notification leaves the form saved", (await interestRows("clinician_interest", notice)).length === 1);
  await run();
  check("cron: a failed team notification goes out too", mailsTo(TEAM_EMAIL).length === before + 1 && mailsTo(TEAM_EMAIL).at(-1).text.includes(notice));
}

const interestRows = async (table, email) => (await db.query(`select * from public.${table} where email = $1`, [email])).rows;
const INTEREST_NOTE = "e2e: notes pile up between sessions";

/** The two forms behind "Want to tell us more?", opened the way a person does, then their rules. */
async function interestForms(name) {
  const label = (s) => `[${name}] ${s}`;

  // clinician
  {
    const tab = await openPage(name, PORTS.main);
    const { page } = tab;
    const email = newEmail(`clinician-${name}`);
    await fillModal(page, { email: newEmail("unused"), role: "A clinician" });
    await page.getByText("Want to tell us more?").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("heading", { name: "Join the SAANS Pro pilot." }).waitFor();
    await dialog.locator('input[autocomplete="name"]').fill("E2E Clinician");
    await dialog.locator('input[type="email"]').fill(email);
    await dialog.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "Psychologist", exact: true }).click();
    await dialog.getByRole("combobox", { name: "Country" }).click();
    await page.getByRole("option", { name: "India", exact: true }).click();
    await dialog.getByRole("combobox", { name: "Number of active clients" }).click();
    await page.getByRole("option", { name: "11–30", exact: true }).click();
    await dialog.locator("textarea").fill(INTEREST_NOTE);
    await page.screenshot({ path: path.join(SHOTS, `${name}-clinician-filled.png`) });
    await dialog.getByRole("button", { name: "Request access" }).click();
    await dialog.getByRole("heading", { name: "Thank you, we'll be in touch." }).waitFor();
    const [row] = await interestRows("clinician_interest", email);
    check(label("clinician form: saved with every field"), !!row && row.name === "E2E Clinician" && row.role === "Psychologist" && row.country === "India" && row.clients === "11–30" && row.note === INTEREST_NOTE && !!row.created_at);
    const layer = JSON.stringify(await page.evaluate(() => window.dataLayer ?? []));
    check(label("clinician form: analytics got the event and nothing they wrote"), layer.includes("clinician_pilot_submit") && !layer.includes("@") && !layer.includes(INTEREST_NOTE.slice(0, 12)));
    check(label("clinician form: the person gets no email"), mailsTo(email).length === 0);
    const notice = mailsTo(TEAM_EMAIL).find((m) => m.text.includes(email));
    check(label("clinician form: the team is told who, not what they wrote"), !!notice && /clinician/.test(notice.subject) && notice.text.includes("E2E Clinician") && notice.text.includes("Psychologist") && !JSON.stringify(notice).includes(INTEREST_NOTE));
    await assertClean(label("clinician form"), tab);
    await tab.context.close();
  }

  // college
  {
    const tab = await openPage(name, PORTS.main);
    const { page } = tab;
    const email = newEmail(`college-${name}`);
    await fillModal(page, { email: newEmail("unused"), role: "From a college" });
    await page.getByText("Want to tell us more?").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("heading", { name: "Bring SAANS to your campus." }).waitFor();
    await dialog.locator('input[autocomplete="name"]').fill("E2E Dean");
    await dialog.locator('input[type="email"]').fill(email);
    await dialog.locator('input[autocomplete="organization"]').fill("E2E University");
    await dialog.getByRole("combobox", { name: "Your role" }).click();
    await page.getByRole("option", { name: "Wellness office", exact: true }).click();
    await dialog.getByRole("combobox", { name: "Number of students" }).click();
    await page.getByRole("option", { name: "2,000–10,000", exact: true }).click();
    await dialog.locator("textarea").fill(INTEREST_NOTE);
    await page.screenshot({ path: path.join(SHOTS, `${name}-college-filled.png`) });
    await dialog.getByRole("button", { name: "Send", exact: true }).click();
    await dialog.getByRole("heading", { name: "Thanks. We'll reply within two working days." }).waitFor();
    const [row] = await interestRows("college_interest", email);
    check(label("college form: saved with every field"), !!row && row.name === "E2E Dean" && row.college === "E2E University" && row.role === "Wellness office" && row.students === "2,000–10,000" && row.message === INTEREST_NOTE);
    const notice = mailsTo(TEAM_EMAIL).find((m) => m.text.includes(email));
    check(label("college form: the team is told who, not what they wrote"), !!notice && /college/.test(notice.subject) && !JSON.stringify(notice).includes(INTEREST_NOTE));
    await assertClean(label("college form"), tab);
    await tab.context.close();
  }

  // required fields, caught in the browser
  {
    const tab = await openPage(name, PORTS.main);
    const { page } = tab;
    await fillModal(page, { email: newEmail("unused"), role: "A clinician" });
    await page.getByText("Want to tell us more?").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("heading", { name: "Join the SAANS Pro pilot." }).waitFor();
    await dialog.locator('input[type="email"]').fill("not-an-email");
    await dialog.getByRole("button", { name: "Request access" }).click();
    await dialog.getByRole("alert").waitFor();
    check(label("clinician form: a bad email shows an error, no success"), (await dialog.getByRole("alert").textContent()) === ERR_EMAIL && (await dialog.getByRole("heading", { name: "Thank you, we'll be in touch." }).count()) === 0);
    await tab.context.close();
  }

  // backend down: an honest error, never the old fake success
  {
    const tab = await openPage(name, PORTS.dead);
    const { page } = tab;
    const email = newEmail(`down-c-${name}`);
    await fillModal(page, { email: newEmail("unused"), role: "A clinician" });
    await page.getByText("Want to tell us more?").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("heading", { name: "Join the SAANS Pro pilot." }).waitFor();
    await dialog.locator('input[autocomplete="name"]').fill("E2E Down");
    await dialog.locator('input[type="email"]').fill(email);
    await dialog.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "Psychologist", exact: true }).click();
    await dialog.getByRole("button", { name: "Request access" }).click();
    await dialog.getByRole("alert").waitFor({ timeout: 20_000 });
    const text = await dialog.getByRole("alert").textContent();
    check(label("clinician form, backend down: error, not success"), text === "We couldn't send that just now. Please try again in a few minutes." && (await dialog.getByRole("heading", { name: "Thank you, we'll be in touch." }).count()) === 0, text);
    await tab.context.close();
  }
}

async function interestRules() {
  const post = (body, opts = {}) => send(PORTS.main, { path: "/api/interest", body, ...opts });
  const clinician = (email, extra) => ({ type: "clinician", name: "E2E", email, role: "Psychologist", ...extra });
  const college = (email, extra) => ({ type: "college", name: "E2E", email, college: "E2E University", role: "Faculty", ...extra });

  let email = newEmail("in-min");
  let r = await post(clinician(email));
  let [row] = await interestRows("clinician_interest", email);
  check("clinician: only the required fields is enough, blanks stored as nothing", r.status === 200 && row?.country === null && row?.clients === null && row?.note === null, `${r.status}`);
  email = newEmail("in-case");
  r = await post(clinician(`  ${email.toUpperCase()}  `));
  check("email is stored trimmed and lowercase", r.status === 200 && (await interestRows("clinician_interest", email)).length === 1, `${r.status}`);
  r = await post(clinician(email));
  check("writing in twice: same reply, both kept", r.status === 200 && r.text === '{"ok":true}' && (await interestRows("clinician_interest", email)).length === 2);
  email = newEmail("in-hindi");
  r = await post(college(email, { message: "न".repeat(2000) }));
  check("college: 2,000 characters of Hindi fit", r.status === 200 && (await interestRows("college_interest", email))[0]?.message.length === 2000, `${r.status}`);

  for (const [what, body] of [
    ["unknown type", { type: "admin", name: "x", email: newEmail("in"), role: "x" }],
    ["no type", { name: "x", email: newEmail("in"), role: "Faculty", college: "x" }],
    ["no name", clinician(newEmail("in"), { name: "   " })],
    ["bad email", clinician("nope")],
    ["unknown role", clinician(newEmail("in"), { role: "Admin" })],
    ["a college role on the clinician form", clinician(newEmail("in"), { role: "Dean or leadership" })],
    ["unknown country", clinician(newEmail("in"), { country: "Atlantis" })],
    ["unknown client count", clinician(newEmail("in"), { clients: "9000" })],
    ["over-long note", clinician(newEmail("in"), { note: "x".repeat(2001) })],
    ["no college", college(newEmail("in"), { college: "" })],
    ["unknown student count", college(newEmail("in"), { students: "9000" })],
    ["over-long message", college(newEmail("in"), { message: "x".repeat(2001) })],
  ]) {
    r = await post(body);
    const stored = body.email && body.email !== "nope" ? (await interestRows("clinician_interest", body.email)).length + (await interestRows("college_interest", body.email)).length : 0;
    check(`${what} is refused, nothing stored`, r.status === 400 && stored === 0 && !r.text.includes("Atlantis"), `${r.status}`);
  }
  for (const [what, body] of [["malformed JSON", "{nope"], ["JSON null", "null"], ["JSON array", "[]"]]) {
    r = await post(body);
    check(`interest: ${what} is refused`, r.status === 400, `${r.status}`);
  }

  email = newEmail("in-hp");
  r = await post(clinician(email, { leave_blank: "http://spam.example" }));
  check("interest: honeypot looks like success, stores nothing", r.status === 200 && (await interestRows("clinician_interest", email)).length === 0);
  email = newEmail("in-origin");
  r = await post(clinician(email), { headers: { origin: "https://evil.example" } });
  check("interest: another website is refused", r.status === 403 && (await interestRows("clinician_interest", email)).length === 0, `${r.status}`);
  r = await post(clinician(email), { noOrigin: true });
  check("interest: missing Origin is refused", r.status === 403, `${r.status}`);
  r = await post(clinician(email), { headers: { "content-type": "text/plain" } });
  check("interest: non-JSON is refused", r.status === 415, `${r.status}`);
  r = await post(clinician(email, { padding: "x".repeat(11_000) }));
  check("interest: oversized body is refused", r.status === 413, `${r.status}`);
  r = await send(PORTS.main, { method: "GET", path: "/api/interest" });
  check("interest: GET is not allowed", r.status === 405, `${r.status}`);
  const ip = uniqueIp();
  const codes = [];
  for (let i = 0; i < 21; i++) codes.push((await post({}, { headers: { "x-real-ip": ip } })).status);
  check("interest: rate limited", codes.slice(0, 20).every((c) => c === 400) && codes[20] === 429, `21st: ${codes[20]}`);
  r = await send(PORTS.noEnv, { path: "/api/interest", body: clinician(newEmail("in-noenv")) });
  check("interest: missing env is an error, not success", r.status === 503, `${r.status}`);

  // the notification
  email = newEmail("in-escape");
  r = await post(clinician(email, { name: '<img src=x onerror="alert(1)">' }));
  const escaped = mailsTo(TEAM_EMAIL).find((m) => m.text.includes(email));
  check("a name can't put HTML in the team's email", r.status === 200 && !!escaped && !escaped.html.includes("<img") && escaped.html.includes("&#60;img"));
  check("… and it's on record", (await emailsFor(TEAM_EMAIL)).some((m) => m.kind === "team_notice" && m.resend_id === escaped.resendId && m.status === "sent"));
  email = newEmail("in-mailfail");
  mailFailures = 1;
  r = await post(clinician(email));
  check("a failed notification still saves the form", r.status === 200 && (await interestRows("clinician_interest", email)).length === 1, `${r.status}`);
  email = newEmail("in-teamcap");
  r = await send(PORTS.capped, { path: "/api/interest", body: clinician(email) });
  const [saved] = await interestRows("clinician_interest", email);
  const capped = (await emailsFor(TEAM_EMAIL)).find((m) => m.interest_id === saved?.id);
  check("past the daily limit the form saves, with no notification", r.status === 200 && !!saved && capped?.status === "skipped" && capped?.reason === "team_limit" && !mailsTo(TEAM_EMAIL).some((m) => m.text.includes(email)), capped?.status);
  await db.query("update public.waitlist_emails set status = 'skipped', reason = 'test' where email = $1 and status = 'failed'", [TEAM_EMAIL]);
}

async function backendFailure(name, port, what) {
  const tab = await openPage(name, port);
  const { page } = tab;
  const email = newEmail(`down-${name}`);
  const dialog = await fillModal(page, { email });
  await submitModal(dialog);
  const alert = dialog.getByRole("alert");
  await alert.waitFor({ timeout: 25_000 });
  const text = await alert.textContent();
  check(`[${name}] ${what}: the message says nothing technical`, text === ERR_DOWN && !/database|supabase|\bdb\b|server/i.test(text), text);
  check(`[${name}] ${what}: no success, form still there`, (await dialog.getByRole("heading", { name: SUCCESS }).count()) === 0 && (await dialog.getByRole("button", { name: "Join the waitlist" }).isEnabled()));
  check(`[${name}] ${what}: no row`, (await rowsFor(email)).length === 0);
  await assertClean(`[${name}] ${what}`, tab, 503);
  if (port === PORTS.dead) await page.screenshot({ path: path.join(SHOTS, `${name}-modal-error.png`) });
  await tab.context.close();
}

/** With no email key at all, the form fill is still safe and the person sees the usual screen. */
async function missingMailKey(name) {
  const tab = await openPage(name, PORTS.noMail);
  const email = newEmail(`nokey-${name}`);
  const dialog = await fillModal(tab.page, { email, struggles: STRUGGLES_TEXT });
  await submitModal(dialog);
  await dialog.getByRole("heading", { name: SUCCESS }).waitFor();
  const [row] = await emailsFor(email);
  check(`[${name}] email key missing: stored, usual screen, email waiting`, (await rowsFor(email))[0]?.struggles === STRUGGLES_TEXT && row?.status === "queued" && mailsTo(email).length === 0, row?.status);
  await assertClean(`[${name}] email key missing`, tab);
  await tab.context.close();
}

/** Stops the real database container under the running site, then brings it back and retries. */
async function realOutage() {
  const container = env.WAITLIST_TEST_DB_CONTAINER || "supabase_db_saans";
  const docker = (...args) => spawnSync("docker", args, { encoding: "utf8" });
  if (!isLocalStack || docker("inspect", container).status !== 0) {
    skip("database container stopped under the running site", "only runs against the local stack");
    return;
  }
  await db.end();
  docker("stop", container);
  try {
    const tab = await openPage("desktop", PORTS.main);
    const email = newEmail("outage");
    const dialog = await fillModal(tab.page, { email });
    await submitModal(dialog);
    const alert = dialog.getByRole("alert");
    await alert.waitFor({ timeout: 30_000 });
    const text = await alert.textContent();
    check("Postgres stopped: error shown, not success", text === ERR_DOWN && (await dialog.getByRole("heading", { name: SUCCESS }).count()) === 0, text);

    docker("start", container);
    await reconnectDb();
    // PostgREST reconnects on its own; give it a moment, then retry from the same open form.
    let ok = false;
    for (let i = 0; i < 12 && !ok; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      await submitModal(dialog);
      ok = await dialog
        .getByRole("heading", { name: SUCCESS })
        .waitFor({ timeout: 9000 })
        .then(() => true)
        .catch(() => false);
    }
    check("recovery: retrying the same form succeeds once Postgres is back", ok && (await rowsFor(email)).length === 1);
    await tab.context.close();
  } finally {
    docker("start", container);
    await reconnectDb();
  }
}

async function reconnectDb() {
  const deadline = Date.now() + 60_000;
  for (;;) {
    const c = newDbClient();
    c.on("error", () => {});
    try {
      await c.connect();
      await c.query("select 1 from public.waitlist limit 1");
      db = c;
      return;
    } catch (e) {
      await c.end().catch(() => {});
      if (Date.now() > deadline) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function csp() {
  const res = await send(PORTS.main, { method: "GET" });
  const header = res.headers["content-security-policy"] ?? "";
  check("CSP restricts connect-src to same origin", /connect-src 'self'(;|$)/.test(header), header);
  const tab = await openPage("desktop", PORTS.main);
  const outcome = await tab.page.evaluate(async (url) => {
    try {
      await fetch(`${url}/rest/v1/waitlist`, { mode: "no-cors" });
      return "allowed";
    } catch {
      return "blocked";
    }
  }, SUPABASE_URL);
  const violations = await tab.page.evaluate(() => window.__csp);
  check("real browser: CSP blocks a direct call to Supabase", outcome === "blocked" && violations.some((v) => v.startsWith("connect-src")), violations.join(" | "));
  await tab.context.close();
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function noSecretInClient() {
  const staticFiles = walk(path.join(ROOT, ".next", "static"));
  const texts = staticFiles.filter((f) => /\.(js|css|json|html|txt|map)$/.test(f)).map((f) => readFileSync(f, "utf8"));
  const pages = [];
  for (const route of ["/", "/privacy", "/help", "/about", "/faq", "/privacy-policy", "/terms", "/waitlist/confirm", "/waitlist/not-me"]) {
    pages.push(await (await fetch(`http://localhost:${PORTS.main}${route}`)).text());
  }
  const all = [...texts, ...pages];
  const has = (needle) => all.some((t) => t.includes(needle));
  check("control: the client chunks do contain the route path", has("/api/waitlist"), `${texts.length} client files, ${pages.length} pages searched`);
  check("secret values not in client chunks or page HTML", ![SUPABASE_SECRET_KEY, WEBHOOK_SECRET, CRON_SECRET, MAIL_ENV.WAITLIST_IP_SALT].some(has));
  check("env var names not in client chunks or page HTML", !["SUPABASE_SECRET_KEY", "SUPABASE_URL", "RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "CRON_SECRET", "WAITLIST_IP_SALT"].some(has));
  check("email provider not in client chunks or page HTML", !has(TEST_RESEND_KEY) && !has("api.resend.com"));
  check("Supabase URL not in client chunks or page HTML", !has(SUPABASE_URL));
  check("Supabase client library not in client chunks", !has("supabase"));
  check("zod not in client chunks (server only)", !has("ZodError"));
}

function logsAreClean() {
  const text = logs.map((l) => l.text).join("\n").toLowerCase();
  const leaked = [...usedEmails].filter((e) => text.includes(e.toLowerCase()));
  check("server logs contain no submitted email", leaked.length === 0, `${usedEmails.size} addresses searched in ${text.length} bytes`);
  check("server logs contain nothing people wrote", !text.includes(STRUGGLES_TEXT.toLowerCase()) && !text.includes(INTEREST_NOTE.toLowerCase()));
  check("server logs contain no secret", ![SUPABASE_SECRET_KEY, TEST_RESEND_KEY, WEBHOOK_SECRET, CRON_SECRET, MAIL_ENV.WAITLIST_IP_SALT].some((s) => text.includes(s.toLowerCase())));
  const tokens = mails.map(tokenOf).filter(Boolean);
  check("server logs contain no confirmation link", tokens.length > 0 && !tokens.some((t) => text.includes(t.toLowerCase())), `${tokens.length} tokens searched`);
  const noMailLog = logs.find((l) => l.port === PORTS.noMail)?.text ?? "";
  check("a missing email key is named in the server log", noMailLog.includes("RESEND_API_KEY and WAITLIST_FROM_EMAIL must both be set"));
  const noSecretsLog = logs.find((l) => l.port === PORTS.noSecrets)?.text ?? "";
  check("a missing webhook secret is named in the server log", noSecretsLog.includes("RESEND_WEBHOOK_SECRET must be set"));
  check("a missing cron secret is named in the server log", noSecretsLog.includes("CRON_SECRET must be set"));
  const noEnvLog = logs.find((l) => l.port === PORTS.noEnv)?.text ?? "";
  check("missing env vars are named in the server log", noEnvLog.includes("SUPABASE_URL and SUPABASE_SECRET_KEY must both be set"));
  const deadLog = logs.find((l) => l.port === PORTS.dead)?.text ?? "";
  check("backend failures are logged (without personal data)", /\[waitlist\] /.test(deadLog), deadLog.match(/\[waitlist\].*/)?.[0] ?? "");

  if (!isLocalStack) return skip("Postgres and PostgREST container logs contain no signup email", "needs the local stack");
  // The SQL constraint checks insert addresses by hand and fail on purpose, so those are expected in here.
  const signups = [...usedEmails].filter((e) => !e.includes("-sql@") && !e.includes("-longsql@") && !e.includes("-anon@") && !e.includes("-race@"));
  const containers = ["supabase_db_saans", "supabase_rest_saans", "supabase_kong_saans"];
  const out = containers.map((c) => {
    const r = spawnSync("docker", ["logs", "--since", "30m", c], { encoding: "utf8", maxBuffer: 1 << 28 });
    return `${r.stdout}${r.stderr}`.toLowerCase();
  }).join("\n");
  const inContainers = signups.filter((e) => out.includes(e.toLowerCase()));
  check("Postgres and PostgREST container logs contain no signup email", inContainers.length === 0, inContainers.slice(0, 3).join(", ") || `${signups.length} addresses searched in ${out.length} bytes`);
}

// ---------------------------------------------------------------- main

mkdirSync(SHOTS, { recursive: true });
let exitCode = 1;
try {
  await db.connect();
  db.on("error", () => {});

  await new Promise((resolve) => mailServer.listen(PORTS.mail, resolve));
  browser = await chromium.launch({ executablePath: BROWSER_PATH, headless: true });
  await startSite(PORTS.main);
  await startSite(PORTS.dead, { SUPABASE_URL: "http://127.0.0.1:9" });
  await startSite(PORTS.badKey, { SUPABASE_SECRET_KEY: "wrong-key" });
  await startSite(PORTS.noEnv, { SUPABASE_URL: "", SUPABASE_SECRET_KEY: "" });
  await startSite(PORTS.noMail, { RESEND_API_KEY: "" });
  await startSite(PORTS.capped, { WAITLIST_MAIL_HOURLY_CAP: "0", WAITLIST_TEAM_NOTICE_DAILY_CAP: "0" });
  await startSite(PORTS.noSecrets, { RESEND_WEBHOOK_SECRET: "", CRON_SECRET: "", WAITLIST_IP_SALT: "" });

  await section("Database and PostgREST", databaseAndPostgrest);
  await section("API abuse protection (raw HTTP)", apiAbuse);
  await section("Cross-origin from a real browser", crossOriginFromBrowser);
  await section("Confirmation rules", confirmRules);
  await section("Webhook rules", webhookRules);
  await section("Clinician and college rules", interestRules);
  await section("Daily job", cronRules);
  for (const name of Object.keys(VIEWPORTS)) {
    await section(`Modal and home page form at ${name} width`, () => modalFlows(name));
    await section(`Questions by audience at ${name} width`, () => questionsByRole(name));
    await section(`Confirmation journey at ${name} width`, () => confirmJourney(name));
    await section(`Clinician and college forms at ${name} width`, () => interestForms(name));
    await section(`Backend problems at ${name} width`, async () => {
      await backendFailure(name, PORTS.dead, "dead Supabase URL");
      await backendFailure(name, PORTS.badKey, "wrong secret key");
      await backendFailure(name, PORTS.noEnv, "env vars missing");
      await missingMailKey(name);
    });
  }
  await section("CSP", csp);
  await section("Secrets in the client", noSecretInClient);
  await section("Real outage", realOutage);
  await section("Logs", () => logsAreClean());

  const failed = results.filter((r) => r.ok === false);
  const skipped = results.filter((r) => r.ok === null);
  console.log(`\n${results.length - failed.length - skipped.length} passed, ${failed.length} failed, ${skipped.length} skipped`);
  for (const f of failed) console.log(`FAILED: ${f.name}  [${f.seen}]`);
  exitCode = failed.length ? 1 : 0;
} catch (e) {
  console.error(`Test run aborted: ${e?.stack ?? e}`);
} finally {
  await browser?.close().catch(() => {});
  for (const s of servers) s.kill();
  mailServer.close();
  let cleaned = 0;
  const hashes = [...usedEmails].map(sha256);
  await db.query("delete from public.waitlist_suppressed where email_hash = any($1)", [hashes]).catch((e) => console.error(`Cleanup failed: ${e.message}`));
  // Events for emails we made up, then emails (which take their events), then the rows they point at.
  await db.query("delete from public.waitlist_email_events where svix_id like $1 or resend_id like $1", [`e2e-${runId}-%`]).catch((e) => console.error(`Cleanup failed: ${e.message}`));
  for (const table of ["waitlist_emails", "waitlist_submissions", "waitlist", "clinician_interest", "college_interest"]) {
    const del = await db
      .query(`delete from public.${table} where email like $1`, [`e2e-${runId}-%`])
      .catch((e) => console.error(`Cleanup failed: ${e.message}`));
    if (del) cleaned += del.rowCount;
  }
  const ipSalted = await db.query("delete from public.waitlist_ip_counters where ip_hash = any($1)", [[...usedIps].map((ip) => createHmac("sha256", MAIL_ENV.WAITLIST_IP_SALT).update(ip).digest("hex"))]).catch((e) => console.error(`Cleanup failed: ${e.message}`));
  cleaned += ipSalted?.rowCount ?? 0;
  console.log(`Cleaned up ${cleaned} test row(s).`);
  await db.end().catch(() => {});
}
process.exit(exitCode);
