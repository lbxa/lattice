"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { clampRect } from "./geometry";
import type { DesktopDispatch, Placement, Size, Viewport } from "./types";

export type WindowGestureArgs = {
  id: string;
  nodeRef: RefObject<HTMLElement | null>;
  placement: Placement;
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

// Click-vs-drag slop: pointer coordinates can jitter by a pixel or two from
// event coalescing/rounding even on a stationary click. Requiring more than
// this before treating the gesture as a real drag keeps a genuine click from
// converting a centered window to rect placement, without adding any
// perceptible delay to intentional drags.
const MOVE_SLOP = 2;

/**
 * Drag/resize write `transform`/size straight to the DOM node each animation
 * frame (zero React renders), then commit ONE `SET_RECT` on release. React
 * re-renders from the committed state to the exact same pixels.
 */
export function useWindowGestures({
  id,
  nodeRef,
  placement,
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
    let normalized = false;
    // Real movement (past click slop) gates BOTH the DOM normalization and
    // the final commit — not just the commit. If normalization ran on a
    // sub-slop jitter but the commit didn't, the node would be left with a
    // manual `transform` that React's centered-mode style never clears (it
    // only sets `left`/`top`/`marginLeft`/`marginTop`), corrupting position
    // on the next unrelated re-render. So below slop, nothing touches the
    // DOM at all; a fast real drag still commits regardless of whether a
    // paint happened to occur before release, because `moved` flips
    // synchronously in `onMove`, independent of the rAF-deferred `normalized`.
    let moved = false;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const paintFrame = () => {
      if (!normalized) {
        normalized = true;
        // Normalize CSS-centered windows to absolute coordinates (same
        // pixels, different mechanism) so the transform below is the
        // only positioner. Deferred to the first frame so a motionless
        // click never touches the DOM or converts the placement mode.
        node.style.left = "0px";
        node.style.top = "0px";
        node.style.margin = "0";
        node.style.transform = `translate3d(${start.x}px, ${start.y}px, 0)`;
      }
      onFrame(dx, dy, start);
    };
    const onMove = (ev: globalThis.PointerEvent) => {
      dx = ev.clientX - originX;
      dy = ev.clientY - originY;
      if (!moved && (Math.abs(dx) > MOVE_SLOP || Math.abs(dy) > MOVE_SLOP)) {
        moved = true;
      }
      if (!moved) return;
      if (raf === 0) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          paintFrame();
        });
      }
    };
    const finish = () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      active.current = false;
      if (moved) {
        // Paint the final sub-frame delta synchronously before committing:
        // without this, a release between rAF ticks leaves the node at the
        // last painted frame while SET_RECT commits the true final rect, and
        // if that rect happens to equal the previously stored one, React
        // skips the DOM write entirely, stranding the node mid-drag.
        paintFrame();
        onEnd(dx, dy, start);
      }
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

  return { onTitlePointerDown, onGripPointerDown };
}
