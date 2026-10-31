/**
 * Client for the standalone SRM API (Express). Set in `.env.local`:
 * NEXT_PUBLIC_SRM_API_BASE=http://localhost:5000
 */

export const DEFAULT_TIMEOUT_MS = 20_000;

export function getSrmApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SRM_API_BASE?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000";
  }
  return "";
}

export type SrmApiErrorKind =
  | "config" // no API base configured
  | "network" // backend unreachable / CORS / DNS
  | "timeout" // request took too long
  | "aborted" // caller cancelled (tab switch, unmount, logout)
  | "http" // backend answered with a non-2xx status
  | "parse"; // backend answered with something that is not JSON

export class SrmApiError extends Error {
  readonly kind: SrmApiErrorKind;
  readonly status?: number;

  constructor(kind: SrmApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "SrmApiError";
    this.kind = kind;
    this.status = status;
  }
}

export function isAbortError(e: unknown): boolean {
  return e instanceof SrmApiError && e.kind === "aborted";
}

export type SrmApiInit = RequestInit & {
  /** Abort the request after this many milliseconds (default 20s). */
  timeoutMs?: number;
};

/**
 * Low-level fetch against the SRM backend with a timeout. Throws `SrmApiError`
 * for config / network / timeout / aborted failures. Never logs request bodies
 * (which may contain credentials).
 */
export async function srmApi(path: string, init: SrmApiInit = {}): Promise<Response> {
  const base = getSrmApiBase();
  if (!base) {
    throw new SrmApiError(
      "config",
      "Missing API base URL. Set NEXT_PUBLIC_SRM_API_BASE to your backend origin (e.g. http://localhost:5000)."
    );
  }
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...rest } = init;
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(rest.headers);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", onCallerAbort, { once: true });
  }

  try {
    return await fetch(url, {
      ...rest,
      headers,
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
  } catch (e) {
    if (timedOut) {
      throw new SrmApiError("timeout", "The server took too long to respond. Please try again.");
    }
    if (callerSignal?.aborted || (e instanceof DOMException && e.name === "AbortError")) {
      throw new SrmApiError("aborted", "Request cancelled.");
    }
    throw new SrmApiError(
      "network",
      "Cannot reach the SRM API server. Check that the backend is running and your connection is working."
    );
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", onCallerAbort);
  }
}

/**
 * POST a JSON body and return the parsed JSON response. Throws `SrmApiError`
 * with a user-presentable message for non-JSON responses and non-2xx statuses
 * (using the backend's `error` field when present).
 */
export async function srmPost<T>(
  path: string,
  body: unknown,
  opts: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const res = await srmApi(path, {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new SrmApiError(
      res.ok ? "parse" : "http",
      res.ok
        ? "The server sent an unexpected response."
        : `The server returned an error (HTTP ${res.status}).`,
      res.status
    );
  }

  if (!res.ok) {
    const backendMsg =
      json && typeof json === "object" && typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : "";
    throw new SrmApiError(
      "http",
      backendMsg || `The server returned an error (HTTP ${res.status}).`,
      res.status
    );
  }
  return json as T;
}
