---
name: saym-design
description: Apply a clean, light, Apple-inspired design system (near-black primary pills, system-blue selection, hairline borders, translucent chrome, spring motion) to a React + Tailwind v4 frontend. Use when building or restyling dashboards, SaaS apps, or landing pages that should look calm, dense-but-readable, and premium.
---

# Frontend Clean Design

A light, Apple-register design system extracted from the Jobenzy dashboard (React 19 + Tailwind CSS v4 + Motion). It is calm, white-grounded, and low-chroma. Colour is used to carry meaning, not decoration.

## 0. Stack and setup

- React 19, Vite, Tailwind CSS v4 (`@import "tailwindcss"` plus an `@theme { … }` block, no `tailwind.config.js`), and `motion` (`import { motion as m } from 'motion/react'`).
- Install: `npm i react react-dom motion` and `npm i -D tailwindcss @tailwindcss/vite vite @vitejs/plugin-react`.
- Vite plugins: `[react(), tailwindcss()]`.
- Fonts are loaded in the HTML `<head>` (see §3). All tokens live in one `index.css`. All primitives live in one `ui.jsx`.
- **Three-layer tokens: primitive → semantic → component.** Components use the semantic names (`bg-surface`, `text-n-100`, `border-line`), never raw hex.

## 1. Principles (the rules the whole system holds to)

1. **Depth is a hairline, not a shadow.** Static panels get `border border-line`. Shadows are only for things that float (popovers, dragged cards, sheets).
2. **Translucency is chrome only.** Sidebar, sticky header, sheets and floating bars are glass. Content surfaces stay opaque white. Never stack a translucent layer on a translucent layer.
3. **One accent per job.** Near-black = primary action. System blue = selection, links, focus. Never use both for the same job. Anything that is neither gets grey.
4. **Generous radii.** Pills for buttons, chips and segmented controls. 8px for form fields. 12–18px for panels.
5. **Colour carries meaning.** Status colours are for status. Hue chips are for categories. Pastel tints are for chips and cards, not for page backgrounds.
6. **Light by choice.** Set `color-scheme: light`. Don't add an unconsidered dark mode.
7. **Every interactive element defines hover, focus, active and disabled together.**
8. **Contrast is computed, not eyeballed.** Every ink colour clears 4.5:1 against the surface it actually sits on. For chips that surface is the chip's own tint, not white.
9. **Motion is two kinds only.** Springs (JS) for anything the user can interrupt. Short CSS eases for one-step colour and press states.

## 2. Colour tokens

Put these in `@theme {}` in `index.css`. Tailwind v4 turns each `--color-*` variable into utilities (`bg-n-850`, `text-ok-400`, …).

### Neutrals (Apple greys). The scale keeps its role: `n-950` is the page, `n-100` is the strongest text.

| Token | Hex | Use |
|---|---|---|
| `n-950` | `#ffffff` | page, surface, canvas |
| `n-900` | `#fbfbfd` | faint panel (mobile drawer footer) |
| `n-850` | `#f5f5f7` | raised / sunken / hover fill, nav-selected, tags, console bg |
| `n-800` | `#ececed` | meter track, count badges, icon-button hover |
| `n-700` | `#e3e3e6` | disabled button fill, switch-off track |
| `n-600` | `#d2d2d7` | strong border, scrollbar thumb |
| `n-500` | `#707074` | placeholder, micro labels, inactive icons (4.5:1 on white) |
| `n-400` | `#6e6e73` | secondary text, descriptions |
| `n-300` | `#515154` | tertiary-strong text, ghost button text |
| `n-200` | `#2f2f31` | body emphasis, labels |
| `n-100` | `#1d1d1f` | primary text, headings |
| `n-50` | `#000000` | pure black |

### Accent and status inks (darkened to pass 4.5:1 on their own tint)

| Token | Hex | Role |
|---|---|---|
| `brand-500` / `accent` | `#1d1d1f` | primary action (near-black) |
| `brand-400` | `#000000` | primary hover |
| `blue-500` | `#0071e3` | selection, links, focus ring, active meter |
| `blue-400` | `#0077ed` | blue hover |
| `ok-400` | `#197f45` | success |
| `warn-400` | `#a25c00` | warning |
| `bad-400` | `#c9342a` | error / danger |
| `info-400` | `#006bd7` | info |

### Soft tints (chip and note backgrounds)

`ok-tint #e8f6ed` · `warn-tint #fdf3e4` · `bad-tint #fdecea` · `info-tint #e8f2fd` · `accent-tint #f0f0f2`

Card tints, rotated by position (not by meaning): `tint-1 #fdf4e0` · `tint-2 #e7f6ec` · `tint-3 #eeecfb` · `tint-4 #fceceb`.

### Hue palette: 10 tint/ink pairs for categories. Name them by colour, not by what wears them.

| Hue | Tint (bg) | Ink (fg) |
|---|---|---|
| blue | `#ebf2fb` | `#166cce` |
| teal | `#ebfbf9` | `#0e8071` |
| purple | `#f0ebfb` | `#4e16ce` |
| green | `#ebfbf2` | `#0e803d` |
| violet | `#f6ebfb` | `#9716ce` |
| pink | `#fbebf6` | `#c9168e` |
| orange | `#fbf2eb` | `#a95912` |
| red | `#fbebee` | `#ce163b` |
| amber | `#fbf7eb` | `#896b0f` |
| cyan | `#ebf8fb` | `#107892` |

Tokens: `--color-hue-<name>` and `--color-hue-<name>-fg`. Usage: `bg-hue-blue text-hue-blue-fg`. A new hue must have its ink walked down in lightness until it clears 4.5:1 against its own tint before it ships.

### Semantic aliases

```css
--color-canvas: var(--color-n-950);
--color-surface: var(--color-n-950);
--color-raised: var(--color-n-850);   /* nested blocks */
--color-sunken: var(--color-n-850);   /* wells */
--color-line: #e5e5e7;                /* hairline */
--color-line-strong: var(--color-n-600); /* input borders, secondary button border */
--color-fg: var(--color-n-100);
--color-accent: var(--color-brand-500);
```

### Semantic use cheatsheet

- Page text `text-n-100`. Secondary `text-n-400`. Hints, placeholders and micro labels `text-n-500`.
- Panels `bg-surface border border-line`. Nested block `bg-raised`. Hover row `hover:bg-n-850/70`.
- Selection, links, focus: `blue-500`. Never use blue for a primary button.
- Meter and score bands: `≥85 ok`, `≥60–70 blue`, `≥35–55 warn`, else `bad`.
- Dark statement sections (landing page only): bg `#0a0a0a`, text `#f5f5f7`, secondary `#a1a1a6`, eyebrow `#6db3ff`, 1px cell dividers `rgba(255,255,255,0.08)`.

## 3. Typography

### Families

```css
--font-sans: "Century Gothic", "CenturyGothic", "AppleGothic", "Trebuchet MS",
             ui-sans-serif, system-ui, sans-serif;
--font-mono: "Geist Mono", "SF Mono", ui-monospace, "Cascadia Mono",
             "Segoe UI Mono", Menlo, Consolas, monospace;
```

- Century Gothic is a system font (no webfont load). Geist Mono is loaded from Google Fonts: `https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap` (with `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`).
- If the target project can't rely on Century Gothic being installed, swap in a geometric sans (Satoshi from Fontshare `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`, or Inter) as the first family. The metrics and tracking below hold either way.
- Mono is for code, logs, scores, URLs and numeric badges.

### Body defaults

```css
body {
  font-family: var(--font-sans);
  font-size: 0.875rem;          /* 14px app / 17px on marketing pages */
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-optical-sizing: auto;
}
```

### App type scale (rem; each step has its own tracking and leading)

Large sizes get **negative** tracking. Small sizes get a touch of **positive** tracking. Leading is tight on headings, looser on body.

| Token | Size | Line-height | Tracking | Typical use |
|---|---|---|---|---|
| `micro` | 11px | 1.45 | +0.01em | uppercase labels, chips, table headers, counts |
| `tiny` | 12px | 1.5 | +0.004em | descriptions, hints, table cells, small buttons |
| `sm` | 13px | 1.54 | 0 | buttons, inputs, nav items, section titles |
| `base` | 14px | 1.5 | −0.003em | body, page descriptions |
| `lg` | 16px | 1.5 | −0.008em | metric values, sheet titles |
| `xl` | 21px | 1.33 | −0.016em | |
| `2xl` | 28px | 1.21 | −0.021em | page `<h1>`, big numbers |
| `3xl` | 40px | 1.1 | −0.025em | |

Define as `--text-<name>`, `--text-<name>--line-height`, `--text-<name>--letter-spacing` inside `@theme`.

### Weights and patterns

- Page title: `text-2xl font-semibold text-n-100`.
- Section title: `text-sm font-semibold tracking-tight text-n-100`.
- Section or page description: `text-tiny leading-relaxed text-n-400` (section) or `text-base leading-relaxed text-n-400` (page).
- **Label / eyebrow:** `text-micro font-medium tracking-wide uppercase text-n-400/500`.
- Numbers that change: always `tabular-nums`.
- Buttons are `font-medium` (primary, danger) or normal weight (secondary, ghost). Emphasised list items are `font-medium` or `font-semibold`.
- Truncate with `truncate` or `line-clamp-2`.

### Marketing / landing type (plain CSS, `clamp()` fluid)

| Class | Size | Weight | Leading | Tracking |
|---|---|---|---|---|
| `.display` | `clamp(2.7rem, 7.4vw, 5.2rem)` | 900 | 1.0 | −0.04em |
| `.headline` | `clamp(1.9rem, 4.4vw, 3.2rem)` | 900 | 1.05 | −0.03em |
| `.kicker` | `clamp(1.15rem, 2vw, 1.42rem)` | 500 | 1.34 | −0.012em |
| `.lead` | `clamp(1.05rem, 1.6vw, 1.26rem)` | 500 | 1.5 | −0.01em |
| `.eyebrow` | 13px | 600 | – | +0.05em, uppercase, colour `#0071e3` |

Landing body is 17px. Card headings are 19–20px / 700 / −0.02em. Price figures are 40px / 900 / −0.04em. Landing text colours: ink `#1d1d1f`, soft `#515154`, mute `#86868b`.

### Vibrancy: text over blurred surfaces

Grey text over glass loses footing. Use more contrast, not more opacity:

```css
.vibrant           { color: var(--color-n-100); font-weight: 500; letter-spacing: 0.006em; }
.vibrant-secondary { color: var(--color-n-300); font-weight: 450; letter-spacing: 0.008em; }
```

Apply them to titles and descriptions inside sheets, side panels and the sticky header.

## 4. Shape, spacing and elevation

### Radius tokens

`xs 6px` (focus ring, small icon buttons) · `sm 8px` (inputs, notes, nav items, kanban cards) · `md 12px` (small panels, columns, banners) · `lg 18px` (sections, sheets, main cards) · `full` (buttons, chips, segmented, switch, selection bar). Landing: cards 16–22px, buttons `980px`.

### Shadows (two only)

```css
--shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.03);  /* tiny lift: kanban card, segmented thumb */
--shadow-pop:  0 4px 16px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.04); /* floating: dragged card, thick material */
```

Switch knob: `shadow-[0_1px_2px_rgba(0,0,0,0.2)]`. Landing glass: `0 12px 36px -14px rgba(0,0,0,.14)`.

### Layout

- Shell: `flex min-h-full` = sticky glass sidebar + `flex-1 min-w-0` content.
- Content container: `mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10`.
- Page stack: `space-y-4`. Page head has `pb-6`. Section padding is `p-5` body, `px-5 py-4` header.
- Sidebar: width **224px** expanded and **68px** collapsed (spring-animated), `px-2.5 py-4`, `border-r border-line`, `material`. Collapsible with Ctrl/Cmd+B, state kept in `localStorage`. Mobile (<`md`): a 288px drawer (`w-72 max-w-[85vw]`) over a `bg-black/60 backdrop-blur-xs` scrim.
- Breakpoints are Tailwind defaults: `sm` 640, `md` 768, `lg` 1024.
- Landing: `max-width 1080px`, 24px gutters, sections `padding: clamp(76px, 11vw, 128px) 0`, alternate `#fff` / `#f5f5f7`.
- Z-index ladder: sticky header 30, collapsed page bar 40, sidebar 20, drawer 50, modals 50, landing nav 60.

## 5. Materials (glass)

Use `color-mix` over `n-950` so the glass follows the token.

```css
.material-thin  { background: color-mix(in srgb, var(--color-n-950) 60%, transparent); backdrop-filter: saturate(180%) blur(12px); }
.material       { background: color-mix(in srgb, var(--color-n-950) 72%, transparent); backdrop-filter: saturate(180%) blur(20px); }
.material-thick { background: color-mix(in srgb, var(--color-n-950) 80%, transparent); backdrop-filter: saturate(190%) blur(30px); box-shadow: var(--shadow-pop); }
.material-edge  { border-top: 1px solid rgba(255,255,255,.65); }  /* light catching the top edge */
```

- Bigger surface means more blur: sidebar and header use `material`, sheets and panels use `material-thick`, sticky table headers use `material-thin`.
- **Write only unprefixed `backdrop-filter` in app CSS.** Hand-writing `-webkit-backdrop-filter` makes Lightning CSS emit *only* the prefixed property, which current Chromium ignores, and the glass silently stops rendering. (Plain static HTML with no build step may keep both.)
- Glass needs something behind it. A panel at the top of a page has only white behind it, so use `GlassPanel` (§7), which brings three blurred colour washes of its own.
- **Scroll edge instead of divider:** `.scroll-edge::after` is a 14px gradient from `n-950` at 70% opacity to transparent, positioned `bottom:-14px`. It fades content into floating chrome.
- Accessibility fallbacks, both required:
  - `prefers-reduced-transparency: reduce` makes `.material` and `.material-thick` solid (`n-950`; thick uses `n-850`) with `backdrop-filter: none`.
  - `prefers-contrast: more` makes `--color-line` `#b8b8bd`, `--color-line-strong` `#86868b`, `--color-n-400` `#4a4a4f`, and turns glass solid.

## 6. Global CSS

```css
:root { color-scheme: light; }
html, body, #root { height: 100%; }
body { margin: 0; background: var(--color-canvas); color: var(--color-fg); /* + font rules above */ }

/* One keyboard-only focus treatment for the whole app */
:focus-visible { outline: 2px solid var(--color-blue-500); outline-offset: 2px; border-radius: var(--radius-xs); }
::selection    { background: color-mix(in srgb, var(--color-blue-500) 18%, transparent); }

/* Scrollbar: thin, quiet, out of the way */
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-n-600); border-radius: 999px; border: 3.5px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: var(--color-n-500); background-clip: content-box; }
```

## 7. Components

All live in a single `ui.jsx` (primitives) and `apple.jsx` (floating materials). Copy the class strings exactly.

### Button (pill, 2 sizes, 4 variants)

```js
const BUTTON_VARIANT = {
  primary:   'bg-accent text-n-950 font-medium hover:bg-brand-400 disabled:bg-n-700 disabled:text-n-500',
  secondary: 'bg-surface text-n-100 border border-line-strong hover:bg-n-850 disabled:bg-n-850 disabled:text-n-500 disabled:border-line',
  ghost:     'text-n-300 hover:bg-n-850 hover:text-n-100 disabled:text-n-500 disabled:hover:bg-transparent',
  danger:    'bg-bad-400 text-n-950 font-medium hover:brightness-110 disabled:bg-n-700 disabled:text-n-500',
}
const BUTTON_SIZE = {
  sm: 'h-7 gap-1.5 px-3 text-tiny rounded-full',   // 28px
  md: 'h-9 gap-2 px-4 text-sm rounded-full',       // 36px
}
// base: 'press inline-flex shrink-0 items-center justify-center whitespace-nowrap disabled:cursor-not-allowed'
```

- Default variant is `secondary`. Page-level main action is `primary`. Destructive confirm is `danger`. Low-emphasis (Clear, Cancel) is `ghost`.
- `busy` shows a 14px spinner (`animate-spin`, 24-box SVG, circle `r=9 stroke-width 3 opacity .25` plus an arc with round caps) and disables the button.
- Feedback fires on **pointer-down** (see `usePress`, §9), not on click.
- Landing buttons: `.btn` is pill (`border-radius: 980px`), `padding 10px 21px`, 15px/500, tracking −0.01em. `.btn-primary` is `#1d1d1f`/white and goes `#000` plus `0 8px 22px -8px rgba(0,0,0,.3)` on hover. `.btn-sm` is `7px 16px / 13.5px`. `:active` is `scale(.97)`. The trailing `→` shifts `translateX(3px)` on hover. The **secondary is a text link**: blue `#0071e3`, 15px/500, with a `›` that nudges 3px on hover.

### Form controls

```js
const control =
  'w-full rounded-sm border border-line-strong bg-surface px-3 py-1.5 text-sm text-n-100 ' +
  'transition-[border-color,box-shadow] outline-none placeholder:text-n-500 ' +
  'hover:border-n-500 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/18 ' +
  'disabled:bg-n-850 disabled:text-n-500'
```

- `Input`, `Select` (`h-8 py-0`) and `Textarea` (`resize-y`) all share `control`, so they can't drift. Fields stay **rounded rectangles** (a pill input reads as a button).
- Focus is a 3px blue ring at 18% alpha plus a blue border.
- `Field` wraps a control with a label: `mb-1 block text-micro font-medium tracking-wide text-n-400 uppercase`. A hint sits below as `mt-1 text-tiny leading-relaxed text-n-500`. It auto-wires `htmlFor`/`id` (via `useId`) and `aria-describedby`.
- `Checkbox`: native `size-4 accent-blue-500`, label `text-sm leading-snug text-n-200`, hint `text-tiny text-n-500`, row `gap-2.5`, disabled `opacity-50`.
- `Switch` (iOS): track `h-[22px] w-[38px] rounded-full p-[2px]`, off `bg-n-700`, on **`bg-ok-400`** (green), knob `size-[18px] rounded-full bg-white` that translates `translate-x-4`, `duration-200 ease-out`. **Use a Switch for settings that apply immediately and a Checkbox for settings that need a Save button.**

### Panels

```html
<!-- Section -->
<section class="rounded-lg border border-line bg-surface">
  <header class="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
    <h2 class="text-sm font-semibold tracking-tight text-n-100">Title</h2>
    <p class="mt-0.5 text-tiny leading-relaxed text-n-400">Description</p>
    <!-- actions: flex shrink-0 items-center gap-2 -->
  </header>
  <div class="border-t border-line p-5">…</div>   <!-- `flush` variant: border-t only, no padding, for tables/consoles -->
</section>
```

- `Disclosure` is the same shell with a chevron (`Icon.Chevron`, 14px, rotates 90° on a spring) and a body that animates `height 0→auto` plus opacity. Use it to hide configuration so a screen opens on what you came to do.
- `Metric`: `dt` is the micro uppercase label (`text-n-500`), `dd` is `mt-1 text-lg font-semibold tabular-nums text-n-100`, the hint is `text-tiny text-n-500`.
- `Empty`: `px-4 py-12 text-center`, title `text-sm text-n-300`, copy `text-tiny text-n-500 max-w-sm mx-auto`, optional centred action `mt-4`.
- Nested block inside a panel: `rounded-md border border-line bg-raised p-4`.

### Page head (iOS large-title collapse)

- At the top: `<h1 class="text-2xl font-semibold text-n-100">` plus a `text-base text-n-400` description, with actions right-aligned (`flex flex-wrap items-end justify-between gap-4 pb-6`, description `max-w-2xl`).
- After scrolling past **72px**, the large title is replaced by a compact fixed bar: `material material-edge fixed inset-x-0 top-0 z-40 border-b border-line md:left-56`. Inner `max-w-6xl px-6 py-2.5 lg:px-10`, title `vibrant text-base font-semibold truncate`, actions on the right. It enters and exits with `{opacity:0, y:-8}` on the UI spring.
- Why: a two-line sticky heading let page content show through the word. Floating chrome has to be short enough to be chrome.

### Status chip, tag, note

```js
// Status: tinted pill + 6px dot (colour is never the only cue)
'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-micro font-medium'
STATUS_CHIP = {
  ok: 'bg-ok-tint text-ok-400', warn: 'bg-warn-tint text-warn-400', bad: 'bg-bad-tint text-bad-400',
  info: 'bg-info-tint text-info-400', accent: 'bg-accent-tint text-n-100', neutral: 'bg-n-850 text-n-400',
}
// dot: 'size-1.5 shrink-0 rounded-full bg-current' (+ 'animate-pulse-dot' while live)

// Tag (categorical, never status): 'inline-block rounded-full bg-n-850 px-2 py-0.5 text-micro text-n-400'

// Hue chip (categories / message kinds): 'inline-block rounded-full px-2 py-0.5 text-micro font-medium whitespace-nowrap' + 'bg-hue-X text-hue-X-fg'

// Note (inline banner): 'flex items-start gap-3 rounded-sm border px-3 py-2.5 text-sm'
NOTE_TONE = {
  info: 'border-line bg-info-tint text-n-200',
  warn: 'border-warn-400/25 bg-warn-tint text-n-200',
  bad:  'border-bad-400/25 bg-bad-tint text-n-200',
  ok:   'border-ok-400/25 bg-ok-tint text-n-200',
}
// title: font-medium; body: leading-relaxed (opacity-85 under a title); dismiss X: 'opacity-60 hover:opacity-100'
```

- Hue sets: colour by what it means to the reader (offer = green, rejection = red, interview = blue, reminder = amber), not by taxonomy. Administrative classes stay grey so the important ones stand out.

### Table

- `table-fixed border-collapse text-left text-tiny w-full` inside `max-h-[32rem] overflow-auto`. Fixed layout stops one long string from stealing width.
- `thead`: `material-thin sticky top-0 z-10 backdrop-saturate-150`. `th`: `px-4 py-2.5 text-micro font-medium tracking-wide text-n-500 uppercase`, with a `border-b border-line` row.
- `tr`: `border-b border-line align-top transition-colors last:border-0 hover:bg-n-850/70`. `td`: `px-4 py-3`.

### Meters and scores

- `Meter`: label `text-sm text-n-200`, value `text-tiny tabular-nums text-n-400` with `/ max` in `n-500`, track `mt-1.5 h-1 rounded-full bg-n-800`, fill coloured by band.
- `StageBar`: micro uppercase label plus `%`, big `text-2xl font-semibold tabular-nums` value, `h-1` track with a spring-animated width.
- `ScoreRing`: SVG 42px, stroke 3.5, track `text-n-100/10`, arc coloured by band (`≥75 ok`, `≥55 blue`, `≥40 warn`, else `bad`), round linecap, the dash offset springs in, centred `text-micro font-semibold tabular-nums`.
- `ScoreDisplay`: `text-2xl font-semibold tabular-nums` coloured by band, plus `/ 100` in `text-tiny n-500`.

### Navigation item (sidebar)

- `press relative flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-sm text-sm`.
- Inactive: `text-n-400 hover:text-n-100` with a `text-n-500` icon. Active: `font-medium text-n-100` with a `text-n-100` icon.
- The selected background is a **single shared `m.span layoutId="nav-selected"`** (`absolute inset-0 -z-10 rounded-sm bg-n-850`) that springs between items.
- Group labels: `px-2.5 pb-1.5 text-micro font-medium tracking-wide text-n-500 uppercase`. When collapsed, replace them with `my-1.5 mx-1 border-t border-line/60`.
- Count badge: `rounded-full bg-n-800 px-1.5 py-px text-micro font-medium text-n-400`, capped at `99+`. Collapsed state shows a ping dot (`bg-blue-500` plus `animate-ping`).
- Footer status card: `rounded-md border border-line bg-surface px-3 py-2.5` with a micro label and a `Status` chip.

### Segmented control

`inline-flex items-center gap-0.5 rounded-full bg-n-850 p-0.5`, height `h-8 text-sm` (or `h-7 text-tiny`). Buttons are `press relative h-full rounded-full px-3`. The thumb is a shared `layoutId` span: `absolute inset-0 -z-10 rounded-full bg-surface shadow-card`. Active text is `text-n-100 font-medium`, inactive `text-n-400`. Optional count: `ml-1.5 text-micro tabular-nums opacity-55`. Use it instead of a dropdown for a handful of exclusive views. Use `role=tablist`/`tab` with `aria-selected`.

### Sheet (modal), SidePanel (detail drawer), SelectionBar

- **Sheet:** a fixed `grid place-items-center p-4 sm:p-6` container with a scrim `bg-n-100/25` (fade 0.18s). The panel is `material-thick material-edge max-h-[85vh] max-w-2xl (wide: max-w-4xl) rounded-lg border border-line`. Header `px-5 py-4 border-b border-line/70` with a `vibrant text-lg font-semibold` title and a `vibrant-secondary text-tiny` description. Body `px-5 py-4 overflow-auto`. Footer `px-5 py-3 border-t border-line/70`.
  - **Materialize, don't fade:** enter `{opacity:0, scale:.96, filter:'blur(14px)'}` → `{1, 1, blur(0)}`. Exit `{scale:.97, blur(10px)}`.
  - Esc closes, the scrim click closes, and the body scroll is locked while open (`aria-modal`, `role=dialog`).
- **SidePanel:** same material, `max-w-lg h-full border-l`, anchored right. Enter `{x:40, blur(12px)}` and **exit to the same side**. The header uses `.scroll-edge`. The close button is `rounded-full p-1.5 hover:bg-n-850`.
- **SelectionBar:** a floating pill (`material-thick material-edge rounded-full border border-line py-2 pr-2 pl-4`) fixed bottom-centre `z-40`, enter `{y:24, scale:.97}`. It floats rather than sitting in flow, so the list doesn't shift under the cursor.
- Do not use dark `bg-black/70` modal scrims or `rounded-xl shadow-2xl` modals. That is the legacy style. Use Sheet and SidePanel.

### Other patterns

- **ScanLine:** a live-activity strip, `material material-edge rounded-md border border-line px-4 py-2.5`, a 10px blue dot with an expanding ping, `font-mono text-tiny text-n-300` text that springs vertically as it changes, and an `ok-tint` "N new" pill. It disappears 600ms after the run ends.
- **Console / log box:** inside a flush `Section`. `h-72 overflow-auto bg-n-850 px-4 py-3 font-mono text-micro leading-[1.7] text-n-300`. Lines are coloured by severity only when they need attention (ok / bad / warn); everything else stays `text-n-400`. Auto-scroll sticks to the bottom until the user scrolls up, then a "Jump to latest" bar appears.
- **Kanban:** 5-column grid (`min-w-[52rem] gap-3`). A column is `rounded-md border p-2 border-line bg-raised`. A drop target turns `border-blue-500 bg-accent-tint`. A card is `rounded-sm border border-line bg-surface p-2.5 shadow-card cursor-grab`. A lifted card is a fixed clone, `rotate-[1.5deg] border-blue-500/40 shadow-pop`, tracking the pointer 1:1 at the grab offset, with pointer capture and a 6px slop. Moves are optimistic.
- **GlassPanel:** `relative overflow-hidden rounded-lg border border-line` containing three absolutely positioned blurred circles (`bg-hue-blue`, `bg-hue-violet`, `bg-hue-teal`, `blur-2xl`) under a `material-thin material-edge` layer.
- **Browser mock (landing):** radius 18px, traffic-light dots `11px rgba(0,0,0,.13)`, a mono URL pill, a glass body, a 190px sidebar grid.

### Icons

- Inline SVG, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor"`, **stroke-width 1.6**, round caps and joins, `aria-hidden`. Sizes: `size-3.5` (14px) inside buttons and chips, `size-4` (16px) standalone and in nav, `size-5` for the logo.
- Colour comes from `currentColor`. Inactive nav icons are `text-n-500`. Keep all glyphs in one `Icon` object so the weight stays consistent. No icon library, no emoji as icons.

## 8. Landing-page specifics (plain CSS tokens)

```css
:root {
  --bg:#fff; --bg-tint:#f5f5f7; --ink:#1d1d1f; --ink-soft:#515154; --ink-mute:#86868b;
  --line:rgba(0,0,0,.10); --line-soft:rgba(0,0,0,.06); --accent:#0071e3;
  --glass:rgba(255,255,255,.6); --glass-brd:rgba(255,255,255,.65);
  --glass-shadow:0 12px 36px -14px rgba(0,0,0,.14);
  --maxw:1080px; --ease-out:cubic-bezier(.22,.61,.36,1);
}
```

- **Nav:** sticky, 48px, `rgba(255,255,255,.72)` + `saturate(180%) blur(20px)`. On scroll it gets `box-shadow: 0 1px 0 var(--line-soft)` (a scroll edge, not a border). Links are 14px `ink-soft` → `ink`, gap 26px.
- **Glass card:** `background var(--glass)`, `blur(26px) saturate(180%)`, `1px solid var(--glass-brd)`, `box-shadow: inset 0 1px 0 rgba(255,255,255,.8), var(--glass-shadow)`, radius 20px.
- **Plan / pricing card:** radius 22px, padding `32px 28px`, hover `translateY(-3px)`. Featured has a `1.5px solid rgba(0,113,227,.4)` border and a blue-tinted shadow.
- **Chips and pills:** `980px` radius. Status pill backgrounds are `rgba(0,113,227,.12)` with blue text (ready), and `rgba(0,0,0,.06)` with `ink-soft` text (neutral).
- **Check ticks:** 18–19px circle, `rgba(0,113,227,.1)` bg, blue `✓`.
- **Segmented billing toggle:** `rgba(0,0,0,.05)` track with a 4px inset; the active option is white with `0 2px 8px rgba(0,0,0,.08)`.
- **Hero:** cursor-reactive soft blue and violet "water" blobs (`radial-gradient`, `blur(56px)`, SVG `feTurbulence` plus `feDisplacementMap` filter, 22–28s float loops), frozen under reduced motion.
- **Reveal-on-scroll:** `.reveal {opacity:0; transform:translateY(22px) scale(.99); filter:blur(6px)}` → `.in {none}` over 720ms `--ease-out`, staggered with `--d` delays (60ms steps). Toggle `.in` via `IntersectionObserver`. Under reduced motion: opacity only, 320ms.

## 9. Motion system

### Two springs, and only two (`src/lib/motion.js`)

```js
export const SPRING_UI       = { type: 'spring', bounce: 0,   duration: 0.35 } // appear / resolve / reposition. No overshoot.
export const SPRING_MOMENTUM = { type: 'spring', bounce: 0.2, duration: 0.3  } // only for motion the user's gesture started.
export const FADE            = { duration: 0.18, ease: [0.33, 0, 0.67, 1] }    // reduced-motion fallback
export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
export const springFor = (kind = 'ui') => prefersReducedMotion() ? FADE : kind === 'momentum' ? SPRING_MOMENTUM : SPRING_UI
```

- Call `springFor()` at animation time, not at module load.
- Animate **transform and opacity only** (plus a blur `filter` for materialising surfaces) so the compositor does the work.
- Anything the user can interrupt (panels, disclosures, nav highlight, page transitions, drawers) uses a spring. Springs re-target from the live on-screen value. CSS transitions play out first.
- Page transition: `initial {opacity:0, y:6}`, `animate {1, 0}`, `exit {0, y:-4}`, with `AnimatePresence mode="popLayout"`.
- Shared-element highlights use `layoutId` (nav selection, segmented thumb, kanban cards).
- Helpers if you need gestures: `project(velocity, 0.998)` (momentum projection, exponential-decay form) and `rubberband(overshoot, dimension, 0.55)` (progressive resistance past a boundary).

### CSS press feedback (`.press`)

```css
.press { transition: transform 90ms cubic-bezier(.3,0,.2,1), background-color 140ms ease-out,
         border-color 140ms ease-out, color 140ms ease-out, box-shadow 140ms ease-out, opacity 140ms ease-out; }
.press:active, .press[data-pressed='true'] { transform: scale(.97); transition-duration: 40ms; } /* instant down, gentle release */
.press:disabled:active, .press[aria-disabled='true']:active { transform: none; }
```

Other CSS motion: `pulse-dot` (opacity 1→.35→1, 1.6s, infinite). Switch, row hover and link colour changes are 140–200ms eases.

### `usePress` hook

Feedback lands on `pointerdown`; the commit happens on `pointerup`. It uses pointer capture, and a 10px slop with hysteresis (drag away cancels, drag back re-arms). It returns `{ pressed, handlers }`. Spread `handlers`, set `data-pressed={pressed}`, and keep `onClick` only for keyboard activation (`event.detail === 0`) so a pointer interaction never fires twice.

### Reduced motion (a gentler equivalent, never silence)

- `.press:active` drops the scale and uses `opacity: .7` instead. `pulse-dot` slows to 3.2s. `scroll-behavior: auto`.
- Springs become `FADE`. Materialising surfaces become opacity-only. The landing's reveal, hero blobs and parallax stop.

## 10. Do and don't

**Do**
- Use `border border-line` for depth and a single grey step (`bg-raised`) for nesting.
- Use pills for buttons and chips, and 8px rectangles for fields.
- Keep primary near-black and keep blue for selection, links and focus.
- Use uppercase `micro` labels for table headers, field labels and group labels.
- Use `tabular-nums` on every figure.
- Give status a dot plus a tinted fill, never colour alone.
- Keep descriptions short and in `text-n-400`. Keep exactly one `PageHead` per screen.
- Show optimistic UI on direct manipulation, and keep everything keyboard-operable with the single blue focus ring.

**Don't**
- No drop shadows on static panels. No gradients on buttons or text. No coloured primary buttons.
- No bordered badges on every table row (that was the old noise). Use tinted chips or status text.
- No stacked translucent layers. No glass over plain white without colour behind it.
- No dark theme by default and no `dark:` variants. No dark `bg-black/70` modals.
- Don't write `-webkit-backdrop-filter` in Tailwind or Vite-built CSS.
- Don't invent token names. Dead references (`bg-surface-sunken`, `bad-950`, `ok-500`, `bg-amber-500`) in the source don't exist in the theme; use `raised`/`sunken` and `*-400` instead.
- Don't animate layout properties (width, height) with CSS transitions where interruptibility matters. Use a spring.
- Don't add hex colours inline. Add a token first, and verify it passes 4.5:1 on the surface it sits on.

## 11. Adoption checklist

1. Add `@import "tailwindcss";` and the full `@theme { … }` block (colours, radii, shadows, type scale, fonts) to `index.css`, then the global rules (§6), the materials (§5) and the press / reduced-motion rules (§9).
2. Add the font `<link>`s (Geist Mono, plus a webfont fallback if Century Gothic isn't guaranteed).
3. Add `lib/motion.js` and `lib/usePress.js`.
4. Create `ui.jsx` with `PageHead, Section, Disclosure, Metric, Button, Input, Select, Textarea, Field, Checkbox, Switch, Status, Tag, Note, Empty, Meter, Table, Icon`, and `apple.jsx` with `Sheet, SidePanel, Segmented, Chip, GlassPanel, SelectionBar, ScoreRing, StageBar`.
5. Build the shell: a glass collapsible sidebar (224 / 68px) with grouped nav, a mobile drawer, a `max-w-6xl` content area and an animated route transition.
6. Build every screen only from the kit. If a new pattern is needed, add it to the kit first.
7. Verify keyboard focus, reduced-motion, reduced-transparency and high-contrast modes, and check contrast on any new colour pair.
