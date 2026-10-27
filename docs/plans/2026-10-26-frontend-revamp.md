# Frontend revamp plan

**Goal:** replace the default Next.js look (USC cardinal, Geist, rounded cards) with HackSC's own brand, without changing any data, auth or routing.

**Approach:** build the design system first as CSS tokens and a few shared components, then rebuild each page on it. The page logic stays where it is; only markup and classes change. The one exception is the dashboard's time math, which moves to a pure, tested module first so the visual rewrite can't break it.

**Stack:** Next.js 16 (App Router, Cache Components), Tailwind CSS 4 via `@theme inline`, Supabase. No new dependencies.

**Status (2026-10-26):** all tasks done on branch `redesign/hacksc-design-system`. Nothing is committed yet.

---

### Task 1: Brand research ✅

Collect HackSC's real palette, type, logo and voice from past repos and live sites. Output: a brand report (kept outside the repo) and the logo SVGs.

### Task 2: Extract dashboard time logic ✅

**Files:** create `src/lib/schedule.ts` and `src/lib/schedule.test.mjs`.

- Move "what's live, what's next, next food, countdown parts, relative time" into pure functions with no runtime imports.
- Test: `node --test src/lib/schedule.test.mjs` (5 tests).

### Task 3: Design tokens ✅

**Files:** rewrite `src/app/globals.css`.

- Primitives, then semantic roles (light and dark), then the Tailwind `@theme inline` mapping.
- Components: `.wrap`, `.btn`, `.btn-quiet`, `.link`, `.field-label`, `.input`, `.choice`, `.tag`, `.skeleton`, `.display`.
- Motion: `.rise`, `.digit-in`, with reduced-motion fallbacks.
- Check: every text and background pair passes WCAG AA.

### Task 4: Brand components ✅

**Files:** create `src/components/brand.tsx`, `nav-link.tsx`, `site-footer.tsx` and `src/lib/credits.ts`.

- Logo and mark converted from the brand SVGs, wordmark on `currentColor`.
- `NavLink` wraps `usePathname()` in Suspense, which Cache Components requires.

### Task 5: Layout ✅

**Files:** `src/app/layout.tsx`.

- Hanken Grotesk via `next/font`, skip link, sticky header (mark only on phones), footer.

### Task 6: Pages ✅

**Files:** `src/app/page.tsx`, `dashboard.tsx`, `login/*`, `people/*`, `profile/*`.

- **Live (dashboard):** hibiscus countdown field, "Up next" and "Next food", full schedule by day with kind tags and a "Live" row.
- **Sign in:** big title, form, Tommy Trojan photo; the "sent" state is announced to screen readers.
- **People:** title, gold "no profile yet" banner, filter bar on a surface, profile cards; signed-out state shows the Doheny postcard.
- **Person:** name and status on the left, details as a `<dl>` on the right.
- **Profile:** sections as fieldsets with visible legends; every input has a `<label for>`; errors are linked with `aria-describedby`.

### Task 7: Verify ✅

- `npx tsc --noEmit`, `npx eslint`, `node --test src/lib/schedule.test.mjs`, `npx next build`: all pass.
- Browser at desktop and 375px, light and dark: no horizontal scroll; create-profile, people list, person page and magic-link sign-in checked with a local test account.
- Contrast: every text and background pair computed; the lowest is 5.3:1 (AA needs 4.5).
- taste-skill inspector on `/`, `/login` and `/people`: findings reviewed and left as they are, because its rules target marketing pages. "Too few pictures" and "no video" don't fit a live schedule; the cream is HackSC's own `#FEF7E5`; "08" is the countdown, not decorative numbering; the "covered headline" is the sticky header passing over it on scroll; the 14px text is captions and image credits, while body copy is 16–28px.

---

## Not done / next

- **Commit and PR.** Waiting on the team. Also leave out the `supabase/config.toml` port change (a local-only workaround).
- **Dev-only warning:** on signed-in pages, Next's dev overlay reports that Supabase's `getClaims()` reads `Date.now()` during prerendering. It comes from `getCurrentUser`, which the redesign didn't touch, and the build passes. A fix is `await connection()` at the top of `getCurrentUser` in `src/lib/auth.ts`, which the team should decide on.
- **Optional:** the "h✿cksc" wordmark and the HackSC Guy mascot (used on the hacker dashboard since 2024) could replace the 2025 lockup if the team prefers the app-side mark.
