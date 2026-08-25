"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DesktopIconProps = {
  label: string;
  glyph: ReactNode;
  onOpen: () => void;
};

export function DesktopIcon({ label, glyph, onOpen }: DesktopIconProps) {
  const [selected, setSelected] = useState(false);
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
    setSelected(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setSelected(false);
      onOpen();
    }, 160);
  };

  return (
    <button
      type="button"
      onClick={activate}
      className="group flex w-20 flex-col items-center gap-1 outline-none"
    >
      <span
        data-selected={selected || undefined}
        className="rounded-xs p-0.5 data-selected:bg-select/30"
      >
        {glyph}
      </span>
      <span
        data-selected={selected || undefined}
        className="max-w-full truncate rounded-xs bg-white/85 px-1 font-pixel text-[12px] text-chrome-ink group-focus-visible:outline-2 group-focus-visible:outline-select data-selected:bg-select data-selected:text-white"
      >
        {label}
      </span>
    </button>
  );
}
