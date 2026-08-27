"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { dragRect, rectsIntersect } from "./geometry";

// Same click-vs-drag slop as the window gestures.
const MOVE_SLOP = 2;

type MarqueeApi = {
  /** Icon ids currently selected (marquee or click). */
  selected: ReadonlySet<string>;
  /** Attach to the rubber-band rectangle element. */
  marqueeRef: RefObject<HTMLDivElement | null>;
  /** Attach to the desktop root; starts a marquee on empty-background drags. */
  onBackgroundPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  /** Replace the selection with a single icon (click behavior). */
  selectOnly: (id: string) => void;
};

/**
 * macOS-style rubber-band selection: dragging on the empty desktop draws a
 * translucent rectangle and live-selects every icon it touches; a plain
 * click on the background clears the selection, which otherwise persists
 * after release. The rectangle is drawn with direct DOM writes per animation
 * frame (like the window gestures); React state changes only when the set of
 * selected icons actually changes.
 */
export function useMarquee(
  enabled: boolean,
  iconEls: ReadonlyMap<string, HTMLButtonElement>,
): MarqueeApi {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const active = useRef(false);

  // Escape clears the selection, matching Finder.
  useEffect(() => {
    if (selected.size === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const onBackgroundPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || active.current || e.button !== 0) return;
    // Reject anything rendered through a React portal — context menus, and any
    // overlay added later. React dispatches portal events through the React
    // tree, so a press inside a menu that lives at document.body still reaches
    // this handler as if it were a press on the bare desktop. Left unguarded,
    // the marquee below captures the pointer and the menu item never sees its
    // own pointerup, so the click silently does nothing. DOM containment is
    // the check that holds for every portal, present and future; matching on
    // selectors only ever catches the ones already known about.
    if (!e.currentTarget.contains(e.target as Node)) return;
    // Only the bare desktop starts a marquee — not windows, icons, or menus.
    if ((e.target as HTMLElement).closest("[data-window-id], button, nav, a")) {
      return;
    }
    active.current = true;
    e.preventDefault();
    // Pressing the bare background deselects immediately, as in Finder.
    setSelected(new Set());

    const originX = e.clientX;
    const originY = e.clientY;
    let lastX = originX;
    let lastY = originY;
    let raf = 0;
    let started = false;
    let current = new Set<string>();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const paintFrame = () => {
      const box = marqueeRef.current;
      if (!box) return;
      const r = dragRect(originX, originY, lastX, lastY);
      box.style.display = "block";
      box.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
      box.style.width = `${r.w}px`;
      box.style.height = `${r.h}px`;

      const next = new Set<string>();
      for (const [id, el] of iconEls) {
        const b = el.getBoundingClientRect();
        if (rectsIntersect(r, { x: b.x, y: b.y, w: b.width, h: b.height })) {
          next.add(id);
        }
      }
      if (next.size !== current.size || [...next].some((id) => !current.has(id))) {
        current = next;
        setSelected(next);
      }
    };

    const onMove = (ev: globalThis.PointerEvent) => {
      lastX = ev.clientX;
      lastY = ev.clientY;
      if (!started && (Math.abs(lastX - originX) > MOVE_SLOP || Math.abs(lastY - originY) > MOVE_SLOP)) {
        started = true;
      }
      if (!started) return;
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
      if (marqueeRef.current) marqueeRef.current.style.display = "none";
      // The selection itself persists after release.
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
  };

  return {
    selected,
    marqueeRef,
    onBackgroundPointerDown,
    selectOnly: (id: string) => setSelected(new Set([id])),
  };
}
