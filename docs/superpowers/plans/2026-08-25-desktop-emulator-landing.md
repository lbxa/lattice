# Desktop Emulator Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A retro Mac-inspired desktop landing page: animated sky, menu bar, portfolio folder icons, and a window compositor (drag/close/focus/resize/collapse), per `docs/superpowers/specs/2026-08-25-desktop-emulator-landing-design.md`.

**Architecture:** Statically prerendered Next.js page whose only content is a client `<Desktop />` component. All compositor rules live in a pure reducer (`bun test`-able, no DOM); drag/resize write `transform` straight to DOM nodes via refs during gestures and commit once on release. All chrome consumes theme tokens declared in the Tailwind v4 `@theme` block.

**Tech Stack:** Next.js 16 (app router), React 19, Tailwind v4 (CSS-config), Bun. Zero new runtime dependencies; the only new devDependency is `@types/bun`.

## Global Constraints

- Package manager is **bun**; run everything as `bun run <script>` / `bun test`.
- Zero new runtime dependencies. Only allowed new devDependency: `@types/bun`.
- No `src/` directory; `@/*` resolves to the repo root.
- Fonts only via `next/font` (build-time self-hosted); no runtime font/image/third-party requests on first paint.
- All theme tokens live in the `@theme` block of `app/globals.css`; there is no `tailwind.config.*`.
- Route props are global types (`LayoutProps<"/">`); never import them. `params`/`searchParams` are Promises (not used here).
- The page must remain statically prerenderable (no dynamic APIs in server components).
- Mobile breakpoint: `< 640px` (Tailwind `sm`). Below it: windows full-screen, gestures not attached.
- Geometry constants (single source in `components/desktop/geometry.ts`): `MENU_BAR_H=28`, `TITLE_BAR_H=24`, `MIN_W=240`, `MIN_H=120`, `CASCADE_STEP=24`, `EDGE_KEEP=48`.
- `bun run verify` (lint + typecheck) must pass at the end of every task; it is the repo Stop hook.
- Commit at the end of every task with the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.

---

### Task 1: Theme foundation (tokens + fonts)

**Files:**
- Modify: `app/globals.css` (replace entirely)
- Modify: `app/layout.tsx` (replace entirely)

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind color utilities `bg-chrome`, `bg-chrome-dark`, `text-chrome-ink`, `text-chrome-dim`, `bg-bevel-dark`, `border-outline`, `bg-select`, `outline-select`; custom utilities `bevel-out`, `bevel-in`, `pinstripes`; font utilities `font-pixel`, `font-sans`; CSS variables `--chrome`, `--chrome-dark`, `--chrome-ink`, `--chrome-dim`, `--bevel-light`, `--bevel-dark`, `--outline`, `--select`. Every later task styles chrome ONLY with these.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --chrome: #e8e5de;
  --chrome-dark: #d4d0c8;
  --chrome-ink: #1a1815;
  --chrome-dim: #8a8578;
  --bevel-light: #ffffff;
  --bevel-dark: #a8a49a;
  --outline: #26231e;
  --select: #2f5ec4;
}

@theme inline {
  --color-chrome: var(--chrome);
  --color-chrome-dark: var(--chrome-dark);
  --color-chrome-ink: var(--chrome-ink);
  --color-chrome-dim: var(--chrome-dim);
  --color-bevel-light: var(--bevel-light);
  --color-bevel-dark: var(--bevel-dark);
  --color-outline: var(--outline);
  --color-select: var(--select);
  --font-pixel: var(--font-pixel-chrome), "Courier New", monospace;
  --font-sans: var(--font-geist-sans), Arial, Helvetica, sans-serif;
}

/* Raised chrome (buttons, window frames, menu bar). */
@utility bevel-out {
  box-shadow:
    inset 1px 1px 0 var(--bevel-light),
    inset -1px -1px 0 var(--bevel-dark);
}

/* Sunken chrome (pressed buttons, wells). */
@utility bevel-in {
  box-shadow:
    inset 1px 1px 0 var(--bevel-dark),
    inset -1px -1px 0 var(--bevel-light);
}

/* Focused title bar texture. */
@utility pinstripes {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 2px,
    color-mix(in srgb, var(--chrome-ink) 12%, transparent) 2px,
    color-mix(in srgb, var(--chrome-ink) 12%, transparent) 3px
  );
}

body {
  font-family: var(--font-sans);
  background: #cfe4f6;
  color: var(--chrome-ink);
  overflow: hidden; /* the desktop IS the viewport; windows scroll internally */
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const pixelChrome = Pixelify_Sans({
  variable: "--font-pixel-chrome",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lattice — Desktop",
  description:
    "A retro desktop portfolio: open the folders to explore projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${pixelChrome.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify**

Run: `bun run verify && bun run build`
Expected: lint + typecheck + build all pass (the boilerplate `app/page.tsx` still compiles against the new CSS).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: retro theme tokens and chrome/pixel fonts"
```

---

### Task 2: Compositor logic — geometry + reducer (TDD)

**Files:**
- Create: `components/desktop/types.ts`
- Create: `components/desktop/geometry.ts`
- Create: `components/desktop/desktopReducer.ts`
- Test: `components/desktop/desktopReducer.test.ts`
- Modify: `package.json` (add `"test": "bun test"` script)
- Modify: `CLAUDE.md` (document the test script in Commands)

**Interfaces:**
- Consumes: nothing.
- Produces (exact, later tasks depend on these):
  - Types: `WindowKind`, `Rect {x,y,w,h}`, `Size {w,h}`, `Viewport {width,height}`, `Placement` (`{mode:"centered";size:Size} | {mode:"rect";rect:Rect}`), `WindowState {id,kind,projectId?,placement,collapsed}`, `DesktopState {windows:Record<string,WindowState>; order:string[]}`, `DesktopAction`, `DesktopDispatch`.
  - `geometry.ts`: constants above plus `clampRect(rect,vp):Rect`, `cascadeRect(size,vp,index):Rect`, `windowId(kind,projectId?):string`.
  - `desktopReducer.ts`: `initialDesktopState():DesktopState` (welcome window open, centered, 400×320), `desktopReducer(state,action):DesktopState`.

- [ ] **Step 1: Add bun test types and script**

```bash
bun add -d @types/bun
```

In `package.json` scripts add: `"test": "bun test",` (tsconfig has no `types` field, so `@types/bun` is auto-included and `bun:test` imports typecheck).

- [ ] **Step 2: Write `components/desktop/types.ts`**

```ts
import type { Dispatch } from "react";

export type WindowKind = "welcome" | "about" | "project";

export type Rect = { x: number; y: number; w: number; h: number };
export type Size = { w: number; h: number };
export type Viewport = { width: number; height: number };

/**
 * Windows opened before hydration (the welcome window) are CSS-centered so
 * static HTML is correct on every viewport with zero layout shift. The first
 * committed gesture/action converts them to absolute rects.
 */
export type Placement =
  | { mode: "centered"; size: Size }
  | { mode: "rect"; rect: Rect };

export type WindowState = {
  id: string;
  kind: WindowKind;
  projectId?: string;
  placement: Placement;
  collapsed: boolean;
};

export type DesktopState = {
  windows: Record<string, WindowState>;
  order: string[]; // z-order; last entry is topmost and focused
};

export type DesktopAction =
  | { type: "OPEN"; kind: WindowKind; projectId?: string; size: Size; viewport: Viewport }
  | { type: "CLOSE"; id: string }
  | { type: "CLOSE_ALL" }
  | { type: "FOCUS"; id: string }
  | { type: "SET_RECT"; id: string; rect: Rect; viewport: Viewport }
  | { type: "TOGGLE_COLLAPSE"; id: string }
  | { type: "CLEAN_UP"; viewport: Viewport }
  | { type: "CLAMP_ALL"; viewport: Viewport };

export type DesktopDispatch = Dispatch<DesktopAction>;
```

- [ ] **Step 3: Write the failing tests (`components/desktop/desktopReducer.test.ts`)**

```ts
import { describe, expect, test } from "bun:test";
import {
  CASCADE_STEP,
  EDGE_KEEP,
  MENU_BAR_H,
  MIN_H,
  MIN_W,
  TITLE_BAR_H,
  clampRect,
  cascadeRect,
  windowId,
} from "./geometry";
import { desktopReducer, initialDesktopState } from "./desktopReducer";
import type { DesktopState, Rect, Viewport } from "./types";

const vp: Viewport = { width: 1280, height: 800 };

function openProject(state: DesktopState, projectId: string): DesktopState {
  return desktopReducer(state, {
    type: "OPEN",
    kind: "project",
    projectId,
    size: { w: 480, h: 380 },
    viewport: vp,
  });
}

function rectOf(state: DesktopState, id: string): Rect {
  const win = state.windows[id];
  if (win.placement.mode !== "rect") throw new Error(`${id} is not rect-placed`);
  return win.placement.rect;
}

describe("windowId", () => {
  test("projects are namespaced, singletons are bare", () => {
    expect(windowId("project", "aurora")).toBe("project:aurora");
    expect(windowId("welcome")).toBe("welcome");
    expect(windowId("about")).toBe("about");
  });
});

describe("clampRect", () => {
  test("enforces min size", () => {
    const r = clampRect({ x: 100, y: 100, w: 10, h: 10 }, vp);
    expect(r.w).toBe(MIN_W);
    expect(r.h).toBe(MIN_H);
  });

  test("title bar cannot go above the menu bar or below the bottom", () => {
    expect(clampRect({ x: 100, y: -500, w: 400, h: 300 }, vp).y).toBe(MENU_BAR_H);
    expect(clampRect({ x: 100, y: 5000, w: 400, h: 300 }, vp).y).toBe(vp.height - TITLE_BAR_H);
  });

  test("keeps a grabbable sliver horizontally", () => {
    expect(clampRect({ x: -5000, y: 100, w: 400, h: 300 }, vp).x).toBe(EDGE_KEEP - 400);
    expect(clampRect({ x: 5000, y: 100, w: 400, h: 300 }, vp).x).toBe(vp.width - EDGE_KEEP);
  });

  test("caps size to the viewport", () => {
    const r = clampRect({ x: 0, y: 100, w: 9000, h: 9000 }, vp);
    expect(r.w).toBe(vp.width);
    expect(r.h).toBe(vp.height - MENU_BAR_H);
  });
});

describe("cascadeRect", () => {
  test("steps down-right per index", () => {
    const a = cascadeRect({ w: 480, h: 380 }, vp, 0);
    const b = cascadeRect({ w: 480, h: 380 }, vp, 1);
    expect(b.x - a.x).toBe(CASCADE_STEP);
    expect(b.y - a.y).toBe(CASCADE_STEP);
  });
});

describe("desktopReducer", () => {
  test("initial state has the welcome window open, centered, focused", () => {
    const s = initialDesktopState();
    expect(s.order).toEqual(["welcome"]);
    expect(s.windows.welcome.placement).toEqual({
      mode: "centered",
      size: { w: 400, h: 320 },
    });
  });

  test("OPEN adds a rect-placed window on top", () => {
    const s = openProject(initialDesktopState(), "aurora");
    expect(s.order).toEqual(["welcome", "project:aurora"]);
    expect(s.windows["project:aurora"].placement.mode).toBe("rect");
  });

  test("OPEN of an already-open window focuses it instead of duplicating", () => {
    let s = openProject(initialDesktopState(), "aurora");
    s = openProject(s, "meridian");
    s = openProject(s, "aurora");
    expect(s.order).toEqual(["welcome", "project:meridian", "project:aurora"]);
    expect(Object.keys(s.windows)).toHaveLength(3);
  });

  test("FOCUS moves a window to the top; unknown ids are a no-op", () => {
    let s = openProject(initialDesktopState(), "aurora");
    s = desktopReducer(s, { type: "FOCUS", id: "welcome" });
    expect(s.order).toEqual(["project:aurora", "welcome"]);
    expect(desktopReducer(s, { type: "FOCUS", id: "nope" })).toBe(s);
  });

  test("CLOSE removes only the closed window", () => {
    let s = openProject(initialDesktopState(), "aurora");
    s = desktopReducer(s, { type: "CLOSE", id: "welcome" });
    expect(s.order).toEqual(["project:aurora"]);
    expect(s.windows.welcome).toBeUndefined();
  });

  test("CLOSE_ALL empties the desktop", () => {
    const s = desktopReducer(openProject(initialDesktopState(), "aurora"), { type: "CLOSE_ALL" });
    expect(s.order).toEqual([]);
    expect(Object.keys(s.windows)).toHaveLength(0);
  });

  test("SET_RECT clamps the committed rect", () => {
    let s = openProject(initialDesktopState(), "aurora");
    s = desktopReducer(s, {
      type: "SET_RECT",
      id: "project:aurora",
      rect: { x: -9999, y: -9999, w: 480, h: 380 },
      viewport: vp,
    });
    expect(rectOf(s, "project:aurora")).toEqual({ x: EDGE_KEEP - 480, y: MENU_BAR_H, w: 480, h: 380 });
  });

  test("TOGGLE_COLLAPSE flips the shade", () => {
    let s = initialDesktopState();
    s = desktopReducer(s, { type: "TOGGLE_COLLAPSE", id: "welcome" });
    expect(s.windows.welcome.collapsed).toBe(true);
    s = desktopReducer(s, { type: "TOGGLE_COLLAPSE", id: "welcome" });
    expect(s.windows.welcome.collapsed).toBe(false);
  });

  test("CLEAN_UP re-cascades every window (centered ones become rects)", () => {
    let s = openProject(initialDesktopState(), "aurora");
    s = desktopReducer(s, { type: "CLEAN_UP", viewport: vp });
    expect(s.windows.welcome.placement.mode).toBe("rect");
    const welcome = rectOf(s, "welcome");
    const aurora = rectOf(s, "project:aurora");
    expect(aurora.x - welcome.x).toBe(CASCADE_STEP - (480 - 400) / 2);
  });

  test("CLAMP_ALL clamps rect windows and leaves centered ones alone", () => {
    let s = openProject(initialDesktopState(), "aurora");
    const small: Viewport = { width: 500, height: 400 };
    s = desktopReducer(s, { type: "CLAMP_ALL", viewport: small });
    expect(s.windows.welcome.placement.mode).toBe("centered");
    const r = rectOf(s, "project:aurora");
    expect(r.x).toBeLessThanOrEqual(small.width - EDGE_KEEP);
    expect(r.y).toBeGreaterThanOrEqual(MENU_BAR_H);
  });
});
```

Note the CLEAN_UP cascade assertion: windows are centered per their own width, so
for a 400-wide window at index 0 and a 480-wide window at index 1 the x-delta
is `(1280-480)/2 + CASCADE_STEP - (1280-400)/2` = `CASCADE_STEP - 40` = `-16`.
Keep the expectation written as arithmetic (as above) so the intent stays visible.

- [ ] **Step 4: Run tests to verify they fail**

Run: `bun test components/desktop`
Expected: FAIL — cannot resolve `./geometry` / `./desktopReducer`.

- [ ] **Step 5: Write `components/desktop/geometry.ts`**

```ts
import type { Rect, Size, Viewport, WindowKind } from "./types";

export const MENU_BAR_H = 28;
export const TITLE_BAR_H = 24;
export const MIN_W = 240;
export const MIN_H = 120;
export const CASCADE_STEP = 24;
export const EDGE_KEEP = 48;

/** Clamp a window rect so its title bar always stays reachable. */
export function clampRect(rect: Rect, vp: Viewport): Rect {
  const w = Math.min(Math.max(rect.w, MIN_W), vp.width);
  const h = Math.min(Math.max(rect.h, MIN_H), vp.height - MENU_BAR_H);
  const x = Math.min(Math.max(rect.x, EDGE_KEEP - w), vp.width - EDGE_KEEP);
  const y = Math.min(Math.max(rect.y, MENU_BAR_H), vp.height - TITLE_BAR_H);
  return { x, y, w, h };
}

/** Spawn rect for the nth window: horizontally centered, stepped down-right. */
export function cascadeRect(size: Size, vp: Viewport, index: number): Rect {
  const step = (index % 8) * CASCADE_STEP;
  return clampRect(
    {
      x: (vp.width - size.w) / 2 + step,
      y: MENU_BAR_H + Math.max(CASCADE_STEP, (vp.height - MENU_BAR_H - size.h) / 3) + step,
      w: size.w,
      h: size.h,
    },
    vp,
  );
}

export function windowId(kind: WindowKind, projectId?: string): string {
  return kind === "project" ? `project:${projectId}` : kind;
}
```

- [ ] **Step 6: Write `components/desktop/desktopReducer.ts`**

```ts
import { cascadeRect, clampRect, windowId } from "./geometry";
import type { DesktopAction, DesktopState, Size, WindowState } from "./types";

export function initialDesktopState(): DesktopState {
  const welcome: WindowState = {
    id: "welcome",
    kind: "welcome",
    placement: { mode: "centered", size: { w: 400, h: 320 } },
    collapsed: false,
  };
  return { windows: { welcome }, order: ["welcome"] };
}

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case "OPEN": {
      const id = windowId(action.kind, action.projectId);
      if (state.windows[id]) return focusWindow(state, id);
      const win: WindowState = {
        id,
        kind: action.kind,
        projectId: action.projectId,
        placement: {
          mode: "rect",
          rect: cascadeRect(action.size, action.viewport, state.order.length),
        },
        collapsed: false,
      };
      return { windows: { ...state.windows, [id]: win }, order: [...state.order, id] };
    }
    case "CLOSE": {
      if (!state.windows[action.id]) return state;
      const windows = { ...state.windows };
      delete windows[action.id];
      return { windows, order: state.order.filter((id) => id !== action.id) };
    }
    case "CLOSE_ALL":
      return { windows: {}, order: [] };
    case "FOCUS":
      return focusWindow(state, action.id);
    case "SET_RECT": {
      const win = state.windows[action.id];
      if (!win) return state;
      return updateWindow(state, {
        ...win,
        placement: { mode: "rect", rect: clampRect(action.rect, action.viewport) },
      });
    }
    case "TOGGLE_COLLAPSE": {
      const win = state.windows[action.id];
      if (!win) return state;
      return updateWindow(state, { ...win, collapsed: !win.collapsed });
    }
    case "CLEAN_UP": {
      let next = state;
      state.order.forEach((id, index) => {
        const win = next.windows[id];
        next = updateWindow(next, {
          ...win,
          placement: { mode: "rect", rect: cascadeRect(sizeOf(win), action.viewport, index) },
        });
      });
      return next;
    }
    case "CLAMP_ALL": {
      let next = state;
      for (const id of state.order) {
        const win = next.windows[id];
        if (win.placement.mode !== "rect") continue;
        next = updateWindow(next, {
          ...win,
          placement: { mode: "rect", rect: clampRect(win.placement.rect, action.viewport) },
        });
      }
      return next;
    }
  }
}

function focusWindow(state: DesktopState, id: string): DesktopState {
  if (!state.windows[id] || state.order[state.order.length - 1] === id) return state;
  return { ...state, order: [...state.order.filter((w) => w !== id), id] };
}

function updateWindow(state: DesktopState, win: WindowState): DesktopState {
  return { ...state, windows: { ...state.windows, [win.id]: win } };
}

function sizeOf(win: WindowState): Size {
  return win.placement.mode === "centered"
    ? win.placement.size
    : { w: win.placement.rect.w, h: win.placement.rect.h };
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `bun test components/desktop`
Expected: all tests PASS. If the CLEAN_UP delta assertion fails, re-derive the arithmetic from `cascadeRect` rather than fudging the constant.

- [ ] **Step 8: Document the test script**

In `CLAUDE.md`'s Commands block, after the `verify:full` line, add:

```
bun run test        # bun's built-in runner; covers the pure compositor logic
```

And replace the "No test framework is configured." sentence with: "Tests use Bun's built-in runner (`bun test`); pure logic only — UI is verified in the browser."

- [ ] **Step 9: Verify and commit**

Run: `bun run verify`
Expected: PASS.

```bash
git add components/desktop package.json bun.lock CLAUDE.md
git commit -m "feat: window compositor state — geometry helpers and reducer (TDD)"
```

---

### Task 3: Sky background

**Files:**
- Create: `components/sky/Sky.tsx`
- Modify: `app/globals.css` (append the sky section)
- Modify: `app/page.tsx` (replace boilerplate with a Sky-only page for visual verification; Task 7 replaces it again)
- Create: `.claude/launch.json` (dev-server preview config, used by every later browser check)

**Interfaces:**
- Consumes: nothing.
- Produces: `Sky` (server-safe component, no props). Task 7 renders it inside `Desktop`.

- [ ] **Step 1: Write `components/sky/Sky.tsx`**

```tsx
export function Sky() {
  return (
    <div aria-hidden className="sky-base fixed inset-0 overflow-hidden">
      <div className="sky-clouds sky-clouds-far" />
      <div className="sky-clouds sky-clouds-near" />
      <div className="sky-dither absolute inset-0" />
    </div>
  );
}
```

- [ ] **Step 2: Append the sky section to `app/globals.css`**

Seamlessness rule: each cloud layer is a 200%-wide element whose background
tiles at `background-size: 50% 100%` and animates `translateX(0 → -50%)` —
exactly one tile — so the loop is invisible. Every radial-gradient blob must
stay fully inside its tile: center% ± (width% × 0.7) must remain within
[0%, 100%] (the `transparent 70%` stop bounds the blob's real extent).

```css
/* --- Sky ---------------------------------------------------------------- */

.sky-base {
  background: linear-gradient(
    to bottom,
    #2557b8 0%,
    #3f7ad2 30%,
    #7db2e8 65%,
    #cfe4f6 100%
  );
}

.sky-clouds {
  position: absolute;
  inset: 0 auto 0 0;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
  animation: sky-drift linear infinite;
}

.sky-clouds-far {
  opacity: 0.5;
  animation-duration: 300s;
  background-image:
    radial-gradient(ellipse 20% 9% at 15% 24%, rgba(255, 255, 255, 0.9), transparent 70%),
    radial-gradient(ellipse 16% 7% at 38% 14%, rgba(255, 255, 255, 0.7), transparent 70%),
    radial-gradient(ellipse 24% 8% at 64% 30%, rgba(255, 255, 255, 0.8), transparent 70%),
    radial-gradient(ellipse 14% 6% at 88% 18%, rgba(255, 255, 255, 0.65), transparent 70%);
}

.sky-clouds-near {
  opacity: 0.65;
  animation-duration: 180s;
  background-image:
    radial-gradient(ellipse 26% 12% at 20% 55%, rgba(255, 255, 255, 0.95), transparent 70%),
    radial-gradient(ellipse 18% 9% at 52% 42%, rgba(255, 255, 255, 0.75), transparent 70%),
    radial-gradient(ellipse 28% 11% at 76% 60%, rgba(255, 255, 255, 0.85), transparent 70%),
    radial-gradient(ellipse 12% 6% at 91% 48%, rgba(255, 255, 255, 0.7), transparent 70%);
}

@keyframes sky-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}

/* Faint ordered-dither grain over the whole sky (the "hybrid" retro look). */
.sky-dither {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Cpath d='M0 0h1v1H0zM2 2h1v1H2z' fill='%23000'/%3E%3C/svg%3E");
  background-size: 4px 4px;
  opacity: 0.07;
  mix-blend-mode: overlay;
  image-rendering: pixelated;
}

@media (prefers-reduced-motion: reduce) {
  .sky-clouds { animation: none; }
}
```

- [ ] **Step 3: Replace `app/page.tsx` with a Sky-only page**

```tsx
import { Sky } from "@/components/sky/Sky";

export default function Home() {
  return <Sky />;
}
```

- [ ] **Step 4: Create `.claude/launch.json`**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

- [ ] **Step 5: Visual verification**

Start the preview (`preview_start` with name `dev`), open `http://localhost:3000`, screenshot. Expected: blue gradient sky, soft white cloud bands, visible-only-up-close grain; no horizontal scrollbar; console clean. Watch ~10s to confirm drift.

- [ ] **Step 6: Verify and commit**

Run: `bun run verify`
Expected: PASS.

```bash
git add components/sky app/globals.css app/page.tsx .claude/launch.json
git commit -m "feat: animated CSS sky with drifting clouds and dither grain"
```

---

### Task 4: Window chrome — RetroButton, TitleBar, WindowFrame (+ gesture stub)

**Files:**
- Create: `components/chrome/RetroButton.tsx`
- Create: `components/chrome/TitleBar.tsx`
- Create: `components/chrome/WindowFrame.tsx`
- Create: `components/desktop/useWindowGestures.ts` (no-op stub; Task 8 fills it in)
- Modify: `app/globals.css` (append window-body/scrollbar section)

**Interfaces:**
- Consumes: Task 2 types (`WindowState`, `DesktopDispatch`, `Placement`), theme utilities from Task 1.
- Produces:
  - `RetroButton(props: ButtonHTMLAttributes<HTMLButtonElement>)` and `RetroLink(props: AnchorHTMLAttributes<HTMLAnchorElement>)`.
  - `TitleBar({ title, focused, collapsed, onClose, onToggleCollapse, onPointerDown?, onDoubleClick? })`.
  - `WindowFrame({ win: WindowState, title: string, focused: boolean, zIndex: number, gesturesEnabled: boolean, dispatch: DesktopDispatch, children })`.
  - `useWindowGestures(args: WindowGestureArgs): WindowGestures` where `WindowGestureArgs = { id: string; nodeRef: RefObject<HTMLElement | null>; placement: Placement; collapsed: boolean; enabled: boolean; dispatch: DesktopDispatch }` and `WindowGestures = { onTitlePointerDown?: (e: ReactPointerEvent<HTMLElement>) => void; onGripPointerDown?: (e: ReactPointerEvent<HTMLElement>) => void }`. **Task 8 must keep this exact signature.**

- [ ] **Step 1: Write `components/chrome/RetroButton.tsx`**

```tsx
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const retroButtonClass =
  "inline-flex items-center justify-center font-pixel text-[13px] leading-none " +
  "px-3 py-1.5 bg-chrome text-chrome-ink border border-outline rounded-[2px] bevel-out " +
  "select-none active:bevel-in active:bg-chrome-dark disabled:opacity-40 " +
  "focus-visible:outline-2 focus-visible:outline-select no-underline";

export function RetroButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`${retroButtonClass} ${className}`} />;
}

export function RetroLink({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={`${retroButtonClass} ${className}`} />;
}
```

- [ ] **Step 2: Write `components/chrome/TitleBar.tsx`**

```tsx
"use client";

import type { MouseEventHandler, PointerEventHandler } from "react";

type TitleBarProps = {
  title: string;
  focused: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onDoubleClick?: MouseEventHandler<HTMLElement>;
};

const widgetClass =
  "size-3.5 shrink-0 border border-outline bg-chrome bevel-out " +
  "active:bevel-in active:bg-chrome-dark";

export function TitleBar({
  title,
  focused,
  collapsed,
  onClose,
  onToggleCollapse,
  onPointerDown,
  onDoubleClick,
}: TitleBarProps) {
  return (
    <header
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={`relative flex h-6 shrink-0 touch-none select-none items-center gap-1.5 bg-chrome px-1.5 ${
        focused ? "pinstripes" : ""
      } ${collapsed ? "" : "border-b border-outline"}`}
    >
      <button
        type="button"
        aria-label="Close window"
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={widgetClass}
      />
      <span
        className={`min-w-0 flex-1 truncate bg-chrome px-1 text-center font-pixel text-[13px] ${
          focused ? "text-chrome-ink" : "text-chrome-dim"
        }`}
      >
        {title}
      </span>
      <button
        type="button"
        aria-label={collapsed ? "Expand window" : "Collapse window"}
        onClick={onToggleCollapse}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`${widgetClass} flex items-center justify-center max-sm:hidden`}
      >
        <span className="h-px w-2 bg-chrome-ink" />
      </button>
    </header>
  );
}
```

- [ ] **Step 3: Write the gesture stub `components/desktop/useWindowGestures.ts`**

```tsx
"use client";

import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { DesktopDispatch, Placement } from "./types";

export type WindowGestureArgs = {
  id: string;
  nodeRef: RefObject<HTMLElement | null>;
  placement: Placement;
  collapsed: boolean;
  enabled: boolean;
  dispatch: DesktopDispatch;
};

export type WindowGestures = {
  onTitlePointerDown?: (e: ReactPointerEvent<HTMLElement>) => void;
  onGripPointerDown?: (e: ReactPointerEvent<HTMLElement>) => void;
};

// Stub: drag/resize arrive with the gestures task. Interface is final.
export function useWindowGestures(_args: WindowGestureArgs): WindowGestures {
  return {};
}
```

- [ ] **Step 4: Write `components/chrome/WindowFrame.tsx`**

```tsx
"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useWindowGestures } from "@/components/desktop/useWindowGestures";
import type { DesktopDispatch, WindowState } from "@/components/desktop/types";
import { TitleBar } from "./TitleBar";

type WindowFrameProps = {
  win: WindowState;
  title: string;
  focused: boolean;
  zIndex: number;
  gesturesEnabled: boolean;
  dispatch: DesktopDispatch;
  children: ReactNode;
};

export function WindowFrame({
  win,
  title,
  focused,
  zIndex,
  gesturesEnabled,
  dispatch,
  children,
}: WindowFrameProps) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const gestures = useWindowGestures({
    id: win.id,
    nodeRef,
    placement: win.placement,
    collapsed: win.collapsed,
    enabled: gesturesEnabled,
    dispatch,
  });

  const style: CSSProperties =
    win.placement.mode === "centered"
      ? {
          left: "50%",
          top: "42%",
          width: win.placement.size.w,
          height: win.collapsed ? undefined : win.placement.size.h,
          marginLeft: -win.placement.size.w / 2,
          marginTop: -win.placement.size.h / 2,
          zIndex,
        }
      : {
          transform: `translate3d(${win.placement.rect.x}px, ${win.placement.rect.y}px, 0)`,
          width: win.placement.rect.w,
          height: win.collapsed ? undefined : win.placement.rect.h,
          zIndex,
        };

  return (
    <section
      ref={nodeRef}
      role="dialog"
      aria-label={title}
      data-window-id={win.id}
      style={style}
      onPointerDown={() => dispatch({ type: "FOCUS", id: win.id })}
      className={`fixed left-0 top-0 flex flex-col rounded-[2px] border border-outline bg-chrome bevel-out ${
        focused
          ? "shadow-[2px_3px_0_rgba(15,25,46,0.35)]"
          : "shadow-[1px_2px_0_rgba(15,25,46,0.2)]"
      } max-sm:inset-x-0! max-sm:top-7! max-sm:bottom-0! max-sm:m-0! max-sm:h-auto! max-sm:w-auto! max-sm:transform-none! max-sm:rounded-none`}
    >
      <TitleBar
        title={title}
        focused={focused}
        collapsed={win.collapsed}
        onClose={() => dispatch({ type: "CLOSE", id: win.id })}
        onToggleCollapse={() => dispatch({ type: "TOGGLE_COLLAPSE", id: win.id })}
        onPointerDown={gestures.onTitlePointerDown}
        onDoubleClick={
          gesturesEnabled
            ? () => dispatch({ type: "TOGGLE_COLLAPSE", id: win.id })
            : undefined
        }
      />
      {!win.collapsed && (
        <div className="window-body retro-scroll relative min-h-0 flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      )}
      {!win.collapsed && gesturesEnabled && (
        <button
          type="button"
          aria-label="Resize window"
          onPointerDown={gestures.onGripPointerDown}
          className="absolute bottom-0 right-0 size-4 cursor-nwse-resize touch-none border-l border-t border-outline bg-chrome bevel-out"
        />
      )}
    </section>
  );
}
```

Why the styling works: desktop windows position with `fixed left-0 top-0` +
inline `transform`/`margin` (the exact properties gestures mutate); the
`max-sm:*!` important-suffix utilities beat those inline styles below 640px,
turning every window into a full-screen sheet under the 28px menu bar
(`top-7` = 28px = `MENU_BAR_H`).

- [ ] **Step 5: Append the window-body/scrollbar section to `app/globals.css`**

```css
/* --- Window body & retro scrollbars ------------------------------------- */

.window-body {
  border-top: 1px solid var(--bevel-light);
}

.retro-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--chrome-dark) var(--chrome);
}

.retro-scroll::-webkit-scrollbar {
  width: 14px;
}

.retro-scroll::-webkit-scrollbar-track {
  background: var(--chrome);
  border-left: 1px solid var(--outline);
}

.retro-scroll::-webkit-scrollbar-thumb {
  background: var(--chrome-dark);
  border: 1px solid var(--outline);
}
```

- [ ] **Step 6: Verify and commit**

Run: `bun run verify`
Expected: PASS (components are exported but unrendered until Task 7 — that is fine).

```bash
git add components/chrome components/desktop/useWindowGestures.ts app/globals.css
git commit -m "feat: window chrome — frame, title bar, retro buttons"
```

---

### Task 5: Menu system, desktop icons, glyphs

**Files:**
- Create: `components/chrome/glyphs.tsx`
- Create: `components/chrome/MenuBar.tsx`
- Create: `components/chrome/DesktopIcon.tsx`

**Interfaces:**
- Consumes: theme utilities (Task 1).
- Produces:
  - `FolderGlyph({ className? })`, `DocGlyph({ className? })`, `MarkGlyph({ className? })` — inline SVG, server-safe.
  - `MenuBar({ siteName: string, hasWindows: boolean, onAbout: () => void, onCloseTop: () => void, onCloseAll: () => void, onCleanUp: () => void })` — fixed 28px-tall bar (`h-7` = `MENU_BAR_H`).
  - `DesktopIcon({ label: string, glyph: ReactNode, onOpen: () => void })` — single click: 160ms selected flash, then `onOpen`.

- [ ] **Step 1: Write `components/chrome/glyphs.tsx`**

```tsx
type GlyphProps = { className?: string };

/** Pixel-art folder, 16×12 grid scaled 3×. */
export function FolderGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 12"
      width="48"
      height="36"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      <path d="M1 3h5v1h9v7H1z" fill="#a8c4e6" />
      <path d="M1 2h5v1H1z" fill="#c3d7ef" />
      <path
        d="M1 2h5v1h9v8H1zM1 4h14"
        fill="none"
        stroke="#26231e"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Pixel-art document with a folded corner, 12×14 grid scaled 3×. */
export function DocGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 12 14"
      width="36"
      height="42"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      <path d="M2 1h6l3 3v9H2z" fill="#ffffff" />
      <path d="M8 1v3h3" fill="#d4d0c8" />
      <path
        d="M2 1h6l3 3v9H2zM8 1v3h3M4 6h5M4 8h5M4 10h5"
        fill="none"
        stroke="#26231e"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Site mark for the menu bar: a tiny pixel cloud. */
export function MarkGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 14 10"
      width="21"
      height="15"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      <path d="M4 2h4v2h3v2h2v3H1V6h1V4h2z" fill="#ffffff" />
      <path
        d="M4 2h4v2h3v2h2v3H1V6h1V4h2z"
        fill="none"
        stroke="#26231e"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Write `components/chrome/MenuBar.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MarkGlyph } from "./glyphs";

type MenuItemSpec = { label: string; disabled?: boolean; onSelect: () => void };

type MenuSpec = {
  id: string;
  label: ReactNode;
  ariaLabel: string;
  hideOnMobile?: boolean;
  items: MenuItemSpec[];
};

type MenuBarProps = {
  siteName: string;
  hasWindows: boolean;
  onAbout: () => void;
  onCloseTop: () => void;
  onCloseAll: () => void;
  onCleanUp: () => void;
};

export function MenuBar({
  siteName,
  hasWindows,
  onAbout,
  onCloseTop,
  onCloseAll,
  onCleanUp,
}: MenuBarProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (openId === null) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  const menus: MenuSpec[] = [
    {
      id: "mark",
      label: <MarkGlyph />,
      ariaLabel: siteName,
      items: [{ label: "About this site…", onSelect: onAbout }],
    },
    {
      id: "file",
      label: "File",
      ariaLabel: "File",
      hideOnMobile: true,
      items: [
        { label: "Close Window", disabled: !hasWindows, onSelect: onCloseTop },
        { label: "Close All", disabled: !hasWindows, onSelect: onCloseAll },
      ],
    },
    {
      id: "view",
      label: "View",
      ariaLabel: "View",
      hideOnMobile: true,
      items: [
        { label: "Clean Up Windows", disabled: !hasWindows, onSelect: onCleanUp },
      ],
    },
  ];

  return (
    <nav
      ref={rootRef}
      className="fixed inset-x-0 top-0 z-[1000] flex h-7 select-none items-stretch border-b border-outline bg-chrome bevel-out px-1 font-pixel text-[13px]"
    >
      {menus.map((menu) => (
        <div
          key={menu.id}
          className={`relative ${menu.hideOnMobile ? "max-sm:hidden" : ""}`}
        >
          <button
            type="button"
            aria-label={menu.ariaLabel}
            aria-expanded={openId === menu.id}
            onClick={() => setOpenId(openId === menu.id ? null : menu.id)}
            onPointerEnter={() => {
              if (openId !== null) setOpenId(menu.id);
            }}
            className={`flex h-full items-center px-3 ${
              openId === menu.id ? "bg-select text-white" : "text-chrome-ink"
            }`}
          >
            {menu.label}
          </button>
          {openId === menu.id && (
            <ul className="absolute left-0 top-full min-w-44 border border-outline bg-chrome bevel-out py-1 shadow-[2px_3px_0_rgba(15,25,46,0.35)]">
              {menu.items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpenId(null);
                      item.onSelect();
                    }}
                    className="block w-full px-4 py-1 text-left text-chrome-ink enabled:hover:bg-select enabled:hover:text-white disabled:text-chrome-dim"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <span className="ml-auto flex items-center pr-2 text-chrome-ink">
        <Clock />
      </span>
    </nav>
  );
}

function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return <time suppressHydrationWarning>{time}</time>;
}
```

The clock renders empty on the server and fills in after hydration — no
mismatch, no layout shift bigger than a few ch.

- [ ] **Step 3: Write `components/chrome/DesktopIcon.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DesktopIconProps = {
  label: string;
  glyph: ReactNode;
  onOpen: () => void;
};

export function DesktopIcon({ label, glyph, onOpen }: DesktopIconProps) {
  const [selected, setSelected] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  // Single click, not double: visitors aren't OS users. The 160ms selected
  // flash keeps the desktop feel without the discoverability trap.
  const activate = () => {
    if (timer.current !== null) return;
    setSelected(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setSelected(false);
      onOpen();
    }, 160);
  };

  return (
    <button
      type="button"
      onClick={activate}
      className="group flex w-20 flex-col items-center gap-1 outline-none"
    >
      <span
        data-selected={selected || undefined}
        className="rounded-xs p-0.5 data-selected:bg-select/30"
      >
        {glyph}
      </span>
      <span
        data-selected={selected || undefined}
        className="max-w-full truncate rounded-xs bg-white/85 px-1 font-pixel text-[12px] text-chrome-ink group-focus-visible:outline-2 group-focus-visible:outline-select data-selected:bg-select data-selected:text-white"
      >
        {label}
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Verify and commit**

Run: `bun run verify`
Expected: PASS.

```bash
git add components/chrome
git commit -m "feat: menu bar with working menus and clock, desktop icons, pixel glyphs"
```

---

### Task 6: Content and window apps

**Files:**
- Create: `content/site.ts`
- Create: `content/projects.ts`
- Create: `components/windows/WelcomeWindow.tsx`
- Create: `components/windows/AboutWindow.tsx`
- Create: `components/windows/ProjectWindow.tsx`
- Create: `components/windows/WindowContentBoundary.tsx`

**Interfaces:**
- Consumes: `RetroButton`/`RetroLink` (Task 4), glyphs (Task 5).
- Produces:
  - `site` const: `{ name: string; welcome: { title; heading; paragraphs: readonly string[] }; about: { title; paragraphs: readonly string[] } }`.
  - `Project` type and `projects: Project[]` (5 entries; ids `aurora`, `meridian`, `pixelforge`, `signalbox`, `papertrail`).
  - `WelcomeWindow({ onBrowse: () => void; onAbout: () => void })`, `AboutWindow()`, `ProjectWindow({ project: Project })`, `WindowContentBoundary({ children })`.

- [ ] **Step 1: Write `content/site.ts`**

```ts
export const site = {
  name: "Lattice",
  welcome: {
    title: "Read Me",
    heading: "Welcome to Lattice",
    paragraphs: [
      "This desktop is a portfolio. Each folder holds a project — open one to take a look around.",
      "Drag windows by their title bars, stack them, collapse them with a double-click, tidy up from the View menu. It all works the way you'd hope.",
    ],
  },
  about: {
    title: "About",
    paragraphs: [
      "Lattice is a hand-built desktop environment for the web: a window compositor, a retro UI kit, and a drifting sky — written in React and CSS with no other dependencies.",
      "Replace this copy in content/site.ts.",
    ],
  },
} as const;
```

- [ ] **Step 2: Write `content/projects.ts`**

```ts
export type Project = {
  id: string;
  title: string;
  tagline: string;
  year?: string;
  paragraphs: string[];
  links: { label: string; href: string }[];
  images: { src: string; alt: string }[]; // files under public/projects/
  windowSize?: { w: number; h: number };
};

const placeholderParagraphs = (name: string): string[] => [
  `Placeholder copy — describe what ${name} is, who it's for, and the problem it solves in two or three sentences.`,
  "A second paragraph for the interesting build details: the constraint you fought, the trick that made it work, the part you're proud of.",
];

const placeholderLinks = [
  { label: "Visit", href: "#" },
  { label: "Source", href: "#" },
];

export const projects: Project[] = [
  {
    id: "aurora",
    title: "Aurora",
    tagline: "Ambient weather for your menu bar",
    year: "2024",
    paragraphs: placeholderParagraphs("Aurora"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "meridian",
    title: "Meridian",
    tagline: "Field notes that sync when the trail doesn't",
    year: "2024",
    paragraphs: placeholderParagraphs("Meridian"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "pixelforge",
    title: "PixelForge",
    tagline: "A tiny sprite editor that fits in a tweet",
    year: "2023",
    paragraphs: placeholderParagraphs("PixelForge"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "signalbox",
    title: "Signalbox",
    tagline: "Home-lab dashboards without the YAML",
    year: "2025",
    paragraphs: placeholderParagraphs("Signalbox"),
    links: placeholderLinks,
    images: [],
  },
  {
    id: "papertrail",
    title: "Papertrail",
    tagline: "Receipts in, spreadsheets out",
    year: "2025",
    paragraphs: placeholderParagraphs("Papertrail"),
    links: placeholderLinks,
    images: [],
  },
];
```

- [ ] **Step 3: Write `components/windows/WelcomeWindow.tsx`**

```tsx
import { RetroButton } from "@/components/chrome/RetroButton";
import { site } from "@/content/site";

type WelcomeWindowProps = {
  onBrowse: () => void;
  onAbout: () => void;
};

export function WelcomeWindow({ onBrowse, onAbout }: WelcomeWindowProps) {
  return (
    <div className="flex flex-col gap-3 p-4 font-sans text-sm leading-relaxed">
      <h1 className="border-b border-outline/20 pb-2 font-pixel text-xl">
        {site.welcome.heading}
      </h1>
      {site.welcome.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <div className="mt-1 flex gap-2">
        <RetroButton onClick={onBrowse}>Open a project</RetroButton>
        <RetroButton onClick={onAbout}>About</RetroButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `components/windows/AboutWindow.tsx`**

```tsx
import { MarkGlyph } from "@/components/chrome/glyphs";
import { site } from "@/content/site";

export function AboutWindow() {
  return (
    <div className="flex flex-col gap-3 p-4 font-sans text-sm leading-relaxed">
      <header className="flex items-center gap-2 border-b border-outline/20 pb-2">
        <MarkGlyph />
        <h1 className="font-pixel text-xl">{site.name}</h1>
      </header>
      {site.about.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Write `components/windows/ProjectWindow.tsx`**

```tsx
import Image from "next/image";
import { RetroLink } from "@/components/chrome/RetroButton";
import { FolderGlyph } from "@/components/chrome/glyphs";
import type { Project } from "@/content/projects";

export function ProjectWindow({ project }: { project: Project }) {
  const hero = project.images[0];
  return (
    <article className="flex flex-col gap-3 p-4 font-sans text-sm leading-relaxed">
      <header className="flex items-center gap-3 border-b border-outline/20 pb-3">
        <FolderGlyph />
        <div className="min-w-0">
          <h2 className="truncate font-pixel text-lg">{project.title}</h2>
          <p className="truncate text-chrome-dim">
            {project.tagline}
            {project.year ? ` · ${project.year}` : ""}
          </p>
        </div>
      </header>
      {hero && (
        <Image
          src={hero.src}
          alt={hero.alt}
          width={800}
          height={450}
          className="h-auto w-full border border-outline"
        />
      )}
      {project.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <footer className="mt-1 flex flex-wrap gap-2">
        {project.links.map((link) => (
          <RetroLink key={link.label} href={link.href}>
            {link.label}
          </RetroLink>
        ))}
      </footer>
    </article>
  );
}
```

(v1 ships `images: []`, so `next/image` never renders and no image bytes load;
the slot is wired for when real content lands.)

- [ ] **Step 6: Write `components/windows/WindowContentBoundary.tsx`**

```tsx
"use client";

import { Component, type ReactNode } from "react";

type BoundaryState = { failed: boolean };

/** One broken window app must not take down the desktop. */
export class WindowContentBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="p-4 font-pixel text-[13px]">
          This window crashed. Close it and carry on.
        </p>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 7: Verify and commit**

Run: `bun run verify`
Expected: PASS.

```bash
git add content components/windows
git commit -m "feat: placeholder content and window apps (welcome, about, project)"
```

---

### Task 7: Desktop assembly

**Files:**
- Create: `components/desktop/useIsMobile.ts`
- Create: `components/desktop/Desktop.tsx`
- Modify: `app/page.tsx` (replace the Sky-only page)

**Interfaces:**
- Consumes: everything produced by Tasks 2–6.
- Produces: `Desktop()` (client component, no props) — the entire page.

- [ ] **Step 1: Write `components/desktop/useIsMobile.ts`**

```ts
"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 639px)"; // below Tailwind `sm`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false, // SSR: assume desktop; CSS handles the visual either way
  );
}
```

- [ ] **Step 2: Write `components/desktop/Desktop.tsx`**

```tsx
"use client";

import { useEffect, useReducer } from "react";
import { DesktopIcon } from "@/components/chrome/DesktopIcon";
import { DocGlyph, FolderGlyph } from "@/components/chrome/glyphs";
import { MenuBar } from "@/components/chrome/MenuBar";
import { WindowFrame } from "@/components/chrome/WindowFrame";
import { Sky } from "@/components/sky/Sky";
import { AboutWindow } from "@/components/windows/AboutWindow";
import { ProjectWindow } from "@/components/windows/ProjectWindow";
import { WelcomeWindow } from "@/components/windows/WelcomeWindow";
import { WindowContentBoundary } from "@/components/windows/WindowContentBoundary";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { desktopReducer, initialDesktopState } from "./desktopReducer";
import { useIsMobile } from "./useIsMobile";
import type { Size, Viewport, WindowKind, WindowState } from "./types";

const SIZES: Record<WindowKind, Size> = {
  welcome: { w: 400, h: 320 },
  about: { w: 380, h: 300 },
  project: { w: 480, h: 380 },
};

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function Desktop() {
  const [state, dispatch] = useReducer(desktopReducer, undefined, initialDesktopState);
  const isMobile = useIsMobile();

  // Keep every window reachable when the browser window changes size.
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        dispatch({ type: "CLAMP_ALL", viewport: viewport() }),
      );
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const open = (kind: WindowKind, projectId?: string) =>
    dispatch({
      type: "OPEN",
      kind,
      projectId,
      size:
        kind === "project"
          ? (projects.find((p) => p.id === projectId)?.windowSize ?? SIZES.project)
          : SIZES[kind],
      viewport: viewport(),
    });

  const focusedId = state.order.at(-1);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Sky />
      <MenuBar
        siteName={site.name}
        hasWindows={state.order.length > 0}
        onAbout={() => open("about")}
        onCloseTop={() => {
          if (focusedId) dispatch({ type: "CLOSE", id: focusedId });
        }}
        onCloseAll={() => dispatch({ type: "CLOSE_ALL" })}
        onCleanUp={() => dispatch({ type: "CLEAN_UP", viewport: viewport() })}
      />
      <div className="absolute bottom-3 right-3 top-10 flex flex-col items-center gap-4 max-sm:static max-sm:mt-10 max-sm:grid max-sm:grid-cols-3 max-sm:justify-items-center max-sm:px-4">
        {projects.map((project) => (
          <DesktopIcon
            key={project.id}
            label={project.title}
            glyph={<FolderGlyph />}
            onOpen={() => open("project", project.id)}
          />
        ))}
        <DesktopIcon
          label={site.welcome.title}
          glyph={<DocGlyph />}
          onOpen={() => open("welcome")}
        />
      </div>
      {state.order.map((id, index) => {
        const win = state.windows[id];
        return (
          <WindowFrame
            key={id}
            win={win}
            title={titleOf(win)}
            focused={id === focusedId}
            zIndex={10 + index}
            gesturesEnabled={!isMobile}
            dispatch={dispatch}
          >
            <WindowContentBoundary>
              {contentOf(win, open)}
            </WindowContentBoundary>
          </WindowFrame>
        );
      })}
    </div>
  );
}

function titleOf(win: WindowState): string {
  if (win.kind === "welcome") return site.welcome.title;
  if (win.kind === "about") return site.about.title;
  return projects.find((p) => p.id === win.projectId)?.title ?? "Untitled";
}

function contentOf(
  win: WindowState,
  open: (kind: WindowKind, projectId?: string) => void,
) {
  if (win.kind === "welcome") {
    return (
      <WelcomeWindow
        onBrowse={() => open("project", projects[0].id)}
        onAbout={() => open("about")}
      />
    );
  }
  if (win.kind === "about") return <AboutWindow />;
  const project = projects.find((p) => p.id === win.projectId);
  return project ? <ProjectWindow project={project} /> : null;
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

```tsx
import { Desktop } from "@/components/desktop/Desktop";

export default function Home() {
  return <Desktop />;
}
```

- [ ] **Step 4: Browser verification (gestures still stubbed — everything else must work)**

With the dev preview running, check:
1. Load: sky + menu bar + icon column right + welcome window centered. No console errors, no hydration warnings.
2. Click a folder icon: selected flash, project window opens cascaded, on top.
3. Click between windows: focus follows (pinstripes + shadow move).
4. Close box: window disappears. File → Close All: desktop empties; File items disable.
5. Collapse widget: window shades to its title bar; again restores.
6. View → Clean Up Windows: windows re-cascade.
7. Menu behavior: click opens, hover-slides between menus, Esc and outside-click close.
8. Welcome buttons: "Open a project" opens the first project; "About" opens About.
9. `view-source` sanity: the static HTML already contains the welcome window text (SSR).

- [ ] **Step 5: Run all checks and commit**

Run: `bun run test && bun run verify`
Expected: PASS.

```bash
git add components/desktop app/page.tsx
git commit -m "feat: assemble the desktop — icons, windows, menu wiring"
```

---

### Task 8: Real drag & resize gestures

**Files:**
- Modify: `components/desktop/useWindowGestures.ts` (replace the stub body; keep the exact exported types/signature from Task 4)

**Interfaces:**
- Consumes: `clampRect` (Task 2 — it enforces the min sizes), `WindowGestureArgs`/`WindowGestures` (Task 4).
- Produces: working `onTitlePointerDown` (drag) and `onGripPointerDown` (resize).

- [ ] **Step 1: Replace `components/desktop/useWindowGestures.ts`**

```tsx
"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { clampRect } from "./geometry";
import type { DesktopDispatch, Placement, Size, Viewport } from "./types";

export type WindowGestureArgs = {
  id: string;
  nodeRef: RefObject<HTMLElement | null>;
  placement: Placement;
  collapsed: boolean;
  enabled: boolean;
  dispatch: DesktopDispatch;
};

export type WindowGestures = {
  onTitlePointerDown?: (e: ReactPointerEvent<HTMLElement>) => void;
  onGripPointerDown?: (e: ReactPointerEvent<HTMLElement>) => void;
};

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Drag/resize write `transform`/size straight to the DOM node each animation
 * frame (zero React renders), then commit ONE `SET_RECT` on release. React
 * re-renders from the committed state to the exact same pixels.
 */
export function useWindowGestures({
  id,
  nodeRef,
  placement,
  collapsed,
  enabled,
  dispatch,
}: WindowGestureArgs): WindowGestures {
  const active = useRef(false);

  if (!enabled) return {};

  // The window's logical size: for collapsed windows the DOM height is just
  // the title bar, so commits must reuse the stored size, not the visual one.
  const logicalSize: Size =
    placement.mode === "rect"
      ? { w: placement.rect.w, h: placement.rect.h }
      : placement.size;

  const begin = (
    e: ReactPointerEvent<HTMLElement>,
    onFrame: (dx: number, dy: number, start: DOMRect) => void,
    onEnd: (dx: number, dy: number, start: DOMRect) => void,
  ) => {
    const node = nodeRef.current;
    if (!node || active.current || e.button !== 0) return;
    active.current = true;
    e.preventDefault();

    const start = node.getBoundingClientRect();
    const originX = e.clientX;
    const originY = e.clientY;
    let dx = 0;
    let dy = 0;
    let raf = 0;

    // Normalize CSS-centered windows to absolute coordinates (same pixels,
    // different mechanism) so the transform below is the only positioner.
    node.style.left = "0px";
    node.style.top = "0px";
    node.style.margin = "0";
    node.style.transform = `translate3d(${start.x}px, ${start.y}px, 0)`;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: globalThis.PointerEvent) => {
      dx = ev.clientX - originX;
      dy = ev.clientY - originY;
      if (raf === 0) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          onFrame(dx, dy, start);
        });
      }
    };
    const finish = () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      active.current = false;
      onEnd(dx, dy, start);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
  };

  const onTitlePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    begin(
      e,
      (dx, dy, start) => {
        const node = nodeRef.current;
        if (!node) return;
        // Live-clamp so the window never visually escapes, no snap-back.
        const r = clampRect(
          { x: start.x + dx, y: start.y + dy, w: start.width, h: start.height },
          viewport(),
        );
        node.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
      },
      (dx, dy, start) => {
        dispatch({
          type: "SET_RECT",
          id,
          rect: { x: start.x + dx, y: start.y + dy, w: logicalSize.w, h: logicalSize.h },
          viewport: viewport(),
        });
      },
    );
  };

  const onGripPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    e.stopPropagation(); // don't let the frame's FOCUS handler swallow it twice
    begin(
      e,
      (dx, dy, start) => {
        const node = nodeRef.current;
        if (!node) return;
        const r = clampRect(
          { x: start.x, y: start.y, w: start.width + dx, h: start.height + dy },
          viewport(),
        );
        node.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
        node.style.width = `${r.w}px`;
        node.style.height = `${r.h}px`;
      },
      (dx, dy, start) => {
        dispatch({
          type: "SET_RECT",
          id,
          rect: { x: start.x, y: start.y, w: start.width + dx, h: start.height + dy },
          viewport: viewport(),
        });
      },
    );
  };

  // `collapsed` is intentionally unused beyond logicalSize: the resize grip
  // is not rendered while collapsed, and drags of collapsed windows commit
  // the stored (expanded) size via logicalSize.
  void collapsed;

  return { onTitlePointerDown, onGripPointerDown };
}
```

Note on the early `return {}` after `useRef`: hooks all run before it, so the
rules of hooks hold (`enabled` flips only with viewport class changes, and the
hook count stays identical either way).

- [ ] **Step 2: Browser verification**

1. Drag the welcome window by its title bar: smooth, pointer stays glued, no text selection. Release: window stays put (no jump — the centered→rect handoff is pixel-identical).
2. Drag hard off every edge: window stops with the title bar still reachable (left/right keep a 48px sliver; top stops at the menu bar; bottom keeps the title bar visible).
3. Resize from the bottom-right grip: honors 240×120 minimum, content reflows, scrollbar appears when content overflows.
4. Double-click title bar: collapses; drag the collapsed shade around; double-click restores at the dragged position with its original size.
5. Open three windows, drag between them: z-order and focus stay correct mid-drag.
6. DevTools Performance panel with 4x CPU throttle while dragging: no long tasks from React commits during the move (only on release).

- [ ] **Step 3: Run all checks and commit**

Run: `bun run test && bun run verify`
Expected: PASS.

```bash
git add components/desktop/useWindowGestures.ts
git commit -m "feat: pointer-driven window drag and resize, zero re-renders per frame"
```

---

### Task 9: Mobile pass, performance verification, docs

**Files:**
- Modify: whatever the mobile/perf checks below surface (expected: small CSS tweaks only)
- Modify: `CLAUDE.md` (Status section no longer describes a bare scaffold)

**Interfaces:**
- Consumes: the finished app.
- Produces: the verified deliverable.

- [ ] **Step 1: Mobile verification at 375×812 (browser device emulation)**

1. Icons render as a 3-column grid under the menu bar; File/View menus hidden; mark menu + clock present.
2. Welcome window fills the screen below the menu bar; body scrolls; close box works.
3. Tapping icons opens full-screen windows; the topmost is the visible one; closing reveals the previous.
4. No drag/resize/collapse affordances (grip and collapse widget hidden).
5. No horizontal overflow anywhere.

Fix anything that fails with CSS-level changes (the `max-sm:*` utilities in `WindowFrame`/`Desktop`/`MenuBar` are the knobs).

- [ ] **Step 2: Reduced-motion check**

Emulate `prefers-reduced-motion: reduce` in DevTools rendering options: cloud drift stops, everything else works.

- [ ] **Step 3: Performance verification (the spec's budget)**

1. Network panel, hard reload: document + CSS + JS chunks + exactly 2 font files, all same-origin; no images.
2. Lighthouse (or performance trace) mobile run: LCP < 1.0s at Fast-3G/4x-CPU preset, CLS = 0.
3. `bun run build` output: the route is statically prerendered (○ marker), first-load JS within ~130KB.

If LCP misses: check the fonts are `display: swap` (next/font default) and nothing blocks first paint; if CLS > 0: find what moves after hydration (the usual suspect is the clock — it must render into reserved space, fix by giving the `time` element a fixed `min-width` such as `min-w-[7ch]` in `MenuBar`).

- [ ] **Step 4: Update `CLAUDE.md` Status section**

Replace the "unmodified `create-next-app` scaffold" paragraph with a short
description: retro desktop landing page; compositor state in
`components/desktop/` (pure reducer + ref-based gestures); chrome kit in
`components/chrome/` themed via `@theme` tokens in `app/globals.css`;
portfolio content in `content/projects.ts`.

- [ ] **Step 5: Full verification and final commit**

Run: `bun run test && bun run verify:full`
Expected: tests, lint, typecheck, and production build all PASS.

```bash
git add -A
git commit -m "chore: mobile/perf verification pass and docs update"
```
