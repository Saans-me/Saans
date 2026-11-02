# SAANS website (Next.js)

The SAANS marketing site, rebuilt from the SAANS design handoff (reference HTML + playbook).
The handoff itself is kept outside this repo (`design_handoff/` is git-ignored); copy is kept word for word.

Next.js 16 App Router · React 19 · TypeScript · CSS Modules · no UI framework.

## Run

```bash
npm install
cp .env.example .env.local   # optional: set NEXT_PUBLIC_FORM_ENDPOINT
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

Without `NEXT_PUBLIC_FORM_ENDPOINT`, forms simulate success after 700 ms (same as the reference).

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
  app/                 routes, layout (fonts, theme bootstrap, header/footer/modals), globals.css (tokens)
  components/
    layout/            Header, MobileMenu, ThemeToggle, Footer, Providers
    home/              one component per home section
    privacy/ pages/    page sections
    shared/            Icon, Logo, Devices (Laptop/PhoneFrame), Helplines, PrivacyCard, Faq, Actions
    modals/            ModalShell + Waitlist, Clinician, College, Breath, Help, Film
  context/             Theme, Modal (+ form state), UI (For-you tab, menu), Toast
  hooks/               useReveal (reveal, count-up, bar grow, parallax), useBreath, useFocusTrap, useMediaQuery
  lib/                 content.ts (all shared copy), forms.ts, analytics.ts
```

### How things work

- **Theme**: dark by default. An inline script in `<head>` reads `localStorage['saans-theme-v3']` before hydration.
  Everything themes through CSS variables in `globals.css`.
- **Popups**: `useModal().open('waitlist' | 'clinician' | 'college' | 'breath' | 'help' | 'film')`, or
  `<ModalButton modal="…">` from server components. One `ModalShell` handles scrim, focus trap, Esc,
  focus return, scroll lock, enter/exit animation and the phone bottom sheet.
- **Forms**: `lib/forms.ts` → single POST to `NEXT_PUBLIC_FORM_ENDPOINT` with `type: user | clinician | college`.
- **Smooth scrolling**: Lenis (`components/layout/SmoothScroll.tsx`), paused under popups; off for reduced motion.
- **Hero intro**: `[data-intro]` CSS in `globals.css`, started by the `<head>` script once the heading font is ready.
- **Reveal motion**: any element with `data-reveal="up|scale|fade"` (+ `data-reveal-delay`) animates in once.
  Reduced motion turns all motion off.
- **Analytics**: `lib/analytics.ts` pushes the README §12 events to `window.dataLayer`.
- **Laptop zoom**: `.page{zoom:.86}` at 1000–1599px wide (and `.8`/`.74` on short screens), never on modals.

## Before launch (placeholders)

- `NEXT_PUBLIC_FORM_ENDPOINT` and `NEXT_PUBLIC_SITE_URL` (env vars)
- `hello@saans.me` and the X / Instagram / LinkedIn links → `src/lib/content.ts`
- Team names, lines and photos → `/about`
- Privacy policy and terms text
- Film captions → put a `.vtt` in `public/film/` and set `FILM_CAPTIONS` in `src/components/modals/FilmModal.tsx`

## Deploy

Vercel: import the repo, defaults. Netlify: build `next build` (runtime auto-detected).
Set the env vars above in the host's settings.
