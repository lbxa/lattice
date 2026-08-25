"use client";

import type { MouseEventHandler, PointerEventHandler } from "react";

type TitleBarProps = {
  title: string;
  focused: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onDoubleClick?: MouseEventHandler<HTMLElement>;
};

const widgetClass =
  "size-3.5 shrink-0 border border-outline bg-chrome bevel-out " +
  "active:bevel-in active:bg-chrome-dark";

export function TitleBar({
  title,
  focused,
  collapsed,
  onClose,
  onToggleCollapse,
  onPointerDown,
  onDoubleClick,
}: TitleBarProps) {
  return (
    <header
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={`relative flex h-6 shrink-0 touch-none select-none items-center gap-1.5 bg-chrome px-1.5 ${
        focused ? "pinstripes" : ""
      } ${collapsed ? "" : "border-b border-outline"}`}
    >
      <button
        type="button"
        aria-label="Close window"
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={widgetClass}
      />
      <span
        className={`min-w-0 flex-1 truncate bg-chrome px-1 text-center font-pixel text-[13px] ${
          focused ? "text-chrome-ink" : "text-chrome-dim"
        }`}
      >
        {title}
      </span>
      <button
        type="button"
        aria-label={collapsed ? "Expand window" : "Collapse window"}
        onClick={onToggleCollapse}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`${widgetClass} flex items-center justify-center max-sm:hidden`}
      >
        <span className="h-px w-2 bg-chrome-ink" />
      </button>
    </header>
  );
}
