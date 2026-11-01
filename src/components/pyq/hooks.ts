"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCatalogue } from "@/lib/pyq/CatalogueContext";
import { loadSubject, type SubjectData } from "@/lib/pyq/loader";
import { BOOKMARKS_KEY, readJson, writeJson } from "@/lib/pyq/storage";

/** Returns `value` after it has stopped changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Calls `onOutside` when a mousedown/focusin happens outside `ref` while `active`. */
export function useOutsideDismiss(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
  onOutside: () => void
) {
  const cb = useRef(onOutside);
  useEffect(() => {
    cb.current = onOutside;
  });
  useEffect(() => {
    if (!active) return;
    const handler = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("focusin", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("focusin", handler);
    };
  }, [ref, active]);
}

export type SubjectState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: SubjectData };

/**
 * Loads all papers of a subject. Late results from a previous subject (or a
 * previous retry) are ignored: each run owns an AbortController and the
 * result is keyed to the request that produced it.
 */
export function useSubjectData(code: string | null): {
  state: SubjectState;
  retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: SubjectData;
    error?: string;
  } | null>(null);

  const subject = useCatalogue().getSubject(code);
  const hasFiles = !!subject && subject.files.length > 0;
  const key = hasFiles ? `${code}#${attempt}` : null;

  useEffect(() => {
    if (!subject || !key || subject.files.length === 0) return;
    const ctrl = new AbortController();
    loadSubject(subject, ctrl.signal, attempt > 0).then(
      (data) => {
        if (!ctrl.signal.aborted) setResult({ key, data });
      },
      (err: unknown) => {
        if (ctrl.signal.aborted) return;
        setResult({ key, error: err instanceof Error ? err.message : "Failed to load" });
      }
    );
    return () => ctrl.abort();
  }, [subject, key, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  let state: SubjectState;
  if (!key) state = { status: "idle" };
  else if (!result || result.key !== key) state = { status: "loading" };
  else if (result.data) {
    state =
      result.data.questions.length === 0 && result.data.failed.length === result.data.totalFiles
        ? { status: "error", message: "None of the question papers could be loaded." }
        : { status: "ready", data: result.data };
  } else state = { status: "error", message: result.error ?? "Failed to load" };

  return { state, retry };
}

/** Starred questions, persisted in localStorage (read after mount to avoid hydration mismatch). */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<ReadonlySet<string>>(() => new Set());
  const latest = useRef(bookmarks);

  useEffect(() => {
    const load = () => {
      const next = new Set(readJson<string[]>(BOOKMARKS_KEY, []));
      latest.current = next;
      setBookmarks(next);
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === BOOKMARKS_KEY || e.key === null) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((key: string) => {
    const next = new Set(latest.current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    latest.current = next;
    setBookmarks(next);
    writeJson(BOOKMARKS_KEY, Array.from(next));
  }, []);

  return { bookmarks, toggle };
}

/** `true` for ~`ms` after `flash()` is called; used for "Copied!" feedback. */
export function useFlag(ms = 1800) {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const flash = useCallback(() => {
    setOn(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  return [on, flash] as const;
}
