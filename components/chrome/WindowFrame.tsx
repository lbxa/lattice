"use client";

import {
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { MENU_BAR_H } from "@/components/desktop/geometry";
import { useWindowGestures } from "@/components/desktop/useWindowGestures";
import type { DesktopDispatch, WindowState } from "@/components/desktop/types";
import { TitleBar } from "./TitleBar";

type WindowFrameProps = {
  win: WindowState;
  title: string;
  focused: boolean;
  zIndex: number;
  gesturesEnabled: boolean;
  dispatch: DesktopDispatch;
  children: ReactNode;
};

export function WindowFrame({
  win,
  title,
  focused,
  zIndex,
  gesturesEnabled,
  dispatch,
  children,
}: WindowFrameProps) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const gestures = useWindowGestures({
    id: win.id,
    nodeRef,
    placement: win.placement,
    enabled: gesturesEnabled,
    dispatch,
  });

  // Below the 640px breakpoint gestures (and with them the collapse widget)
  // are hidden, so a window collapsed on desktop before the viewport shrank
  // must render expanded — otherwise it's stuck as full-screen empty chrome
  // with no control able to restore it.
  const effectiveCollapsed = win.collapsed && gesturesEnabled;

  // Keyboard resizing from the grip: arrows nudge by 16px (Shift: 64px);
  // the reducer clamps to min sizes and the viewport like any gesture.
  const onGripKeyDown = (e: ReactKeyboardEvent) => {
    const step = e.shiftKey ? 64 : 16;
    const delta = {
      ArrowRight: [step, 0],
      ArrowLeft: [-step, 0],
      ArrowDown: [0, step],
      ArrowUp: [0, -step],
    }[e.key];
    const node = nodeRef.current;
    if (!delta || !node) return;
    e.preventDefault();
    const r = node.getBoundingClientRect();
    dispatch({
      type: "SET_RECT",
      id: win.id,
      rect: { x: r.x, y: r.y, w: r.width + delta[0], h: r.height + delta[1] },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
  };

  const style: CSSProperties =
    win.placement.mode === "centered"
      ? {
          left: "50%",
          top: `max(42%, ${MENU_BAR_H + win.placement.size.h / 2}px)`,
          width: win.placement.size.w,
          height: effectiveCollapsed ? undefined : win.placement.size.h,
          marginLeft: -win.placement.size.w / 2,
          marginTop: -win.placement.size.h / 2,
          zIndex,
        }
      : {
          transform: `translate3d(${win.placement.rect.x}px, ${win.placement.rect.y}px, 0)`,
          width: win.placement.rect.w,
          height: effectiveCollapsed ? undefined : win.placement.rect.h,
          zIndex,
        };

  return (
    <section
      ref={nodeRef}
      role="dialog"
      aria-label={title}
      data-window-id={win.id}
      style={style}
      onPointerDown={() => dispatch({ type: "FOCUS", id: win.id })}
      className={`fixed left-0 top-0 flex flex-col rounded-[2px] border border-outline bg-chrome bevel-out ${
        focused
          ? "shadow-[2px_3px_0_rgba(15,25,46,0.35)]"
          : "shadow-[1px_2px_0_rgba(15,25,46,0.2)]"
      } max-sm:inset-x-0! max-sm:top-7! max-sm:bottom-0! max-sm:m-0! max-sm:h-auto! max-sm:w-auto! max-sm:transform-none! max-sm:rounded-none`}
    >
      <TitleBar
        title={title}
        focused={focused}
        collapsed={effectiveCollapsed}
        onClose={() => dispatch({ type: "CLOSE", id: win.id })}
        onToggleCollapse={() => dispatch({ type: "TOGGLE_COLLAPSE", id: win.id })}
        onPointerDown={gestures.onTitlePointerDown}
        onDoubleClick={
          gesturesEnabled
            ? () => dispatch({ type: "TOGGLE_COLLAPSE", id: win.id })
            : undefined
        }
      />
      {!effectiveCollapsed && (
        <div className="window-body retro-scroll relative min-h-0 flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      )}
      {!effectiveCollapsed && gesturesEnabled && (
        <button
          type="button"
          aria-label={`Resize ${title} window (arrow keys, Shift for larger steps)`}
          onPointerDown={gestures.onGripPointerDown}
          onKeyDown={onGripKeyDown}
          className="absolute bottom-0 right-0 size-4 cursor-nwse-resize touch-none border-l border-t border-outline bg-chrome bevel-out focus-visible:outline-2 focus-visible:outline-select"
        />
      )}
    </section>
  );
}
