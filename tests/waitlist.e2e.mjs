// End-to-end test of the waitlist: real browser, real production build, real Supabase.
// Nothing is mocked. Run: npm run build && npm run test:waitlist
//
// The site's env comes from .env.local; the test's own settings from .env.test.local
// (see the README). Only rows with a unique per-run address are written, and only those
// are deleted afterwards, so it is safe to run against a project that has real signups.

import { spawn, spawnSync } from "node:child_process";
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

const PORTS = { main: 3300, dead: 3301, badKey: 3302, noEnv: 3303, attacker: 3304 };
const VIEWPORTS = {
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } },
};
const SUCCESS = "You're on the list.";
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
const uniqueIp = () => `ip-${runId}-${++serial}`;

const newDbClient = () =>
  new pg.Client({
    connectionString: WAITLIST_TEST_DATABASE_URL,
    ssl: isLocalStack ? undefined : { rejectUnauthorized: false },
  });
let db = newDbClient();
const rowsFor = async (email) =>
  (await db.query("select * from public.waitlist where lower(email) = lower($1)", [email])).rows;

/** Raw HTTP so that every header (and the lack of one) is exactly what the test says. */
function send(port, { method = "POST", headers = {}, body, chunked = false, noOrigin = false } = {}) {
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
    const req = http.request({ host: "localhost", port, path: "/api/waitlist", method, headers: allHeaders, agent: false }, (res) => {
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

const logs = [];
const servers = [];
function startSite(port, overrides = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
      cwd: ROOT,
      env: { ...process.env, ...overrides },
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
  const table = (
    await db.query(`select relrowsecurity from pg_class where oid = 'public.waitlist'::regclass`)
  ).rows[0];
  check("RLS is enabled", table.relrowsecurity === true);
  const policies = await db.query(`select 1 from pg_policies where schemaname='public' and tablename='waitlist'`);
  check("table has no RLS policies", policies.rowCount === 0, `${policies.rowCount} policies`);
  for (const role of ["anon", "authenticated"]) {
    const { rows } = await db.query(
      `select bool_or(has_table_privilege($1, 'public.waitlist', p)) as any_priv
       from unnest(array['select','insert','update','delete','truncate','references','trigger']) as p`,
      [role],
    );
    check(`${role} holds no privileges on the table`, rows[0].any_priv === false);
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
    check(`${label} cannot insert through PostgREST`, [401, 403].includes(write.status) && (await rowsFor(anonEmail)).length === 0, `${write.status}`);

    const patch = await fetch(`${rest}?email=eq.${encodeURIComponent(sqlEmail)}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "hacked" }),
    });
    const del = await fetch(`${rest}?email=eq.${encodeURIComponent(sqlEmail)}`, { method: "DELETE", headers });
    const after = await rowsFor(sqlEmail);
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
}

async function apiAbuse() {
  const port = PORTS.main;
  const noRow = async (email) => (await rowsFor(email)).length === 0;

  // the optional "what's been hard" answer
  const post = (body) => fetch(`http://localhost:${port}/api/waitlist`, { method: "POST", headers: { "Content-Type": "application/json", Origin: `http://localhost:${port}`, "x-real-ip": "203.0.113.77" }, body: JSON.stringify(body) });
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
  check("duplicate kept one lowercase row", dupRows.length === 1 && dupRows[0].email === email, `${dupRows.length} row(s), ${dupRows[0]?.email}`);
  check("duplicate did not overwrite the first answers", dupRows[0]?.role === ROLE && dupRows[0]?.country === "India" && dupRows[0]?.wants_survey === false);
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
    check(label("still one row, first answers kept"), rows.length === 1 && rows[0].role === ROLE && rows[0].country === "India", `${rows.length} row(s), role=${rows[0]?.role}`);
    check(label("duplicate reached the server"), seen.apiRequests.length === 1);
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
    check(label("honeypot filled: no row"), (await rowsFor(email)).length === 0);
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

async function backendFailure(name, port, what) {
  const tab = await openPage(name, port);
  const { page } = tab;
  const email = newEmail(`down-${name}`);
  const dialog = await fillModal(page, { email });
  await submitModal(dialog);
  const alert = dialog.getByRole("alert");
  await alert.waitFor({ timeout: 20_000 });
  const text = await alert.textContent();
  check(`[${name}] ${what}: error shown`, text === ERR_DOWN, text);
  check(`[${name}] ${what}: no success, form still there`, (await dialog.getByRole("heading", { name: SUCCESS }).count()) === 0 && (await dialog.getByRole("button", { name: "Join the waitlist" }).isEnabled()));
  check(`[${name}] ${what}: no row`, (await rowsFor(email)).length === 0);
  await assertClean(`[${name}] ${what}`, tab, 503);
  if (port === PORTS.dead) await page.screenshot({ path: path.join(SHOTS, `${name}-modal-error.png`) });
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
    await alert.waitFor({ timeout: 25_000 });
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
  for (const route of ["/", "/privacy", "/help", "/about", "/faq", "/privacy-policy", "/terms"]) {
    pages.push(await (await fetch(`http://localhost:${PORTS.main}${route}`)).text());
  }
  const all = [...texts, ...pages];
  const has = (needle) => all.some((t) => t.includes(needle));
  check("control: the client chunks do contain the route path", has("/api/waitlist"), `${texts.length} client files, ${pages.length} pages searched`);
  check("secret key value not in client chunks or page HTML", !has(SUPABASE_SECRET_KEY));
  check("env var names not in client chunks or page HTML", !has("SUPABASE_SECRET_KEY") && !has("SUPABASE_URL"));
  check("Supabase URL not in client chunks or page HTML", !has(SUPABASE_URL));
  check("Supabase client library not in client chunks", !has("supabase"));
  check("zod not in client chunks (server only)", !has("ZodError"));
}

function logsAreClean() {
  const text = logs.map((l) => l.text).join("\n").toLowerCase();
  const leaked = [...usedEmails].filter((e) => text.includes(e.toLowerCase()));
  check("server logs contain no submitted email", leaked.length === 0, `${usedEmails.size} addresses searched in ${text.length} bytes`);
  check("server logs contain nothing people wrote", !text.includes(STRUGGLES_TEXT.toLowerCase()));
  check("server logs contain no secret key", !text.includes(SUPABASE_SECRET_KEY.toLowerCase()));
  const noEnvLog = logs.find((l) => l.port === PORTS.noEnv)?.text ?? "";
  check("missing env vars are named in the server log", noEnvLog.includes("SUPABASE_URL and SUPABASE_SECRET_KEY must both be set"));
  const deadLog = logs.find((l) => l.port === PORTS.dead)?.text ?? "";
  check("backend failures are logged (without personal data)", /\[waitlist\] /.test(deadLog), deadLog.match(/\[waitlist\].*/)?.[0] ?? "");

  if (!isLocalStack) return skip("Postgres and PostgREST container logs contain no signup email", "needs the local stack");
  // The SQL constraint checks insert addresses by hand and fail on purpose, so those are expected in here.
  const signups = [...usedEmails].filter((e) => !e.includes("-sql@") && !e.includes("-anon@"));
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

  browser = await chromium.launch({ executablePath: BROWSER_PATH, headless: true });
  await startSite(PORTS.main);
  await startSite(PORTS.dead, { SUPABASE_URL: "http://127.0.0.1:9" });
  await startSite(PORTS.badKey, { SUPABASE_SECRET_KEY: "wrong-key" });
  await startSite(PORTS.noEnv, { SUPABASE_URL: "", SUPABASE_SECRET_KEY: "" });

  await section("Database and PostgREST", databaseAndPostgrest);
  await section("API abuse protection (raw HTTP)", apiAbuse);
  await section("Cross-origin from a real browser", crossOriginFromBrowser);
  for (const name of Object.keys(VIEWPORTS)) {
    await section(`Modal and home page form at ${name} width`, () => modalFlows(name));
    await section(`Backend problems at ${name} width`, async () => {
      await backendFailure(name, PORTS.dead, "dead Supabase URL");
      await backendFailure(name, PORTS.badKey, "wrong secret key");
      await backendFailure(name, PORTS.noEnv, "env vars missing");
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
  const del = await db
    .query("delete from public.waitlist where email like $1", [`e2e-${runId}-%`])
    .catch((e) => console.error(`Cleanup failed: ${e.message}`));
  if (del) console.log(`Cleaned up ${del.rowCount} test row(s).`);
  await db.end().catch(() => {});
}
process.exit(exitCode);
