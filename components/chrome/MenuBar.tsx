"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MarkGlyph } from "./glyphs";

type MenuItemSpec = { label: string; disabled?: boolean; onSelect: () => void };

type MenuSpec = {
  id: string;
  label: ReactNode;
  ariaLabel: string;
  hideOnMobile?: boolean;
  items: MenuItemSpec[];
};

type MenuBarProps = {
  siteName: string;
  hasWindows: boolean;
  onAbout: () => void;
  onCloseTop: () => void;
  onCloseAll: () => void;
  onCleanUp: () => void;
};

export function MenuBar({
  siteName,
  hasWindows,
  onAbout,
  onCloseTop,
  onCloseAll,
  onCleanUp,
}: MenuBarProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (openId === null) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  const menus: MenuSpec[] = [
    {
      id: "mark",
      label: <MarkGlyph />,
      ariaLabel: siteName,
      items: [{ label: "About this site…", onSelect: onAbout }],
    },
    {
      id: "file",
      label: "File",
      ariaLabel: "File",
      hideOnMobile: true,
      items: [
        { label: "Close Window", disabled: !hasWindows, onSelect: onCloseTop },
        { label: "Close All", disabled: !hasWindows, onSelect: onCloseAll },
      ],
    },
    {
      id: "view",
      label: "View",
      ariaLabel: "View",
      hideOnMobile: true,
      items: [
        { label: "Clean Up Windows", disabled: !hasWindows, onSelect: onCleanUp },
      ],
    },
  ];

  return (
    <nav
      ref={rootRef}
      className="fixed inset-x-0 top-0 z-[1000] flex h-7 select-none items-stretch border-b border-outline bg-chrome bevel-out px-1 font-pixel text-[13px]"
    >
      {menus.map((menu) => (
        <div
          key={menu.id}
          className={`relative ${menu.hideOnMobile ? "max-sm:hidden" : ""}`}
        >
          <button
            type="button"
            aria-label={menu.ariaLabel}
            aria-expanded={openId === menu.id}
            onClick={() => setOpenId(openId === menu.id ? null : menu.id)}
            onPointerEnter={() => {
              if (openId !== null) setOpenId(menu.id);
            }}
            className={`flex h-full items-center px-3 ${
              openId === menu.id ? "bg-select text-white" : "text-chrome-ink"
            }`}
          >
            {menu.label}
          </button>
          {openId === menu.id && (
            <ul className="absolute left-0 top-full min-w-44 border border-outline bg-chrome bevel-out py-1 shadow-[2px_3px_0_rgba(15,25,46,0.35)]">
              {menu.items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpenId(null);
                      item.onSelect();
                    }}
                    className="block w-full px-4 py-1 text-left text-chrome-ink enabled:hover:bg-select enabled:hover:text-white disabled:text-chrome-dim"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <span className="ml-auto flex items-center pr-2 text-chrome-ink">
        <Clock />
      </span>
    </nav>
  );
}

function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return <time suppressHydrationWarning>{time}</time>;
}
