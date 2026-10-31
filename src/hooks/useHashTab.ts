"use client";

import { useCallback, useSyncExternalStore } from "react";

export type AppTab = "pyq" | "student";

const DEFAULT_TAB: AppTab = "pyq";
const listeners = new Set<() => void>();

function parse(hash: string): AppTab {
  return hash === "#student" ? "student" : DEFAULT_TAB;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

const getSnapshot = () => parse(window.location.hash);
// Server (and the hydration pass) always render the default tab, then React
// re-renders with the real hash, so there is no hydration mismatch.
const getServerSnapshot = (): AppTab => DEFAULT_TAB;

/** Active tab persisted in the URL hash (#pyq / #student). */
export function useHashTab() {
  const tab = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTab = useCallback((next: AppTab) => {
    if (parse(window.location.hash) === next && window.location.hash === `#${next}`) return;
    window.history.pushState(null, "", `#${next}`);
    listeners.forEach((l) => l());
  }, []);

  return [tab, setTab] as const;
}
