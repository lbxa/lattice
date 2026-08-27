import { describe, expect, test } from "bun:test";
import { MENU_BAR_H } from "./geometry";
import {
  ICON_BOOT_STYLE_ID,
  ICON_EDGE_GAP,
  iconLayoutBootScript,
  clampIconPosition,
  clampPositions,
  moveIcons,
  parseStoredLayout,
  serializeLayout,
  type IconPositions,
} from "./iconLayout";
import type { Size, Viewport } from "./types";

const vp: Viewport = { width: 1280, height: 800 };
const size: Size = { w: 80, h: 64 };
const IDS = ["aurora", "meridian", "welcome"];

const MIN_X = ICON_EDGE_GAP;
const MIN_Y = MENU_BAR_H + ICON_EDGE_GAP;
const MAX_X = vp.width - size.w - ICON_EDGE_GAP;
const MAX_Y = vp.height - size.h - ICON_EDGE_GAP;

describe("clampIconPosition", () => {
  test("leaves an in-bounds position untouched, at whatever sub-grid offset", () => {
    // The whole point of the feature: no snapping to a grid.
    expect(clampIconPosition({ x: 337, y: 219 }, size, vp)).toEqual({ x: 337, y: 219 });
  });

  test("keeps icons fully on screen and clear of the menu bar", () => {
    expect(clampIconPosition({ x: -500, y: -500 }, size, vp)).toEqual({ x: MIN_X, y: MIN_Y });
    expect(clampIconPosition({ x: 9999, y: 9999 }, size, vp)).toEqual({ x: MAX_X, y: MAX_Y });
  });

  test("degenerate viewports collapse to the minimum rather than inverting", () => {
    const tiny: Viewport = { width: 10, height: 10 };
    expect(clampIconPosition({ x: 500, y: 500 }, size, tiny)).toEqual({ x: MIN_X, y: MIN_Y });
  });
});

describe("clampPositions", () => {
  test("pulls a whole restored layout back into a smaller viewport", () => {
    const stored: IconPositions = { a: { x: 1200, y: 700 }, b: { x: 40, y: 100 } };
    const small: Viewport = { width: 600, height: 400 };
    const next = clampPositions(stored, size, small);
    expect(next.a).toEqual({ x: 600 - size.w - ICON_EDGE_GAP, y: 400 - size.h - ICON_EDGE_GAP });
    expect(next.b).toEqual({ x: 40, y: 100 });
  });
});

describe("moveIcons", () => {
  const start: IconPositions = {
    aurora: { x: 100, y: 100 },
    meridian: { x: 200, y: 100 },
    welcome: { x: 300, y: 300 },
  };

  test("translates only the named icons", () => {
    const next = moveIcons(start, ["aurora"], 25, -10, size, vp);
    expect(next.aurora).toEqual({ x: 125, y: 90 });
    expect(next.meridian).toEqual(start.meridian);
    expect(next.welcome).toEqual(start.welcome);
  });

  test("moves a multi-selection as a rigid group", () => {
    const next = moveIcons(start, ["aurora", "meridian"], 40, 40, size, vp);
    expect(next.aurora).toEqual({ x: 140, y: 140 });
    expect(next.meridian).toEqual({ x: 240, y: 140 });
  });

  test("a group meeting an edge slides to a stop without deforming", () => {
    // The leading icon pins to the edge; spacing must survive. Clamping each
    // icon independently would let the trailing one keep closing the gap.
    const next = moveIcons(start, ["aurora", "meridian"], 5000, 0, size, vp);
    expect(next.meridian.x).toBe(MAX_X);
    expect(next.meridian.x - next.aurora.x).toBe(100);
    expect(next.aurora.y).toBe(start.aurora.y);
  });

  test("a group wider than the viewport pins to the near edge, not off it", () => {
    const wide: IconPositions = { a: { x: 0, y: 100 }, b: { x: 5000, y: 100 } };
    const next = moveIcons(wide, ["a", "b"], -100, 0, size, vp);
    expect(next.a.x).toBe(MIN_X);
  });

  test("ignores ids with no stored position", () => {
    expect(moveIcons(start, ["ghost"], 10, 10, size, vp)).toBe(start);
  });
});

describe("parseStoredLayout", () => {
  test("round-trips a serialized layout, rounded to whole pixels", () => {
    const positions: IconPositions = {
      aurora: { x: 10.4, y: 20.6 },
      meridian: { x: 30, y: 40 },
      welcome: { x: 50, y: 60 },
    };
    const parsed = parseStoredLayout(serializeLayout(positions), IDS);
    expect(parsed).toEqual({
      aurora: { x: 10, y: 21 },
      meridian: { x: 30, y: 40 },
      welcome: { x: 50, y: 60 },
    });
  });

  test("rejects absent, malformed, and non-object payloads", () => {
    for (const raw of [null, "", "not json", "[1,2]", '"str"', "null"]) {
      expect(parseStoredLayout(raw, IDS)).toBeNull();
    }
  });

  test("rejects a partial layout rather than half-positioning the desktop", () => {
    // Mixed modes would leave unpositioned icons stacked in flex flow.
    expect(parseStoredLayout('{"aurora":{"x":1,"y":2}}', IDS)).toBeNull();
  });

  test("rejects non-finite and non-numeric coordinates", () => {
    const bad = '{"aurora":{"x":1,"y":2},"meridian":{"x":"3","y":4},"welcome":{"x":5,"y":6}}';
    expect(parseStoredLayout(bad, IDS)).toBeNull();
    // NaN/Infinity cannot survive JSON.stringify, but hand-edited storage can
    // still carry them in via `1e999`, which parses to Infinity.
    const inf = '{"aurora":{"x":1e999,"y":2},"meridian":{"x":3,"y":4},"welcome":{"x":5,"y":6}}';
    expect(parseStoredLayout(inf, IDS)).toBeNull();
  });

  test("drops ids that no longer exist in content", () => {
    const stale =
      '{"aurora":{"x":1,"y":2},"meridian":{"x":3,"y":4},"welcome":{"x":5,"y":6},"deleted":{"x":7,"y":8}}';
    const parsed = parseStoredLayout(stale, IDS);
    expect(parsed).not.toBeNull();
    expect(Object.keys(parsed!).sort()).toEqual([...IDS].sort());
  });
});


/**
 * Runs the pre-hydration boot script against stubbed browser globals and
 * returns whatever stylesheet it tried to inject.
 *
 * The script is a string executed before React exists, so it cannot be
 * type-checked or covered by the rest of the suite. Executing it here is the
 * only way to hold its behaviour still.
 */
function runBootScript(stored: string | null, mobile = false) {
  let injected: { id: string; css: string } | null = null;
  const doc = {
    createElement: () => ({ id: "", textContent: "" }),
    head: {
      appendChild: (el: { id: string; textContent: string }) => {
        injected = { id: el.id, css: el.textContent };
      },
    },
  };
  new Function(
    "window",
    "sessionStorage",
    "document",
    iconLayoutBootScript(),
  )({ matchMedia: () => ({ matches: mobile }) }, { getItem: () => stored }, doc);
  return injected as { id: string; css: string } | null;
}

const VALID = JSON.stringify({
  aurora: { x: 120, y: 600 },
  welcome: { x: 40.5, y: 12 },
});

describe("iconLayoutBootScript", () => {
  test("injects one positioning rule per stored icon", () => {
    const out = runBootScript(VALID);
    expect(out?.id).toBe(ICON_BOOT_STYLE_ID);
    expect(out?.css).toContain('[data-icon="aurora"]');
    expect(out?.css).toContain("translate3d(120px,600px,0)");
    expect(out?.css).toContain("translate3d(40.5px,12px,0)");
    // Must cover every property useIconDrag's pinNode writes, or the handover
    // from stylesheet to inline styles would shift the icons.
    for (const prop of ["position:fixed", "left:0", "top:0", "margin:0"]) {
      expect(out?.css).toContain(prop);
    }
  });

  test("does nothing on mobile, where icons stay in grid flow", () => {
    expect(runBootScript(VALID, true)).toBeNull();
  });

  test("does nothing without a usable stored layout", () => {
    for (const raw of [null, "", "not json", "[1,2]", "null", "{}"]) {
      expect(runBootScript(raw)).toBeNull();
    }
  });

  test("refuses ids that could break out of the CSS selector", () => {
    // Storage is user-editable, and these ids are interpolated into a
    // stylesheet, so anything outside the slug charset must be dropped.
    const hostile = JSON.stringify({
      'x"]{}*{display:none}[a="': { x: 1, y: 2 },
      "ok-id_1": { x: 3, y: 4 },
    });
    const css = runBootScript(hostile)?.css ?? "";
    expect(css).toContain('[data-icon="ok-id_1"]');
    expect(css).not.toContain("display:none");
    expect(css).not.toContain("*{");
  });

  test("skips coordinates that are not finite numbers", () => {
    const bad = JSON.stringify({ a: { x: "3", y: 4 }, b: { x: 1e999, y: 0 } });
    expect(runBootScript(bad)).toBeNull();
  });
});
