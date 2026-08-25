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
