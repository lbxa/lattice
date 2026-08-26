# Desktop Emulator Landing Page — Design

Date: 2026-08-25
Status: Approved

## Purpose

A portfolio landing page that presents itself as a retro Mac-inspired desktop:
an animated blue sky wallpaper, a menu bar, desktop folder icons for portfolio
projects, and a lightweight window compositor. Clicking an icon opens a
draggable, closable, resizable window whose content is an ordinary React
component. The look is *inspired by* classic Mac OS — its own dialect, not a
pixel-for-pixel clone.

Success criteria:

- Feels like a real desktop: drags at 60fps, correct focus/z-order, windows
  never escape reach.
- Loads very fast: statically prerendered, zero third-party requests, zero
  images on first paint, LCP < 1.0s under Fast 3G / 4x CPU throttle, CLS 0.
- Visually consistent: every piece of chrome consumes the same theme tokens.
- Content is swappable: placeholder projects live in one typed file.

## Decisions (from brainstorming)

| Topic | Decision |
| --- | --- |
| Content | Placeholder projects (5), structured for later fill-in |
| Routing | Pure client state, single route, no URL sync |
| Compositor | Drag, close, focus, resize, collapse (window shade), working menu bar; no boot screen |
| Mobile | Same desktop; windows full-screen below 640px; gestures off below that breakpoint |
| Sky | Smooth drifting CSS sky + faint static dither overlay (hybrid) |
| First load | Welcome window auto-opens centered |
| Fonts | Pixel font (Pixelify Sans via next/font) for chrome; Geist Sans for body |
| Approach | Pure React + CSS, zero new runtime dependencies |
| Icon activation | Single click opens (with brief selected flash) |

## Architecture

```
app/
  layout.tsx            — fonts (Geist + Pixelify Sans via next/font), metadata
  page.tsx              — static server component rendering <Desktop />
  globals.css           — all retro theme tokens in the Tailwind v4 @theme block
components/
  desktop/
    Desktop.tsx         — client root: reducer state, Sky + MenuBar + icons + windows
    desktopReducer.ts   — pure reducer + pure geometry helpers (no DOM)
    useWindowGestures.ts— pointer-event drag/resize hook (ref-based)
    types.ts            — WindowState, DesktopState, actions
  chrome/               — retro UI kit: WindowFrame, TitleBar, MenuBar, Menu,
                          MenuItem, RetroButton, DesktopIcon, Scrollable
  sky/
    Sky.tsx             — self-contained animated background (swap point for a
                          future WebGL shader version)
  windows/
    WelcomeWindow.tsx, ProjectWindow.tsx, AboutWindow.tsx
content/
  projects.ts           — typed placeholder project data
  site.ts               — welcome/about copy, site mark
```

`@/*` resolves to the repo root (no `src/`). `page.tsx` statically prerenders,
so first paint (sky + welcome window + icons) is HTML/CSS before JS arrives;
hydration only enables interaction. No data fetching.

## Window compositor

State — one `useReducer` in `Desktop.tsx`:

```ts
type WindowState = {
  id: string                     // "welcome" | "about" | "project:<id>"
  kind: "welcome" | "about" | "project"
  rect: { x: number; y: number; w: number; h: number }
  collapsed: boolean
}
type DesktopState = {
  windows: Record<string, WindowState>
  order: string[]                // last = topmost = focused
}
```

Actions:

- `OPEN` — focuses the existing window if already open; otherwise spawns with a
  cascade offset from center (24px steps), clamped to viewport.
- `CLOSE`, `CLOSE_ALL`
- `FOCUS` — moves id to end of `order`; z-index derives from order position.
- `SET_RECT` — committed once per gesture, clamped (title bar must always
  remain reachable; global min size (240×120)).
- `TOGGLE_COLLAPSE` — window-shade: only the title bar renders.
- `CLEAN_UP` — re-cascades all open windows.

Gestures (`useWindowGestures`): on `pointerdown` in a title bar, capture the
pointer; during `pointermove`, write `transform: translate3d(...)` directly to
the window DOM node via ref — zero React renders per frame; on `pointerup`,
dispatch `SET_RECT` once. Resize works identically from a bottom-right grip.
Double-click on the title bar toggles collapse. `pointerdown` anywhere in a
window dispatches `FOCUS`. Gestures are not attached below the 640px breakpoint (where windows are full-screen); pointer events cover touch-dragging on larger touchscreens.

Resilience: each window's content renders inside a small error boundary so a
broken window component cannot take down the desktop; rects re-clamp on
browser resize.

## UI kit & theming

Design language:

- Chrome surface: warm paper-gray (≈ #e8e5de), 1px near-black outer border,
  bevels via stacked box-shadows (light top-left inset, dark bottom-right
  inset). 2px radius on windows, square buttons.
- Title bar: CSS pinstripe gradient rendered only on the focused window;
  unfocused windows flatten and dim. Close box left, collapse widget right,
  both with pressed states.
- All tokens live in the `@theme` block in `globals.css`: palette
  (`--color-chrome`, `--color-chrome-ink`, `--color-bevel-light`,
  `--color-bevel-dark`, `--color-select`), shadow recipes, pinstripe gradient,
  font stacks. Chrome components consume only tokens.
- Fonts: Pixelify Sans (next/font/google, self-hosted at build) for title
  bars, menus, buttons, icon labels; Geist Sans for body text.
- Icons: inline SVG pixel art (folder, doc, site mark), `shape-rendering:
  crispEdges`, no image files.

Components: `WindowFrame`, `TitleBar`, `MenuBar`, `Menu`/`MenuItem`
(click-to-open, Esc/outside-click closes), `RetroButton`, `DesktopIcon`
(single-click opens after a brief selected flash), `Scrollable` (retro
scrollbar styling with graceful fallback).

Menu bar (functional): site-mark menu → About this site; File → Close Window /
Close All (disabled when nothing is open); View → Clean Up Windows; right side
live clock (updates per minute, rendered post-hydration to avoid SSR
mismatch).

## Sky

`<Sky />`, fixed full-viewport, three layers, all CSS:

1. Base vertical gradient, deep blue → pale horizon.
2. Two cloud layers: 200%-wide divs tiling pixel-art cloud sprites (inline
   SVG data URIs, blocky slab-stacked shapes on a 160×90 grid, crispEdges),
   looping `translateX(0 → -50%)` at ~80s and ~140s for clearly visible
   parallax drift. Transform-only → GPU-composited.
3. Dither overlay: ~150-byte base64 Bayer tile, repeated, ~6% opacity,
   `mix-blend-mode: overlay`, static.

Honors `prefers-reduced-motion` (drift pauses). The component is the swap
point for a future shader sky.

## Content model

```ts
type Project = {
  id: string
  title: string
  tagline: string
  year?: string
  paragraphs: string[]
  links: { label: string; href: string }[]
  images: { src: string; alt: string }[]   // public/projects/…, lazy-loaded
  windowSize?: { w: number; h: number }
}
```

Five placeholders with distinct names/blurbs. `ProjectWindow` renders every
project through one layout: title header → optional image → paragraphs →
links as `RetroButton`s. Welcome/About copy lives in `content/site.ts`.

## Mobile (< 640px)

- Icons in a top-aligned grid with larger tap targets; menu bar shrinks to
  site mark + clock.
- Windows render full-screen (`fixed`, below menu bar), stacked by the same
  z-order; the File and View menus are hidden below 640px (mark menu + clock
  remain), so windows close via the title-bar close box.
- Welcome window still auto-opens.

## Performance budget

- Network: HTML + CSS + JS chunks + 2 self-hosted font files. No third-party
  requests; no images on first load.
- LCP < 1.0s (Fast 3G, 4x CPU throttle); CLS 0; 60fps drags under 4x CPU
  throttle. Verified via Lighthouse/devtools during the dev loop.
- App JS ~15KB beyond framework; zero added runtime dependencies.

## Testing

- `bun test` (built-in runner, no new deps) for pure logic: reducer
  transitions (open-focuses-existing, close, z-order, collapse), clamping,
  cascade math. Add a `test` script to package.json and document it in
  CLAUDE.md.
- Gestures and visuals verified against the running dev server (browser
  screenshots), not unit tests.
- `bun run verify` (lint + typecheck) must stay green.

## Out of scope (v1)

Boot screen, URL-addressable windows, window persistence, Trash/easter eggs,
WebGL sky, real project content, minimize-to-dock (no dock exists).
