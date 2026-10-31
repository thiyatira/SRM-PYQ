/* Tiny, SSR-safe localStorage helpers. Never call these during render. */

export const NAV_KEY = "srm-pyq:nav";
export const BOOKMARKS_KEY = "srm-pyq:bookmarks";

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota: persistence is best-effort */
  }
}
