"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_QUERY as QUERY } from "./geometry";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false, // SSR: assume desktop; CSS handles the visual either way
  );
}
