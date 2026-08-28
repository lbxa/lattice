"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type DesktopIconProps = {
  /** Stable id; also the selector the pre-hydration boot stylesheet targets. */
  iconId: string;
  label: string;
  glyph: ReactNode;
  onOpen: () => void;
  /** Marquee/click selection controlled by the desktop. */
  selected?: boolean;
  /** Registers the root element for marquee hit-testing and drag measurement. */
  iconRef?: (el: HTMLButtonElement | null) => void;
  /** Free-form position once the desktop has been rearranged; see useIconDrag. */
  style?: CSSProperties;
  /** Starts a drag. A completed drag swallows the click, so onOpen won't fire. */
  onPointerDown?: (e: ReactPointerEvent<HTMLElement>) => void;
};

export function DesktopIcon({
  iconId,
  label,
  glyph,
  onOpen,
  selected = false,
  iconRef,
  style,
  onPointerDown,
}: DesktopIconProps) {
  const [flash, setFlash] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  // Single click, not double: visitors aren't OS users. The 160ms selected
  // flash keeps the desktop feel without the discoverability trap.
  const activate = () => {
    if (timer.current !== null) return;
    setFlash(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setFlash(false);
      onOpen();
    }, 160);
  };

  const highlighted = selected || flash;

  return (
    <button
      type="button"
      ref={iconRef}
      data-icon={iconId}
      onClick={activate}
      onPointerDown={onPointerDown}
      style={style}
      // `select-none` rather than preventDefault on pointerdown: it stops the
      // label being text-selected mid-drag without suppressing focus or
      // risking the click that a plain tap depends on.
      className="group pointer-events-auto flex w-20 select-none flex-col items-center gap-1 outline-none"
    >
      <span
        data-selected={highlighted || undefined}
        className="rounded-xs p-0.5 data-selected:bg-select/30"
      >
        {glyph}
      </span>
      <span
        data-selected={highlighted || undefined}
        // Two lines, then ellipsis — real project names are rarely one word,
        // and a desktop that truncates "Gabriella Cardoso" to "Gabriella C..."
        // reads as broken rather than retro. Wrapping is what every desktop
        // this borrows from actually did.
        className="max-w-full rounded-xs bg-white/85 px-1 text-center font-pixel text-[12px] text-chrome-ink break-words line-clamp-2 group-focus-visible:outline-2 group-focus-visible:outline-select data-selected:bg-select data-selected:text-white"
      >
        {label}
      </span>
    </button>
  );
}
