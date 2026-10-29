# Handoff: saans landing page → Next.js

## Overview
saans is an emotional-support companion: a landing page with text/voice chat (currently shown as "Coming soon"), a 1-minute breathing exercise, a path to professional care, and privacy information. This bundle explains how to rebuild the finished landing page as a production **Next.js (App Router) + TypeScript** app and how to hand it straight to **Claude Code**.

## About the design files
Everything in `reference/` is a **design reference built in HTML**: a working prototype that shows the intended look, copy, motion and behaviour. It is **not production code to copy**. The task is to **recreate it in Next.js** with idiomatic components, real CSS (CSS Modules or Tailwind) and React state.
- `reference/index.html`: the full page. Open it in a browser. This is the source of truth for visuals.
- `reference/Saans.source.dc.html`: the same page as editable source. The markup lives in `<x-dc>…</x-dc>` (inline styles, `{{ holes }}`). The logic is the `class Component` at the bottom: state, handlers, motion, the breathing timer.
- `reference/coming-soon.html`: the old standalone coming-soon page. It has been replaced by a pop-up, so it's for reference only.
- `reference/motion.js`, `support.js`: runtime helpers for the prototype. Don't port these; re-implement the behaviour (see Motion).

## Fidelity
**High-fidelity.** Final colours, type, spacing, copy and motion. Recreate it pixel-close, and keep the copy verbatim.

---

## Part A: hand it to Claude Code (fastest path)

1. Unzip this folder onto your machine.
2. Create the app:
   ```bash
   npx create-next-app@latest saans --ts --app --eslint --src-dir --import-alias "@/*" --no-tailwind
   cd saans
   ```
   (Choose `--tailwind` instead if you prefer Tailwind. The tokens below map 1:1 to a Tailwind theme.)
3. Copy this whole handoff folder into the repo as `/design_handoff_saans_nextjs`.
4. Open Claude Code in the repo (`claude`) and paste:
   ```text
   Read design_handoff_saans_nextjs/README.md fully, then open
   design_handoff_saans_nextjs/reference/index.html and Saans.source.dc.html.
   Rebuild the landing page in this Next.js App Router project exactly as
   specified: same layout, copy, colours, light/dark themes, pop-ups, breathing
   exercise, scroll reveals, mobile dock, and the responsive rules. Use the file
   structure in "Part B". Use CSS Modules + CSS variables for tokens. Keep all
   copy verbatim. Work section by section; after each section run `npm run dev`
   and compare against reference/index.html at 390px, 768px, 1366×768 and
   1920px. Don't port support.js/motion.js; re-implement behaviour in React.
   ```
5. Then iterate section by section ("Now do the Professional care pop-up", and so on), checking against `reference/index.html`.
6. Deploy: push to GitHub, then import into Vercel or Netlify (Netlify: build command `next build`, the Next.js runtime is auto-detected).

---

## Part B: Next.js handbook

### File structure
```
src/
  app/
    layout.tsx           # <html data-theme>, Comfortaa font, theme bootstrap script, metadata
    page.tsx             # composes the sections in order
    globals.css          # tokens (:root + [data-theme=dark]), resets, keyframes, laptop zoom rules
  components/
    Header.tsx           # sticky glass header, nav, theme toggle, mobile menu
    Hero.tsx
    WhatItDoes.tsx       # bento cards (chat, languages marquee, breathe, patterns chart, voice)
    WhoItsFor.tsx        # 3 orbs (01/02/03) + connecting line
    ProfessionalCare.tsx # steps + floating demo cards (phone: simplified stack)
    Journey.tsx          # 8 steps: snake path ≥980px, vertical list below
    Privacy.tsx          # settings-card demo + "Memory cleared" chip (hidden <640px)
    Story.tsx            # quote card, promise pills, vision card with flower visual
    BreathCTA.tsx        # unboxed headline over breathing rings (no buttons)
    Footer.tsx
    MobileDock.tsx       # floating bottom tab bar (<1000px)
    modals/
      GlassModal.tsx     # shared shell: scrim + blobs + glass card + enter/exit animation
      ComingSoonModal.tsx
      BreathModal.tsx
      CareModal.tsx
      PrivacyModal.tsx
      HelpModal.tsx      # crisis help
      ForModal.tsx / HowModal.tsx
  hooks/
    useTheme.ts          # light/dark, persisted in localStorage 'saans-theme', follows OS until set
    useReveal.ts         # IntersectionObserver scroll reveals
    useActiveSection.ts  # which section is in view (nav + dock highlight)
    useBreathing.ts      # breathing timer state machine
  lib/tokens.ts          # optional TS mirror of tokens
```
Every component that uses state, effects or browser APIs needs `"use client"`. Static sections can stay server components.

### Page order
Header → Hero → What it does (`#how`) → Who it's for (`#for`) → Professional care (`#care`) → Your journey (`#journey`) → Privacy & safety (`#privacy`) → Our story (`#story`) → Breath CTA → Footer → Mobile dock.
Section anchors use `scroll-margin-top: 88px`.

### Design tokens (globals.css)
```css
:root{
  --bg:#F3F0F8; --surface:#FFFFFF; --text:#2E2747; --text2:#514A69; --border:#DCD5EA;
  --primary:#4E4475; --on-primary:#FFFFFF; --accent:#A99CD8; --soft1:#E3DDF1; --soft2:#EFD2C9;
  --deep:#3B3355; --on-deep:#F7F5FA; --on-deep2:#D3CCE6; --leaf1:#2E2747; --leaf2:#A99CD8;
  --dot:#FF5E00; --shadow:rgba(46,39,71,.18); --danger:#B03A2E; color-scheme:light;
}
[data-theme="dark"]{
  --bg:#1C1828; --surface:#241F33; --text:#EEEAF6; --text2:#B9B1CF; --border:#352E48;
  --primary:#C9C0E6; --on-primary:#2A2440; --accent:#B9B0D9; --soft1:#2A2440; --soft2:#2F2944;
  --deep:#302A47; --on-deep:#EEEAF6; --on-deep2:#B9B1CF; --leaf1:#EEEAF6; --leaf2:#B9B0D9;
  --shadow:rgba(10,8,18,.45); --danger:#F08A80; color-scheme:dark;
}
```
Fixed colours: ink on accent `#2A2440`, brand dot `#FF5E00`, success `#3FA37A`.

**Typography:** Comfortaa (Google Fonts, weights 300–700). Load it with `next/font/google`.
- Body: 16px, line-height 1.68.
- H2: `clamp(30px,3.8vw,48px)`, weight 700, line-height 1.08, letter-spacing −0.035em, `text-wrap:balance`.
- Hero H1: `clamp(36px,5.2vw,62px)`.
- Card H3: `clamp(20px,2vw,25px)`.
- Eyebrows: 12.5px, 700, letter-spacing .14em, uppercase, `var(--text2)`.
- Breath CTA headline: `clamp(34px,5vw,64px)`, letter-spacing −0.04em.

**Radii:** pills `999px`; cards `clamp(26px,3.4vw,36px)`; big panels `clamp(26px,4vw,40px)`; modals `clamp(26px,3vw,36px)`; small tiles 16–22px.

**Spacing:**
- Content max-width 1240px, side padding `clamp(16px,3vw,32px)`.
- Section top padding `clamp(56px,7vw,96px)`.
- Grid gaps 14–16px.

**Shadows:**
- Cards: `0 30px 60px -36px var(--shadow)` on hover.
- Floating UI: `0 40px 80px -40px var(--shadow)`.

**Easing:**
- Standard: `cubic-bezier(.22,1,.36,1)`.
- Modal enter: `cubic-bezier(.16,1,.3,1)`.
- Modal exit: `cubic-bezier(.4,0,.2,1)`.

Copy all `@keyframes saans-*` from `reference/Saans.source.dc.html` (inside `<helmet><style>`) into `globals.css` unchanged.

### Theme
- Before hydration, an inline `<script>` in `layout.tsx` sets `document.documentElement.dataset.theme` from `localStorage['saans-theme']`, falling back to `prefers-color-scheme`. This prevents a flash.
- The header toggle switches the theme and saves the choice.
- Until the user picks a theme, it follows OS changes.

### Responsive rules
Fluid layouts use `repeat(auto-fit, minmax(min(100%, Npx), 1fr))` grids. Breakpoints come from the prototype:

**Width < 640px (phone)**
- Care visual becomes a simple stack: profile card, then a row of 2 chips. The tilted/floating cards are not rendered.
- Privacy's "Memory cleared" chip is hidden.

**Width < 860px**
- Header nav collapses to a hamburger menu.

**Width < 980px**
- Journey switches to a vertical list.

**Width < 1000px**
- Mobile dock is shown.
- Footer gets bottom spacing of `84px + safe-area`.

**Width ≥ 1000px (laptops)** — the page is scaled down with `zoom` on the root wrapper. It looked "zoomed in" on small laptops.
```css
@media (min-width:1000px) and (max-width:1599px){ .page{zoom:.9} }
@media (min-width:1000px) and (max-height:860px){ .page{zoom:.86} }
@media (min-width:1000px) and (max-height:720px){ .page{zoom:.8} }
@media (min-width:1000px) and (max-height:600px){ .page{zoom:.74} }
```
(A cleaner alternative is a fluid root font-size with all sizes in `rem`. If you go that way, keep the same visual result.)

**Touch devices**
- `@media (hover:none)` disables hover transforms.

**Reduced motion**
- `prefers-reduced-motion` kills all animation.

### Pop-ups (GlassModal)
All pop-ups share one shell.

**Overlay**
- `position:fixed; inset:0; display:grid; place-items:center; padding:clamp(12px,4vw,48px)`.
- The pop-up never covers the full screen.

**Scrim**
- A button covering the overlay; clicking it closes the pop-up.
- Background: `linear-gradient(160deg, primary 26%, deep 34–40% 60%, soft2 30%)`.
- `backdrop-filter: blur(12px) saturate(1.3)`.

**Blobs**
- Two blurred circles: accent→primary radial at top-left, `--soft2` at bottom-right.
- `filter: blur(80–90px)`, opacity ~.45–.55, slow `saans-mote` drift.

**Glass cards**
- Dark glass (Care / Privacy / For / How):
  - Background: tinted gradients over `color-mix(deep 74%, transparent)`.
  - `blur(32px) saturate(1.6)`.
  - Border: `on-deep 22%`.
  - Width: `min(100%,900px)`.
  - Max height: `min(100dvh - 24px, 860px)`.
  - Scrolls internally; the close button is sticky.
- Light glass (Coming soon / Breath):
  - Background: tinted gradients over `color-mix(surface 55%, transparent)`.
  - `blur(30px) saturate(1.7)`.
  - Width 480–500px.

**Enter animation (Web Animations API)**
- Scrim: opacity 0→1 over 650ms.
- Blobs: scale .6→1 with fade over 1400ms, staggered 120ms.
- Card: translateY(28px) scale(.96) blur(8px) → none over 900ms, ease `(.16,1,.3,1)`. On touch screens, drop the blur and use 700ms.
- Children marked `data-ci`: rise 14px over 750ms, staggered 80ms, starting at 220ms.

**Exit animation**
- Card: fade to translateY(18px) scale(.97) blur(6px) over 420ms.
- Scrim and blobs: fade out over 480ms.
- Unmount only after the animation finishes, with a 700ms safety timeout.

**Behaviour**
- Esc closes the pop-up.
- Body scroll is locked while open.
- Focus moves to the first button and returns to the opener on close.

**Which button opens what**
- "Start talking", "Talk", "Try voice", "Start talking, free" → **ComingSoonModal**: "saans is almost ready to listen." Buttons: "Try a 1-minute breath" (closes it and opens Breath) and "Back to saans".
- "Breathe with me" / "Try a 1-minute breath" → **BreathModal**. A conic progress ring and a scaling orb run the cycle. Rounds are configurable (default 6) with a ~6s orb cycle. Buttons: "Breathe again" when done, and "Done".
- "See how it works" (care) → **CareModal**, sections in order:
  1. Header.
  2. Three-steps list beside a booking demo (date chips, time slots, "Share approved notes" toggle, "Request Wed, 4:00 pm").
  3. The "Find a professional" demo panel.
  4. "Who you can talk to": a 2×2 grid of icon tiles with tags.
  5. Chips for "What they can help with".
  6. "Your first session": 3 tiles.
  7. "Is it time to reach out?": orb tile beside a checklist. Nothing comes after it.
- "All privacy details" → **PrivacyModal**: header, a privacy-controls demo card, 6 tiles, and a CTA to the care modal.
- "Get Help." (footer) → **HelpModal** (crisis lines).

### Motion on scroll
- `useReveal`: an IntersectionObserver on elements with `data-reveal`. It sets a starting style, then animates in once.
  - `up`: translateY(44px) scale(.97) blur(8px) → none.
  - `scale`: translateY(40px) scale(.92) blur(10px) → none.
  - `line`: headings wipe in from the left.
  - Duration 1050ms (800ms on touch), ease `(.22,1,.36,1)`, delay from `data-reveal-delay`.
- `data-parallax="0.03"`: light scroll-linked translate.
- Hero: the card follows the mouse with perspective tilt (≤6–8°) and the orb drifts.
- Ambient loops are pure CSS: `saans-breathe` (8s), `saans-ring`, `saans-float`, `saans-turn` (40–80s), `saans-marquee-y` (language list, 22s).

### Mobile dock (<1000px)
- Position: fixed, 12px from the sides and from the bottom (+ safe area). Max width 520px, centred.
- Grid: `repeat(4,minmax(0,1fr)) auto`, padding 5px.
- Glass: `surface 72%`, `blur(22px) saturate(1.6)`, pill shape.
- Tabs (52px tall, icon + 10.5px label): What `#how`, For you `#for`, Care `#care`, Privacy `#privacy`. Each smooth-scrolls to its section.
- The active tab has a `--soft1` background and `--text` colour, driven by `useActiveSection`.
- The "Talk →" primary pill opens Coming soon.
- Visibility: slides up once `scrollY > 320`, and hides while the mobile menu is open.

### State (page level)
- `theme`
- `activeSection`
- `menuOpen`
- `dockVisible`
- `modal`: `'coming' | 'breath' | 'care' | 'privacy' | 'help' | 'for' | 'how' | null`
- Breathing: `phase`, `round`, `pct`, `count`
- Viewport width (or CSS-only media queries)
- What it does: auto-advancing feature index is **not used**. The bento grid is static.

### Assets
- **Logo**: inline SVG (two leaf shapes + orange dot), viewBox `50 38 170 186`.
  - Leaf 1: `M50 129V102C50 68 80 53 110 53H170V82C170 114 140 129 112 129Z`, fill `var(--leaf1)`.
  - Leaf 2: `M70 224V197C70 163 100 148 130 148H190V177C190 209 160 224 132 224Z`, fill `var(--leaf2)`.
  - Dot: circle at (204.5, 53.5), r=15, fill `#FF5E00`.
- **Icons**: simple 24×24 stroke icons inline in the reference. Copy the SVG paths, or swap in `lucide-react` equivalents (MessageCircle, Users, HeartPulse, Lock, Mic, Search, Video, Check, X, ArrowRight, ToggleRight).
- **Images**: none. Every visual is CSS/SVG.

### Not in scope / later
- The real chat and voice backend. The prototype has hooks for Gemini/GPT proxies and a realtime voice endpoint; the UI currently shows Coming soon.
- Login was removed. The site opens directly on the landing page.

### QA checklist
- [ ] 390px, 768px, 1024×600, 1366×768, 1920×1080: no horizontal scroll, nothing overlapping
- [ ] Light and dark: all text readable (≥4.5:1 body text)
- [ ] Every pop-up opens and closes with the animation; Esc, scrim click and focus return all work
- [ ] Dock appears only on <1000px and doesn't cover the footer content
- [ ] `prefers-reduced-motion` disables motion
- [ ] Lighthouse: performance ≥90, accessibility ≥95
