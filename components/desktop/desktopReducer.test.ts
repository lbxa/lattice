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
