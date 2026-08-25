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
