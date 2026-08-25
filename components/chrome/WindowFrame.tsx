"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
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
    collapsed: win.collapsed,
    enabled: gesturesEnabled,
    dispatch,
  });

  const style: CSSProperties =
    win.placement.mode === "centered"
      ? {
          left: "50%",
          top: "42%",
          width: win.placement.size.w,
          height: win.collapsed ? undefined : win.placement.size.h,
          marginLeft: -win.placement.size.w / 2,
          marginTop: -win.placement.size.h / 2,
          zIndex,
        }
      : {
          transform: `translate3d(${win.placement.rect.x}px, ${win.placement.rect.y}px, 0)`,
          width: win.placement.rect.w,
          height: win.collapsed ? undefined : win.placement.rect.h,
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
        collapsed={win.collapsed}
        onClose={() => dispatch({ type: "CLOSE", id: win.id })}
        onToggleCollapse={() => dispatch({ type: "TOGGLE_COLLAPSE", id: win.id })}
        onPointerDown={gestures.onTitlePointerDown}
        onDoubleClick={
          gesturesEnabled
            ? () => dispatch({ type: "TOGGLE_COLLAPSE", id: win.id })
            : undefined
        }
      />
      {!win.collapsed && (
        <div className="window-body retro-scroll relative min-h-0 flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      )}
      {!win.collapsed && gesturesEnabled && (
        <button
          type="button"
          aria-label="Resize window"
          onPointerDown={gestures.onGripPointerDown}
          className="absolute bottom-0 right-0 size-4 cursor-nwse-resize touch-none border-l border-t border-outline bg-chrome bevel-out"
        />
      )}
    </section>
  );
}
