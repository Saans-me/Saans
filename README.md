# SAANS website (Next.js)

The SAANS marketing site, rebuilt from the SAANS design handoff (reference HTML + playbook).
The handoff itself is kept outside this repo (`design_handoff/` is git-ignored); copy is kept word for word.

Next.js 16 App Router · React 19 · TypeScript · CSS Modules · no UI framework.

## Run

```bash
npm install
cp .env.example .env.local   # then fill in the values, see "Waitlist setup"
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

All the forms need Supabase. Until it is configured they show an error, never a fake success.

## Waitlist setup

The modal and the home page form both POST to the site's own `/api/waitlist`. Every form fill is stored in
`public.waitlist_submissions` first, so nothing that happens to the email can lose it. Only a database failure
shows an error. Clicking the link in the email is the confirmation: it moves the person into `public.waitlist`,
so that table holds only confirmed addresses, and it is the only list the launch email may go to.

| Read this | For |
|---|---|
| `waitlist_overview` | One line per address: status, answers, emails sent, last email's status, clicks |
| `waitlist` | Confirmed people |
| `waitlist_submissions` | Every form fill. Unconfirmed rows are unverified: anyone can type anyone's address |
| `waitlist_emails` | Every email and what happened to it |
| `waitlist_email_events` | What Resend reported, as received |

Anyone can type anyone's address, so these rules decide when an email goes:

| Situation | Stored | Email |
|---|---|---|
| New address | Yes | Confirmation, with a link that lasts 30 days |
| Filled in again within 7 days | Yes | None |
| Filled in again after 7 days, still unconfirmed | Yes | One last reminder |
| Two emails already sent | Yes | None, ever |
| Sending failed | Yes | The daily job tries again, up to 3 tries. Doesn't count towards the two |
| Permanent bounce, spam complaint or on Resend's own list | Yes | None, ever |
| Already confirmed | Yes, `waitlist` doesn't change | "You're already on the list", at most one in 30 days |
| Pressed "this wasn't me" | No | None, ever |
| Over 5 emails from one IP in 24 hours | Yes | None for now; it can get one from another IP |
| Over 50 signup emails in an hour | Yes | Queued for the daily job |

The person sees the same screen in every case, so the form can't reveal who is on the list. The limits are env
vars (see `.env.example`). `/api/cron/waitlist-mail` is the daily job (`vercel.json`), and `/api/webhooks/resend`
receives what happened to each email. A new clinician or college form tells the team by email, with who wrote in but not
what they wrote.

The browser never talks to Supabase. All the tables have RLS on with no policies and no privileges for `anon` or
`authenticated`, and the server changes them only through database functions.

**1. The table** is already created on the project. Its migration is kept out of this repo
(`supabase/migrations/` is git-ignored), so a new project needs that file from the team, run once in the
dashboard's SQL Editor.

**2. Set the env vars** in the host's settings (and in `.env.local` for local runs):

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project Settings → Data API → Project URL |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → a secret key (`sb_secret_…`), or the legacy `service_role` key |
| `RESEND_API_KEY` | Resend → API Keys, with sending access |
| `WAITLIST_FROM_EMAIL` | The sender on a domain verified in Resend, such as `SAANS <hello@saans.me>` |
| `SITE_URL` | Optional. The address used in the email's link. Defaults to `https://saans.me` |
| `RESEND_WEBHOOK_SECRET` | Resend → Webhooks → your endpoint → Signing secret. The endpoint is `https://saans.me/api/webhooks/resend`, with the events sent, delivered, delivery delayed, bounced, complained, failed and suppressed |
| `CRON_SECRET` | Any long random text. Vercel sends it to the daily job |
| `WAITLIST_IP_SALT` | Any long random text. Without it, emails per IP aren't limited |
| `TRUSTED_CLIENT_IP_HEADER` | Optional. Leave unset on Vercel. On Netlify: `x-nf-client-connection-ip` |

The secret key bypasses RLS: keep it server-side and never give it a `NEXT_PUBLIC_` prefix.

**Limits to know about:** the general request limit is in-memory, so on serverless each instance counts on its own
(details in `src/lib/waitlist/rate-limit.ts`); the email limits above are in the database and hold across instances. A college
can share one IP, so raise `WAITLIST_MAILS_PER_IP` if students report no email. To remove someone from the list by hand,
use the SQL Editor; the server's key can only reach these tables through the database functions.

### Testing it

`tests/waitlist.e2e.mjs` drives the real forms in a browser against a production build and a real database.
Only the email provider is replaced, by a local server that captures each message so the test can follow its link. It needs Edge and `playwright-core` (paths at the top of the script, or set
`WAITLIST_TEST_BROWSER` and `WAITLIST_TEST_PLAYWRIGHT_FROM`), free ports 3300–3308, and a git-ignored
`.env.test.local`:

```bash
WAITLIST_TEST_DATABASE_URL=   # Postgres connection string (hosted: dashboard, Connect, Session pooler)
WAITLIST_TEST_PUBLISHABLE_KEY= # publishable key (or WAITLIST_TEST_ANON_KEY on older projects), used to prove it is locked out
```

Local stack (needs Docker): `npx supabase start`, then `npx supabase status -o env` for all the values.
`SUPABASE_URL` is `API_URL`, `SUPABASE_SECRET_KEY` is `SECRET_KEY`, and the database URL is `DB_URL`.

```bash
npm run build && npm run test:waitlist
```

Against a hosted project it writes only rows with a per-run `e2e-…@example.com` address and deletes those at the end.
The daily job's sending is tested only on the local stack, because it acts on every due email in the database.

## Pages

| Route | What |
|---|---|
| `/` | Hero, Problem, Solution (+film), Who, For you (tabs), Clinicians, Colleges (tabs), Privacy preview, Where we're going, Survey, Join |
| `/privacy` | Privacy card, what we collect, who sees what, safety, promises |
| `/help` | Helplines (no waitlist button) |
| `/about` | Story, promise & vision, team |
| `/faq` | 8-question accordion |
| `/privacy-policy`, `/terms` | Placeholders |

## Structure

```
src/
  app/                 routes (api/waitlist is the signup endpoint), layout (fonts, theme bootstrap, header/footer/modals), globals.css (tokens)
  components/
    layout/            Header, MobileMenu, ThemeToggle, Footer, Providers
    home/              one component per home section
    privacy/ pages/    page sections
    shared/            Icon, Logo, Devices (Laptop/PhoneFrame), Helplines, PrivacyCard, Faq, Actions
    modals/            ModalShell + Waitlist, Clinician, College, Breath, Help, Film
  context/             Theme, Modal (+ form state), UI (For-you tab, menu), Toast
  hooks/               useReveal (reveal, count-up, bar grow, parallax), useBreath, useFocusTrap, useMediaQuery
  lib/                 content.ts (all shared copy), forms.ts, analytics.ts, waitlist/ (validation, rate limit, Supabase)
```

### How things work

- **Theme**: dark by default. An inline script in `<head>` reads `localStorage['saans-theme-v3']` before hydration.
  Everything themes through CSS variables in `globals.css`.
- **Popups**: `useModal().open('waitlist' | 'clinician' | 'college' | 'breath' | 'help' | 'film')`, or
  `<ModalButton modal="…">` from server components. One `ModalShell` handles scrim, focus trap, Esc,
  focus return, scroll lock, enter/exit animation and the phone bottom sheet.
- **Forms**: `lib/forms.ts`. Waitlist forms → `/api/waitlist` → Supabase (`lib/waitlist/`). Clinician and college
  forms → POST to `/api/interest` with `type: clinician | college`, saved to `clinician_interest` and `college_interest`.
- **Smooth scrolling**: Lenis (`components/layout/SmoothScroll.tsx`), paused under popups; off for reduced motion.
- **Hero intro**: `[data-intro]` CSS in `globals.css`, started by the `<head>` script once the heading font is ready.
- **Reveal motion**: any element with `data-reveal="up|scale|fade"` (+ `data-reveal-delay`) animates in once.
  Reduced motion turns all motion off.
- **Analytics**: `lib/analytics.ts` pushes the README §12 events to `window.dataLayer`.
- **Laptop zoom**: `.page{zoom:.86}` at 1000–1599px wide (and `.8`/`.74` on short screens), never on modals.

## Before launch (placeholders)

- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `WAITLIST_FROM_EMAIL` and `NEXT_PUBLIC_SITE_URL` (env vars)
- The X / Instagram / LinkedIn links → `src/lib/content.ts`
- Privacy policy and terms text
- Film captions → put a `.vtt` in `public/film/` and set `FILM_CAPTIONS` in `src/components/modals/FilmModal.tsx`

## Deploy

Vercel: import the repo, defaults. Netlify: build `next build` (runtime auto-detected).
Set the env vars above in the host's settings.
