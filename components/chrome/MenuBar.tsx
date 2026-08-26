"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { useIsMobile } from "@/components/desktop/useIsMobile";
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

const focusRing =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-select";

function enabledItems(root: HTMLElement | null): HTMLButtonElement[] {
  return Array.from(
    root?.querySelectorAll<HTMLButtonElement>(
      '[role="menu"] [role="menuitem"]:not([disabled])',
    ) ?? [],
  );
}

export function MenuBar({
  siteName,
  hasWindows,
  onAbout,
  onCloseTop,
  onCloseAll,
  onCleanUp,
}: MenuBarProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Roving tabindex: the menubar is one Tab stop; arrows move within it.
  const [tabStop, setTabStop] = useState(0);
  const isMobile = useIsMobile();
  const rootRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

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


  /** Focus the nearest visible trigger in `dir` from `from`; returns its index. */
  const moveTrigger = (from: number, dir: 1 | -1) => {
    const n = menus.length;
    for (let step = 1; step <= n; step++) {
      const i = (from + dir * step + n * n) % n;
      const el = triggerRefs.current[i];
      if (el && el.offsetParent !== null) {
        setTabStop(i);
        el.focus();
        return i;
      }
    }
    return from;
  };

  // Opening with keyboard intent focuses into the dropdown. flushSync mounts
  // it synchronously so the focus move can never race a queued keystroke;
  // with every item disabled, focus deliberately stays on the trigger.
  const openWithFocus = (id: string, target: "first" | "last") => {
    flushSync(() => setOpenId(id));
    const items = enabledItems(rootRef.current);
    (target === "first" ? items[0] : items[items.length - 1])?.focus();
  };

  const onTriggerKeyDown = (e: ReactKeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = moveTrigger(index, e.key === "ArrowRight" ? 1 : -1);
      if (openId !== null) setOpenId(menus[next].id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      openWithFocus(menus[index].id, "first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openWithFocus(menus[index].id, "last");
    } else if (e.key === "Enter" || e.key === " ") {
      // Explicit keyboard activation (the native click's detail flag is not
      // reliable): toggle, and focus into the menu when opening.
      e.preventDefault();
      if (openId === menus[index].id) setOpenId(null);
      else openWithFocus(menus[index].id, "first");
    } else if (e.key === "Tab") {
      setOpenId(null);
    }
  };

  const onItemKeyDown = (e: ReactKeyboardEvent, menuIndex: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = enabledItems(rootRef.current);
      const at = items.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const items = enabledItems(rootRef.current);
      (e.key === "Home" ? items[0] : items[items.length - 1])?.focus();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = moveTrigger(menuIndex, e.key === "ArrowRight" ? 1 : -1);
      openWithFocus(menus[next].id, "first");
    } else if (e.key === "Enter" || e.key === " ") {
      // Route activation through one deterministic path (the button's own
      // click handler) instead of native keyboard activation.
      e.preventDefault();
      (e.currentTarget as HTMLButtonElement).click();
    } else if (e.key === "Escape") {
      setOpenId(null);
      triggerRefs.current[menuIndex]?.focus();
    } else if (e.key === "Tab") {
      setOpenId(null);
    }
  };

  // Tab-away (or any focus loss out of the bar) closes the open dropdown.
  const onBlur = (e: FocusEvent) => {
    if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpenId(null);
  };

  const effectiveTabStop = isMobile ? 0 : tabStop;

  return (
    <nav
      ref={rootRef}
      onBlur={onBlur}
      aria-label="Menu bar"
      className="fixed inset-x-0 top-0 z-[1000] flex h-7 select-none items-stretch border-b border-outline bg-chrome bevel-out px-1 font-pixel text-[13px]"
    >
      <div role="menubar" aria-label={siteName} className="flex items-stretch">
        {menus.map((menu, index) => (
          <div
            key={menu.id}
            role="none"
            className={`relative ${menu.hideOnMobile ? "max-sm:hidden" : ""}`}
          >
            <button
              type="button"
              ref={(el) => {
                triggerRefs.current[index] = el;
              }}
              role="menuitem"
              aria-label={menu.ariaLabel}
              aria-haspopup="menu"
              aria-expanded={openId === menu.id}
              tabIndex={index === effectiveTabStop ? 0 : -1}
              onClick={() => {
                setTabStop(index);
                setOpenId(openId === menu.id ? null : menu.id);
              }}
              onKeyDown={(e) => onTriggerKeyDown(e, index)}
              onPointerEnter={() => {
                if (openId !== null) setOpenId(menu.id);
              }}
              className={`flex h-full items-center px-3 ${focusRing} ${
                openId === menu.id ? "bg-select text-white" : "text-chrome-ink"
              }`}
            >
              {menu.label}
            </button>
            {openId === menu.id && (
              <ul
                role="menu"
                aria-label={menu.ariaLabel}
                className="absolute left-0 top-full min-w-44 border border-outline bg-chrome bevel-out py-1 shadow-[2px_3px_0_rgba(15,25,46,0.35)]"
              >
                {menu.items.map((item) => (
                  <li key={item.label} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      tabIndex={-1}
                      onClick={() => {
                        setOpenId(null);
                        // Keep the roving tab stop in sync: the menu may have
                        // been reached by hover-slide from another trigger.
                        setTabStop(index);
                        triggerRefs.current[index]?.focus();
                        item.onSelect();
                      }}
                      onKeyDown={(e) => onItemKeyDown(e, index)}
                      className={`block w-full px-4 py-1 text-left text-chrome-ink enabled:hover:bg-select enabled:hover:text-white disabled:text-chrome-dim ${focusRing}`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
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

  return (
    <time suppressHydrationWarning className="inline-block min-w-[7ch] text-right">
      {time}
    </time>
  );
}
