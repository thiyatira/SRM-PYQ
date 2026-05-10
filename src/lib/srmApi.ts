/**
 * Base URL for the standalone SRM API (Express). Set in `.env.local`:
 * NEXT_PUBLIC_SRM_API_BASE=http://localhost:5000
 */
export function getSrmApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SRM_API_BASE?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000";
  }
  return "";
}

export async function srmApi(path: string, init?: RequestInit): Promise<Response> {
  const base = getSrmApiBase();
  if (!base) {
    throw new Error(
      "Missing API base URL. Set NEXT_PUBLIC_SRM_API_BASE to your backend origin (e.g. http://localhost:5000)."
    );
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers });
}
