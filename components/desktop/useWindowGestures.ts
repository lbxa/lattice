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
