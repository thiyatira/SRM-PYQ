"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "darkMode";

/**
 * The initial `dark` class on <html> is set by an inline script in
 * `src/app/layout.tsx` before first paint. This hook only mirrors that class
 * (server snapshot is `false`, so hydration never mismatches) and persists
 * explicit user choices.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function useDarkMode() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setDark = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const prev = document.documentElement.classList.contains("dark");
    const next = typeof value === "function" ? value(prev) : value;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Storage may be unavailable (private mode); the theme still applies for this session.
    }
  }, []);

  return [dark, setDark] as const;
}
