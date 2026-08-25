import { cascadeRect, clampRect, windowId } from "./geometry";
import type { DesktopAction, DesktopState, Size, WindowState } from "./types";

export function initialDesktopState(): DesktopState {
  const welcome: WindowState = {
    id: "welcome",
    kind: "welcome",
    placement: { mode: "centered", size: { w: 400, h: 320 } },
    collapsed: false,
  };
  return { windows: { welcome }, order: ["welcome"] };
}

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case "OPEN": {
      const id = windowId(action.kind, action.projectId);
      if (state.windows[id]) return focusWindow(state, id);
      const win: WindowState = {
        id,
        kind: action.kind,
        projectId: action.projectId,
        placement: {
          mode: "rect",
          rect: cascadeRect(action.size, action.viewport, state.order.length),
        },
        collapsed: false,
      };
      return { windows: { ...state.windows, [id]: win }, order: [...state.order, id] };
    }
    case "CLOSE": {
      if (!state.windows[action.id]) return state;
      const windows = { ...state.windows };
      delete windows[action.id];
      return { windows, order: state.order.filter((id) => id !== action.id) };
    }
    case "CLOSE_ALL":
      return { windows: {}, order: [] };
    case "FOCUS":
      return focusWindow(state, action.id);
    case "SET_RECT": {
      const win = state.windows[action.id];
      if (!win) return state;
      return updateWindow(state, {
        ...win,
        placement: { mode: "rect", rect: clampRect(action.rect, action.viewport) },
      });
    }
    case "TOGGLE_COLLAPSE": {
      const win = state.windows[action.id];
      if (!win) return state;
      return updateWindow(state, { ...win, collapsed: !win.collapsed });
    }
    case "CLEAN_UP": {
      let next = state;
      state.order.forEach((id, index) => {
        const win = next.windows[id];
        next = updateWindow(next, {
          ...win,
          placement: { mode: "rect", rect: cascadeRect(sizeOf(win), action.viewport, index) },
        });
      });
      return next;
    }
    case "CLAMP_ALL": {
      let next = state;
      for (const id of state.order) {
        const win = next.windows[id];
        if (win.placement.mode !== "rect") continue;
        next = updateWindow(next, {
          ...win,
          placement: { mode: "rect", rect: clampRect(win.placement.rect, action.viewport) },
        });
      }
      return next;
    }
  }
}

function focusWindow(state: DesktopState, id: string): DesktopState {
  if (!state.windows[id] || state.order[state.order.length - 1] === id) return state;
  return { ...state, order: [...state.order.filter((w) => w !== id), id] };
}

function updateWindow(state: DesktopState, win: WindowState): DesktopState {
  return { ...state, windows: { ...state.windows, [win.id]: win } };
}

function sizeOf(win: WindowState): Size {
  return win.placement.mode === "centered"
    ? win.placement.size
    : { w: win.placement.rect.w, h: win.placement.rect.h };
}
