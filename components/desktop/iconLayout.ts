import { MENU_BAR_H, MOBILE_QUERY } from "./geometry";
import type { Point, Size, Viewport } from "./types";

export type IconPositions = Record<string, Point>;

/**
 * Desktop icons start in normal document flow — a CSS column on desktop, a
 * grid on mobile — so the static HTML is correct at every viewport with no
 * JavaScript and no layout shift. This mirrors `Placement` for windows in
 * ./types.
 *
 * The first real drag snapshots every icon's measured position and switches
 * the whole set to `free` at once. Converting only the dragged icon would pull
 * it out of the flex column and let the remaining icons reflow upward from
 * under the pointer.
 */
export type IconLayout =
  | { mode: "flow" }
  | { mode: "free"; positions: IconPositions };

/**
 * Session-scoped on purpose: positions survive a reload of the tab and are
 * discarded when it closes. `sessionStorage` is per-tab, so two tabs arrange
 * the desktop independently.
 */
export const ICON_LAYOUT_KEY = "lattice:icon-layout";

/** Breathing room kept between an icon and the viewport edge. */
export const ICON_EDGE_GAP = 8;

/**
 * Icons stay fully on screen and clear of the menu bar — unlike windows, which
 * `clampRect` deliberately lets hang off the edge so long as a grabbable sliver
 * remains. An icon half off screen just looks broken.
 */
export function clampIconPosition(p: Point, size: Size, vp: Viewport): Point {
  const minX = ICON_EDGE_GAP;
  const minY = MENU_BAR_H + ICON_EDGE_GAP;
  return {
    x: Math.min(Math.max(p.x, minX), Math.max(minX, vp.width - size.w - ICON_EDGE_GAP)),
    y: Math.min(Math.max(p.y, minY), Math.max(minY, vp.height - size.h - ICON_EDGE_GAP)),
  };
}

export function clampPositions(
  positions: IconPositions,
  size: Size,
  vp: Viewport,
): IconPositions {
  const next: IconPositions = {};
  for (const [id, p] of Object.entries(positions)) {
    next[id] = clampIconPosition(p, size, vp);
  }
  return next;
}

/**
 * Translate `ids` by (dx, dy), clamping the delta once against the group's
 * bounding box rather than clamping each icon separately.
 *
 * Per-icon clamping is the obvious implementation and the wrong one: when a
 * multi-selection reaches an edge, the leading icons stop while the trailing
 * ones keep closing in, so the group visibly collapses in on itself instead of
 * sliding to a stop. Clamping the shared delta preserves the arrangement.
 */
export function moveIcons(
  positions: IconPositions,
  ids: readonly string[],
  dx: number,
  dy: number,
  size: Size,
  vp: Viewport,
): IconPositions {
  const moving = ids.filter((id) => positions[id]);
  if (moving.length === 0) return positions;

  const xs = moving.map((id) => positions[id].x);
  const ys = moving.map((id) => positions[id].y);
  const minX = ICON_EDGE_GAP;
  const minY = MENU_BAR_H + ICON_EDGE_GAP;
  const maxX = Math.max(minX, vp.width - size.w - ICON_EDGE_GAP);
  const maxY = Math.max(minY, vp.height - size.h - ICON_EDGE_GAP);

  // Lower bound must win over the upper bound when the group is wider than the
  // viewport, otherwise a too-large selection would be pushed off the top-left.
  const clampedDx = Math.max(minX - Math.min(...xs), Math.min(dx, maxX - Math.max(...xs)));
  const clampedDy = Math.max(minY - Math.min(...ys), Math.min(dy, maxY - Math.max(...ys)));

  const next: IconPositions = { ...positions };
  for (const id of moving) {
    next[id] = { x: positions[id].x + clampedDx, y: positions[id].y + clampedDy };
  }
  return next;
}

/**
 * Parse a persisted layout, keeping only entries for icons that still exist.
 *
 * Storage is attacker-adjacent in the sense that matters here: it survives code
 * changes. A project renamed or removed in content/projects.ts leaves a stale
 * id behind, and a hand-edited value can hold anything at all — so every entry
 * is shape-checked and unknown ids are dropped rather than trusted.
 */
export function parseStoredLayout(
  raw: string | null,
  knownIds: readonly string[],
): IconPositions | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const known = new Set(knownIds);
  const positions: IconPositions = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!known.has(id)) continue;
    if (typeof value !== "object" || value === null) continue;
    const { x, y } = value as { x?: unknown; y?: unknown };
    if (typeof x !== "number" || typeof y !== "number") continue;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    positions[id] = { x, y };
  }
  // A partial layout is unusable: the icons without a stored position would
  // still be in flex flow while the rest are absolute, so they would pile up.
  return knownIds.every((id) => positions[id]) ? positions : null;
}

export function serializeLayout(positions: IconPositions): string {
  // Round to whole pixels — sub-pixel precision is invisible and bloats the
  // stored value with 15-digit floats.
  const rounded: IconPositions = {};
  for (const [id, p] of Object.entries(positions)) {
    rounded[id] = { x: Math.round(p.x), y: Math.round(p.y) };
  }
  return JSON.stringify(rounded);
}

/** sessionStorage throws in private modes and when site data is blocked. */
export function readStoredLayout(knownIds: readonly string[]): IconPositions | null {
  try {
    return parseStoredLayout(window.sessionStorage.getItem(ICON_LAYOUT_KEY), knownIds);
  } catch {
    return null;
  }
}

export function clearStoredLayout(): void {
  try {
    window.sessionStorage.removeItem(ICON_LAYOUT_KEY);
  } catch {
    // Non-fatal: the in-memory reset below still takes effect.
  }
}

export function writeStoredLayout(positions: IconPositions): void {
  try {
    window.sessionStorage.setItem(ICON_LAYOUT_KEY, serializeLayout(positions));
  } catch {
    // Non-fatal: the arrangement still holds for this page view.
  }
}

export const ICON_BOOT_STYLE_ID = "lattice-icon-boot";

/**
 * Render-blocking script that restores the saved arrangement before the
 * browser's first paint.
 *
 * No React effect can do this job. The desktop is prerendered, so the browser
 * paints the default icon column the moment it parses the HTML — measured at
 * ~96ms, with hydration well after that. A restore that waits for React is
 * therefore always visible as a jump, `useLayoutEffect` included: that runs
 * before paint only relative to React's own renders, not to the first paint of
 * the server HTML. Same class of problem as the dark-mode flash, same fix.
 *
 * It injects a stylesheet instead of writing inline styles, which buys two
 * things: it can run from <head> before a single icon element exists, and it
 * leaves the markup byte-identical so hydration has no attribute mismatch to
 * reconcile. useIconDrag drops the stylesheet once it has pinned the nodes
 * itself, which also stops it outliving a switch back to mobile flow layout.
 *
 * Positions are applied unclamped — icon dimensions are not known before
 * layout. The layout effect re-clamps against the live viewport immediately
 * after, so a browser resized between visits self-corrects on the first frame.
 */
export function iconLayoutBootScript(): string {
  return `(function(){try{
if(window.matchMedia(${JSON.stringify(MOBILE_QUERY)}).matches)return;
var r=sessionStorage.getItem(${JSON.stringify(ICON_LAYOUT_KEY)});if(!r)return;
var p=JSON.parse(r);if(!p||typeof p!=="object"||Array.isArray(p))return;
var c="";for(var k in p){
if(!/^[A-Za-z0-9_-]+$/.test(k))continue;
var v=p[k];if(!v||typeof v.x!=="number"||typeof v.y!=="number")continue;
if(!isFinite(v.x)||!isFinite(v.y))continue;
c+='[data-icon="'+k+'"]{position:fixed;left:0;top:0;margin:0;transform:translate3d('+v.x+'px,'+v.y+'px,0)}';}
if(!c)return;var s=document.createElement("style");
s.id=${JSON.stringify(ICON_BOOT_STYLE_ID)};s.textContent=c;document.head.appendChild(s);
}catch(e){}})();`;
}
