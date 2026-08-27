"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ICON_BOOT_STYLE_ID,
  clampPositions,
  moveIcons,
  clearStoredLayout,
  readStoredLayout,
  writeStoredLayout,
  type IconLayout,
  type IconPositions,
} from "./iconLayout";
import type { Point, Size, Viewport } from "./types";

// Same click-vs-drag slop as the window gestures and the marquee.
const MOVE_SLOP = 2;

/** Lifts the dragged icons over the stationary ones, as Finder does. */
const DRAG_Z = "5";

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * The desktop is prerendered, and useLayoutEffect warns when it runs during
 * server rendering. Effects never execute on the server anyway, so falling
 * back to useEffect there is purely to silence that warning.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Free-mode positioning. Every property the gesture writes by hand below is
 * also present here, so the commit re-render takes full ownership of the node
 * and a later flow-mode render clears all of them — the same hazard documented
 * at length in useWindowGestures.
 */
function freeStyle(p: Point): CSSProperties {
  return {
    position: "fixed",
    left: 0,
    top: 0,
    margin: 0,
    transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
  };
}

function pinNode(el: HTMLElement, p: Point) {
  el.style.position = "fixed";
  el.style.left = "0px";
  el.style.top = "0px";
  el.style.margin = "0";
  el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
}

type IconDragApi = {
  /** True once icons have been moved off their default column. */
  isArranged: boolean;
  /** Return every icon to the default column and forget the saved layout. */
  resetLayout: () => void;
  /** Inline style for an icon; undefined while icons are still in flow. */
  positionOf: (id: string) => CSSProperties | undefined;
  /** Attach to each icon root to start a free-form drag. */
  onIconPointerDown: (id: string) => (e: ReactPointerEvent<HTMLElement>) => void;
};

/**
 * macOS-style free-form icon dragging: icons land wherever they are dropped,
 * with no grid snapping, and a multi-selection travels together.
 *
 * Movement is written straight to the DOM each animation frame (zero React
 * renders mid-drag) and committed once on release, matching useWindowGestures.
 * The committed arrangement is mirrored into sessionStorage, so it survives a
 * reload of the tab and is gone once the tab closes.
 */
export function useIconDrag(
  enabled: boolean,
  iconEls: ReadonlyMap<string, HTMLButtonElement>,
  selected: ReadonlySet<string>,
): IconDragApi {
  const [layout, setLayout] = useState<IconLayout>({ mode: "flow" });
  const active = useRef(false);
  // A drag that ends on the icon is still followed by a `click`, which would
  // otherwise open the window. Swallowed in the capture phase so React's
  // root-level handler never sees it. Cleared on the next pointerdown rather
  // than on a timer: pointerdown always precedes click, so a drag that ended
  // off-icon (no click at all) cannot leave a listener that eats a later one.
  const pendingSwallow = useRef<{ el: HTMLElement; fn: EventListener } | null>(null);

  const clearSwallow = () => {
    const pending = pendingSwallow.current;
    if (!pending) return;
    pending.el.removeEventListener("click", pending.fn, true);
    pendingSwallow.current = null;
  };
  useEffect(() => clearSwallow, []);

  // Restore a layout saved earlier in this tab.
  //
  // Reading storage during render would desync hydration — the prerendered HTML
  // knows nothing about sessionStorage — so this waits for an effect. Pinning
  // the nodes by hand here, before the browser paints, is what stops the icons
  // flashing at their default column positions for a frame on every reload.
  // React takes ownership on the next frame; `freeStyle` writes exactly the
  // properties `pinNode` did, so that handover is seamless.
  useIsomorphicLayoutEffect(() => {
    // Drop the boot stylesheet on every path out of here. Left in place it
    // would keep positioning icons after a switch to mobile flow layout, where
    // React has deliberately removed their inline styles.
    const boot = document.getElementById(ICON_BOOT_STYLE_ID);
    if (!enabled) {
      boot?.remove();
      return;
    }
    const stored = readStoredLayout([...iconEls.keys()]);
    const size = measureIcon(iconEls);
    if (!stored || !size) {
      boot?.remove();
      return;
    }
    const positions = clampPositions(stored, size, viewport());
    // Pin first, then drop the stylesheet: the inline styles already cover
    // every property it set, so there is no frame where neither applies.
    for (const [id, el] of iconEls) {
      const p = positions[id];
      if (p) pinNode(el, p);
    }
    boot?.remove();
    const raf = requestAnimationFrame(() => setLayout({ mode: "free", positions }));
    return () => cancelAnimationFrame(raf);
  }, [enabled, iconEls]);

  // Keep a restored or dragged arrangement on screen when the window resizes.
  useEffect(() => {
    if (layout.mode !== "free") return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const size = measureIcon(iconEls);
        if (!size) return;
        setLayout((current) =>
          current.mode === "free"
            ? { mode: "free", positions: clampPositions(current.positions, size, viewport()) }
            : current,
        );
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [layout.mode, iconEls]);

  const onIconPointerDown = (id: string) => (e: ReactPointerEvent<HTMLElement>) => {
    clearSwallow();
    if (!enabled || active.current || e.button !== 0) return;
    const target = e.currentTarget;
    const size = { w: target.offsetWidth, h: target.offsetHeight };
    if (size.w === 0 || size.h === 0) return;
    active.current = true;

    // Grabbing an icon that is part of the current selection drags the whole
    // selection; grabbing an unselected one drags just that icon. Selection
    // itself is left to the click handler, so a plain click still behaves.
    const group = selected.has(id) ? [...selected] : [id];

    const pointerId = e.pointerId;
    const originX = e.clientX;
    const originY = e.clientY;
    let dx = 0;
    let dy = 0;
    let raf = 0;
    let moved = false;
    let base: IconPositions | null =
      layout.mode === "free" ? layout.positions : null;
    let live: IconPositions = base ?? {};

    // Capture is best-effort: it keeps the pointer glued to this element, but
    // the spec lets it throw when the pointer id is not active, and a throw
    // here would strand `active` and kill dragging for the rest of the page.
    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Uncaptured is fine — the window listeners below still see the drag.
    }

    const paintFrame = () => {
      if (!base) {
        // First real movement out of flow: measure every icon where it sits
        // and pin them all. Pinning only the dragged icon would drop it out of
        // the flex column and let the others slide up under the pointer.
        const snapshot: IconPositions = {};
        for (const [iconId, el] of iconEls) {
          const r = el.getBoundingClientRect();
          snapshot[iconId] = { x: r.x, y: r.y };
        }
        for (const [iconId, el] of iconEls) pinNode(el, snapshot[iconId]);
        base = snapshot;
        for (const iconId of group) {
          const el = iconEls.get(iconId);
          if (el) el.style.zIndex = DRAG_Z;
        }
      }
      live = moveIcons(base, group, dx, dy, size, viewport());
      for (const iconId of group) {
        const el = iconEls.get(iconId);
        const p = live[iconId];
        if (el && p) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }
    };

    const onMove = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      dx = ev.clientX - originX;
      dy = ev.clientY - originY;
      if (!moved && (Math.abs(dx) > MOVE_SLOP || Math.abs(dy) > MOVE_SLOP)) moved = true;
      if (!moved) return;
      if (raf === 0) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          paintFrame();
        });
      }
    };

    let done = false;
    const finish = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== pointerId || done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      target.removeEventListener("lostpointercapture", finish);
      active.current = false;
      for (const iconId of group) {
        const el = iconEls.get(iconId);
        if (el) el.style.zIndex = "";
      }
      if (!moved) return;
      // Paint the final sub-frame delta before committing, so a release
      // between animation frames cannot strand the icons mid-drag.
      paintFrame();
      setLayout({ mode: "free", positions: live });
      writeStoredLayout(live);

      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
        pendingSwallow.current = null;
      };
      target.addEventListener("click", swallow, { capture: true, once: true });
      pendingSwallow.current = { el: target, fn: swallow };
    };

    // Bound to the window rather than the icon, and backed by
    // `lostpointercapture`, so the gesture always terminates. `active` is a
    // one-way latch: a single missed release would otherwise disable icon
    // dragging permanently, with no error and no way back short of a reload.
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    target.addEventListener("lostpointercapture", finish);
  };

  return {
    isArranged: layout.mode === "free",
    resetLayout: () => {
      // Dropping back to flow makes React remove the inline styles it owns, so
      // the icons fall back into the CSS column with no extra bookkeeping.
      setLayout({ mode: "flow" });
      clearStoredLayout();
    },
    positionOf: (id) =>
      enabled && layout.mode === "free" && layout.positions[id]
        ? freeStyle(layout.positions[id])
        : undefined,
    onIconPointerDown,
  };
}

/** All desktop icons share one fixed footprint (`w-20`, single-line label). */
function measureIcon(iconEls: ReadonlyMap<string, HTMLButtonElement>): Size | null {
  for (const el of iconEls.values()) {
    if (el.offsetWidth > 0) return { w: el.offsetWidth, h: el.offsetHeight };
  }
  return null;
}
