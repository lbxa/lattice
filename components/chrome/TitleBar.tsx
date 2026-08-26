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
  "flex size-3.5 shrink-0 items-center justify-center border border-outline " +
  "bg-chrome bevel-out active:bevel-in active:bg-chrome-dark";

/** 7×7 pixel cross for the close box. */
function CrossGlyph() {
  return (
    <svg viewBox="0 0 7 7" width="7" height="7" shapeRendering="crispEdges" aria-hidden>
      <path
        fill="currentColor"
        d="M0 0h1v1H0zM6 0h1v1H6zM1 1h1v1H1zM5 1h1v1H5zM2 2h1v1H2zM4 2h1v1H4zM3 3h1v1H3zM2 4h1v1H2zM4 4h1v1H4zM1 5h1v1H1zM5 5h1v1H5zM0 6h1v1H0zM6 6h1v1H6z"
      />
    </svg>
  );
}

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
        className={`${widgetClass} text-chrome-ink`}
      >
        <CrossGlyph />
      </button>
      <button
        type="button"
        aria-label={collapsed ? "Expand window" : "Collapse window"}
        onClick={onToggleCollapse}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`${widgetClass} max-sm:hidden`}
      >
        <span className="h-px w-2 bg-chrome-ink" />
      </button>
      <span
        className={`min-w-0 flex-1 truncate bg-chrome px-1 text-center font-pixel text-[13px] ${
          focused ? "text-chrome-ink" : "text-chrome-dim"
        }`}
      >
        {title}
      </span>
      {/* Mirrors the button group's width so the title stays optically centered
          (one 14px widget on mobile, two plus the 6px gap on larger screens). */}
      <span aria-hidden className="w-[34px] shrink-0 max-sm:w-3.5" />
    </header>
  );
}
