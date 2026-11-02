# HackSC Fall '26 design system

The hacker site's look, in one file. Tokens live in [`src/app/globals.css`](../src/app/globals.css); this doc explains them.

## Where the brand comes from

Everything here is HackSC's own, not invented for this site:

- **The hibiscus.** A faceted red hibiscus with a yellow stamen has been the mark every year since 2020. Since 2023 it has a blue extruded side. The logo components in [`src/components/brand.tsx`](../src/components/brand.tsx) are converted directly from the 2024 mark and the 2025 horizontal lockup SVGs. Don't redraw or recolor them.
- **Colors** come from the 2024 HackSC UI kit, the same values hacksc.com renders today.
- **Type** is Hanken Grotesk, the open-source successor to HK Grotesk. HackSC already uses it on the hacker dashboard, the login page and the SoCal Tech Week site. (The marketing site uses Adobe fonts, filson-pro and neue-haas-unica, which need HackSC's Adobe license.)
- **Voice** is sunny, LA-proud and lightly jokey. Plain words, short sentences, a 🌺 where HackSC would sign off.

## Principles

1. **One big brand field per page.** The dashboard's countdown sits on a full-width hibiscus-red block. Everything else sits on cream (or night navy in dark mode).
2. **Flat blocks, square corners.** The 2024 graphics are flat shapes, so nothing is rounded and nothing has a drop shadow. Surfaces are told apart by one tone step, not by borders. Form fields are the only place with lines.
3. **Type does the work.** Five sizes, big and tight at the top: `text-monument` (countdown), `text-title` (page titles, event names), `text-lead` (intros, section labels), base 16px, and `text-sm` (captions). Nothing readable goes below 14px.
4. **Color never carries meaning alone.** Every tag has a text label.
5. **Motion is quick and earned.** Entrances run once (`.rise`, 700ms, staggered with `--i`). Countdown digits drop in only when they change. Buttons press to 0.97. All of it turns into a plain fade or nothing under `prefers-reduced-motion`.

## Tokens

Three layers. Pages use only the semantic roles.

**Primitives** (`--hsc-*`): raw brand values.

| Token | Value | Use |
|---|---|---|
| `--hsc-hibiscus` | `#FF514F` | The flower; the brand field |
| `--hsc-hibiscus-deep` | `#CE0C09` | Red text on cream (errors) |
| `--hsc-cobalt` | `#0043EC` | The flower's shadow side; actions and links |
| `--hsc-periwinkle` | `#94B0F8` | Actions in dark mode, workshop tags |
| `--hsc-gold` | `#FFD13C` | Stamen; food tags, "live", text selection |
| `--hsc-pink` | `#FFACAB` | "Looking for a team" |
| `--hsc-cream` / `--hsc-sand` | `#FEF7E5` / `#FFE4B9` | Page ground and raised surfaces |
| `--hsc-night*` | `#0A0F24` → `#1C2547` | Dark-mode ground and surfaces |

**Semantic roles** (map to Tailwind as `bg-ground`, `text-muted`, `bg-action` and so on):

| Role | Light | Dark | Notes |
|---|---|---|---|
| `ground` | cream | night | Page background |
| `surface`, `surface-2` | one and two steps up | night-2, night-3 | Panels, quiet buttons, skeletons |
| `ink`, `muted` | `#1A1A1A`, `#5C5650` | `#F4EFE4`, `#A9B0C6` | Muted passes 4.5:1 on its ground |
| `field`, `on-field` | hibiscus, ink | same | White on hibiscus fails contrast, so text on it is ink (5.4:1) |
| `action`, `on-action` | cobalt, white | periwinkle, night | Primary buttons, selected chips |
| `link`, `focus` | cobalt | periwinkle | Focus is a 3px outline |
| `danger` | hibiscus-deep | hibiscus-soft | Errors |
| `tag-*` | event, workshop, food, deadline, looking, team | | Always paired with `on-tag` ink |

## Components

All in `globals.css` under `@layer components`:

- `.wrap`: page width (90rem) with a 16px gutter on phones and 32px from 640px up.
- `.btn` (primary) and `.btn-quiet` (secondary): 44px minimum height for touch.
- `.link`: underlined, 2px.
- `.field-label` and `.input`: every input has a real `<label for>`; chip groups are a `<fieldset>` with a `<legend>`.
- `.choice`: a radio or checkbox drawn as a chip (the input is `peer sr-only` before it).
- `.tag`: square flag for event kinds and team status.
- `.skeleton`: static loading block (no looping pulse).
- `.display`: bold, tight-tracked display type.

React components:

- `HackscLogo` and `HibiscusMark` in `src/components/brand.tsx`. The wordmark follows `currentColor`, so it works in both themes. Phones show the mark alone in the header.
- `NavLink`: marks the current page with a hibiscus underline and `aria-current`.
- `SiteFooter`: contact line, links, large logo and image credits.

## Images

Every picture is credited in the footer from [`src/lib/credits.ts`](../src/lib/credits.ts). Add new ones there when you add them.

**Found pictures** (public domain or CC0):

- A 1855 hand-colored China-Rose (hibiscus) plate, in the footer.
- Tommy Trojan, on the sign-in page.

**Generated with Higgsfield** (in `public/images/`, backgrounds made transparent so they work on cream and night navy):

- `hibiscus-3d.webp`: low-poly hibiscus render, floating on the right of the Live countdown (desktop only).
- `sticker-*.webp`: flat stickers in the palette. Laptop for events and workshops, taco for meals, boba for treats, trophy for deadlines; shown beside "Up next" and "Next food". The palm tree marks empty states.
- `campus-diorama.webp`: isometric campus courtyard, in the People page header.
- `src/app/opengraph-image.jpg`: the link preview for Slack, iMessage and social posts.

New generated art should keep to the palette hex values in its prompt and sit on a plain background so it can be cut out. Art in the same cream as the page (like the boba cup) needs a periwinkle sticker outline, or it disappears in light mode. The prompts and the cutout/outline scripts are in `higgsfield-asset-prompts.md` and `higgsfield-tools/`, next to the repo.

## Adding a page

Wrap it in `<div className="wrap pt-10 sm:pt-16">`, open with an `h1` using `display text-title`, then an intro in `text-lead text-muted`. Use semantic color classes only; if you need a new color, add a semantic role first.
