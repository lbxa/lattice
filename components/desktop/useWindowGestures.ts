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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useWindowGestures(_args: WindowGestureArgs): WindowGestures {
  return {};
}
