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

The waitlist forms need Supabase. Until it is configured they show an error, never a fake success.
The clinician and college forms are separate: without `NEXT_PUBLIC_FORM_ENDPOINT` they still simulate
success after 700 ms and **send nothing anywhere**.

## Waitlist setup

The modal and the home page form both POST to the site's own `/api/waitlist`. It stores the request in
`public.waitlist_pending` and emails a confirmation link through Resend. Pressing the button on that link's
page moves the person into `public.waitlist`, so that table holds only confirmed addresses. Unconfirmed
requests are deleted after 7 days.

The browser never talks to Supabase. Both tables have RLS on with no policies and no privileges for `anon` or
`authenticated`, and the server changes them only through three database functions.

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
| `TRUSTED_CLIENT_IP_HEADER` | Optional. Leave unset on Vercel. On Netlify: `x-nf-client-connection-ip` |

The secret key bypasses RLS: keep it server-side and never give it a `NEXT_PUBLIC_` prefix.

**Limits to know about:** rate limiting is in-memory, so on serverless each instance counts on its own
(details in `src/lib/waitlist/rate-limit.ts`). To remove someone from the list, delete their row in the SQL
Editor; the server's key deliberately can only read and insert.

### Testing it

`tests/waitlist.e2e.mjs` drives the real forms in a browser against a production build and a real database.
Only the email provider is replaced, by a local server that captures each message so the test can follow its link. It needs Edge and `playwright-core` (paths at the top of the script, or set
`WAITLIST_TEST_BROWSER` and `WAITLIST_TEST_PLAYWRIGHT_FROM`), free ports 3300–3306, and a git-ignored
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
  forms → single POST to `NEXT_PUBLIC_FORM_ENDPOINT` with `type: clinician | college`.
- **Smooth scrolling**: Lenis (`components/layout/SmoothScroll.tsx`), paused under popups; off for reduced motion.
- **Hero intro**: `[data-intro]` CSS in `globals.css`, started by the `<head>` script once the heading font is ready.
- **Reveal motion**: any element with `data-reveal="up|scale|fade"` (+ `data-reveal-delay`) animates in once.
  Reduced motion turns all motion off.
- **Analytics**: `lib/analytics.ts` pushes the README §12 events to `window.dataLayer`.
- **Laptop zoom**: `.page{zoom:.86}` at 1000–1599px wide (and `.8`/`.74` on short screens), never on modals.

## Before launch (placeholders)

- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_FORM_ENDPOINT` and `NEXT_PUBLIC_SITE_URL` (env vars)
- The X / Instagram / LinkedIn links → `src/lib/content.ts`
- Privacy policy and terms text
- Film captions → put a `.vtt` in `public/film/` and set `FILM_CAPTIONS` in `src/components/modals/FilmModal.tsx`

## Deploy

Vercel: import the repo, defaults. Netlify: build `next build` (runtime auto-detected).
Set the env vars above in the host's settings.
