"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { SrmApiError, isAbortError, srmPost } from "@/lib/srmApi";
import LoginForm, { type AuthStep } from "./student/LoginForm";
import { AttendanceAlert, AttendancePanel, useAttendance } from "./student/AttendancePanel";
import { CalendarPanel, CoursesPanel, MarksPanel, OverviewPanel, TimetablePanel } from "./student/Panels";
import { DASH_TABS, isSessionExpired, type DashTab, type DashboardJson } from "./student/types";
import { CARD, MUTED } from "./student/ui";

/**
 * Session cookies are kept in sessionStorage only: scoped to this tab and wiped
 * when the tab closes or the user signs out. The password is never stored; it
 * lives in component state only until the login request returns.
 */
const SESSION_KEY = "srm_academia_cookies";
const LOGIN_TIMEOUT_MS = 30_000;
const FULL_LOGIN_TIMEOUT_MS = 75_000; // backend may retry after terminating other sessions
const DASHBOARD_TIMEOUT_MS = 60_000;
const LOGOUT_TIMEOUT_MS = 8_000;

const EXPIRED_MSG = "Your Academia session has expired. Please sign in again.";

type VerifyUserJson = {
  data?: { identifier?: string; digest?: string; status_code: number; message: string };
  error?: string;
};

type VerifyPasswordJson = {
  data?: {
    cookies?: string;
    statusCode?: number;
    message?: string;
    captcha?: { required: boolean; digest?: string | null };
    isConcurrentLimit?: boolean;
  };
  isAuthenticated?: boolean;
  error?: string;
};

type FullLoginJson = { cookies?: string; isAuthenticated?: boolean; error?: string };

type Notice = { kind: "error" | "info"; text: string };

const SECTION_KEYS = ["attendance", "marks", "timetable", "calendar", "userInfo", "dayOrder", "course"] as const;

/** Guarantees every section exists so panels never crash on a partial payload. */
function normalizeDashboard(raw: unknown): DashboardJson | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!SECTION_KEYS.some((k) => obj[k] && typeof obj[k] === "object")) return null;
  const out: Record<string, unknown> = {};
  for (const k of SECTION_KEYS) {
    const v = obj[k];
    out[k] = v && typeof v === "object" ? v : { status: 500, error: "No data returned" };
  }
  return out as DashboardJson;
}

function errorText(e: unknown, fallback: string): string {
  return e instanceof SrmApiError ? e.message : fallback;
}

function readStoredSession(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredSession(c: string) {
  try {
    if (c) sessionStorage.setItem(SESSION_KEY, c);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable (private mode / blocked); session just won't survive reload */
  }
}

type Op = { ctrl: AbortController };
type LoadResult = "ok" | "expired" | "error" | "stale";

export default function StudentDataSection() {
  const [step, setStep] = useState<AuthStep>("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [digest, setDigest] = useState("");
  const [cookies, setCookies] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dashboard, setDashboard] = useState<DashboardJson | null>(null);
  const [dashTab, setDashTab] = useState<DashTab>("overview");

  // The single in-flight operation. Starting a new one (or unmounting / signing out) aborts the old one,
  // and results from superseded operations are discarded.
  const opRef = useRef<Op | null>(null);

  const beginOp = useCallback((): Op => {
    opRef.current?.ctrl.abort();
    const op: Op = { ctrl: new AbortController() };
    opRef.current = op;
    setBusy(true);
    setNotice(null);
    return op;
  }, []);

  const isCurrent = useCallback((op: Op) => opRef.current === op, []);

  const endOp = useCallback((op: Op) => {
    if (opRef.current === op) {
      opRef.current = null;
      setBusy(false);
    }
  }, []);

  const cancelOp = useCallback(() => {
    opRef.current?.ctrl.abort();
    opRef.current = null;
    setBusy(false);
  }, []);

  const storeCookies = useCallback((c: string) => {
    setCookies(c);
    writeStoredSession(c);
  }, []);

  /** Wipe every piece of auth state (cookies, password, digest, data). */
  const resetAuth = useCallback(
    (next: Notice | null = null, keepUsername = false) => {
      storeCookies("");
      setPassword("");
      setIdentifier("");
      setDigest("");
      setDashboard(null);
      setDashTab("overview");
      setStep("username");
      if (!keepUsername) setUsername("");
      setNotice(next);
    },
    [storeCookies]
  );

  const fetchDashboard = useCallback(
    async (cookieStr: string, op: Op): Promise<LoadResult> => {
      try {
        const json = await srmPost<unknown>(
          "/srm/dashboard",
          { cookies: cookieStr },
          { timeoutMs: DASHBOARD_TIMEOUT_MS, signal: op.ctrl.signal }
        );
        if (!isCurrent(op)) return "stale";
        const data = normalizeDashboard(json);
        if (!data) {
          setNotice({ kind: "error", text: "The server sent an unexpected dashboard response." });
          return "error";
        }
        if (isSessionExpired(data)) {
          resetAuth({ kind: "error", text: EXPIRED_MSG }, true);
          return "expired";
        }
        setDashboard(data);
        return "ok";
      } catch (e) {
        if (isAbortError(e) || !isCurrent(op)) return "stale";
        setNotice({ kind: "error", text: errorText(e, "Failed to load your dashboard.") });
        return "error";
      }
    },
    [resetAuth, isCurrent]
  );

  // Restore a tab-scoped session on first load. Cleanup aborts anything in flight (unmount safety).
  useEffect(() => {
    const saved = readStoredSession();
    if (!saved) {
      setRestoring(false);
      return;
    }
    setCookies(saved);
    const op = beginOp();
    void fetchDashboard(saved, op).finally(() => {
      if (isCurrent(op)) setRestoring(false);
      endOp(op);
    });
    return () => {
      op.ctrl.abort();
      if (opRef.current === op) opRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelOp(), [cancelOp]);

  const onVerifyUser = async () => {
    const user = username.trim();
    if (!user) return;
    const op = beginOp();
    try {
      const json = await srmPost<VerifyUserJson>("/srm/verify-user", { username: user }, {
        timeoutMs: LOGIN_TIMEOUT_MS,
        signal: op.ctrl.signal,
      });
      if (!isCurrent(op)) return;
      if (json.error) {
        setNotice({ kind: "error", text: json.error });
        return;
      }
      const sc = json.data?.status_code;
      const id = json.data?.identifier;
      const dg = json.data?.digest;
      if ((sc !== 200 && sc !== 201) || !id || !dg) {
        setNotice({
          kind: "error",
          text: json.data?.message || "We could not find that SRM account. Check the email and try again.",
        });
        return;
      }
      setIdentifier(id);
      setDigest(dg);
      setStep("password");
    } catch (e) {
      if (!isAbortError(e) && isCurrent(op)) {
        setNotice({ kind: "error", text: errorText(e, "Could not verify the username.") });
      }
    } finally {
      endOp(op);
    }
  };

  /** Common tail for both login paths: stash cookies, drop the password, load data. */
  const completeLogin = async (sessionCookies: string, op: Op) => {
    storeCookies(sessionCookies);
    setPassword("");
    setIdentifier("");
    setDigest("");
    setDashTab("overview");
    setStep("username");
    await fetchDashboard(sessionCookies, op);
  };

  const onVerifyPassword = async () => {
    if (!password) return;
    const op = beginOp();
    try {
      const json = await srmPost<VerifyPasswordJson>(
        "/srm/verify-password",
        { identifier, digest, password },
        { timeoutMs: LOGIN_TIMEOUT_MS, signal: op.ctrl.signal }
      );
      if (!isCurrent(op)) return;
      if (json.isAuthenticated && json.data?.cookies) {
        await completeLogin(json.data.cookies, op);
        return;
      }
      if (json.error) {
        setNotice({ kind: "error", text: json.error });
        return;
      }
      if (json.data?.captcha?.required) {
        setNotice({
          kind: "error",
          text: "Academia is asking for a captcha for this account, which this app cannot complete yet. Sign in on the Academia website first, then try again.",
        });
        return;
      }
      if (json.data?.isConcurrentLimit || json.data?.statusCode === 435) {
        setNotice({
          kind: "error",
          text: "Too many active sessions on this account. Use “Sign in (terminate other sessions)” below, or sign out on your other devices.",
        });
        return;
      }
      setNotice({
        kind: "error",
        text: json.data?.message || "Sign-in failed. Check your password and try again.",
      });
    } catch (e) {
      if (!isAbortError(e) && isCurrent(op)) {
        setNotice({ kind: "error", text: errorText(e, "Sign-in failed.") });
      }
    } finally {
      endOp(op);
    }
  };

  const onFullLogin = async () => {
    if (!password) return;
    const op = beginOp();
    try {
      const json = await srmPost<FullLoginJson>(
        "/srm/full-login",
        { email: username.trim(), password },
        { timeoutMs: FULL_LOGIN_TIMEOUT_MS, signal: op.ctrl.signal }
      );
      if (!isCurrent(op)) return;
      if (json.isAuthenticated && json.cookies) {
        await completeLogin(json.cookies, op);
        return;
      }
      setNotice({ kind: "error", text: json.error || "Sign-in failed. Check your password and try again." });
    } catch (e) {
      if (!isAbortError(e) && isCurrent(op)) {
        setNotice({ kind: "error", text: errorText(e, "Sign-in failed.") });
      }
    } finally {
      endOp(op);
    }
  };

  const onRefresh = async () => {
    if (!cookies) return;
    const op = beginOp();
    try {
      await fetchDashboard(cookies, op);
    } finally {
      endOp(op);
    }
  };

  const onResume = onRefresh;

  const onLogout = async () => {
    const current = cookies;
    cancelOp(); // abort any in-flight refresh so it cannot repopulate state afterwards
    setBusy(true);
    let serverNote: Notice | null = null;
    if (current) {
      try {
        await srmPost("/srm/logout", { cookies: current }, { timeoutMs: LOGOUT_TIMEOUT_MS });
      } catch {
        serverNote = {
          kind: "info",
          text: "You were signed out on this device, but the server could not be reached to end the Academia session. It will expire on its own.",
        };
      }
    }
    resetAuth(serverNote ?? { kind: "info", text: "You have been signed out." });
    setBusy(false);
  };

  const attendanceItems = useAttendance(dashboard?.attendance?.attendance);

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = DASH_TABS.findIndex((t) => t.id === dashTab);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % DASH_TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + DASH_TABS.length) % DASH_TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = DASH_TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setDashTab(DASH_TABS[next].id);
    document.getElementById(`student-tab-${DASH_TABS[next].id}`)?.focus();
  };

  const noticeEl = (
    <div aria-live="polite" aria-atomic="true">
      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-4 text-sm whitespace-pre-wrap rounded p-3 border ${
            notice.kind === "error"
              ? "text-red-900 bg-red-50 border-red-300 dark:text-red-100 dark:bg-red-900/30 dark:border-red-800"
              : "text-blue-900 bg-blue-50 border-blue-300 dark:text-blue-100 dark:bg-blue-900/30 dark:border-blue-800"
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
        Academia (Student data)
      </h1>
      <p className={`text-center text-sm ${MUTED} mb-8 max-w-2xl mx-auto`}>
        View your attendance, marks and timetable from SRM Academia. Your password is sent only to sign in and is never
        stored. Your session lives in this browser tab and is erased when you sign out or close the tab.
      </p>

      {restoring && (
        <div className={`max-w-md mx-auto ${CARD} p-6`} role="status" aria-live="polite">
          <p className={`text-sm ${MUTED}`}>Restoring your session…</p>
        </div>
      )}

      {!restoring && !dashboard && (
        <div className={`max-w-md mx-auto ${CARD} p-6`}>
          {cookies && (
            <div className="mb-4 p-3 rounded bg-blue-50 dark:bg-blue-900/30 text-sm text-gray-900 dark:text-gray-100">
              Saved session found in this tab.{" "}
              <button
                type="button"
                className="text-blue-800 dark:text-blue-200 underline font-medium disabled:opacity-50"
                onClick={() => void onResume()}
                disabled={busy}
              >
                Load dashboard
              </button>{" "}
              or{" "}
              <button
                type="button"
                className="text-blue-800 dark:text-blue-200 underline font-medium disabled:opacity-50"
                onClick={() => {
                  cancelOp();
                  resetAuth();
                }}
                disabled={busy}
              >
                clear it
              </button>
              .
            </div>
          )}

          <LoginForm
            step={step}
            username={username}
            password={password}
            busy={busy}
            onUsername={setUsername}
            onPassword={setPassword}
            onContinue={() => void onVerifyUser()}
            onSignIn={() => void onVerifyPassword()}
            onFullLogin={() => void onFullLogin()}
            onBack={() => {
              cancelOp();
              setStep("username");
              setPassword("");
              setIdentifier("");
              setDigest("");
              setNotice(null);
            }}
          />
          {noticeEl}
        </div>
      )}

      {!restoring && dashboard && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Student data sections" className="flex flex-wrap gap-2">
              {DASH_TABS.map((t) => (
                <button
                  key={t.id}
                  id={`student-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={dashTab === t.id}
                  aria-controls={`student-panel-${t.id}`}
                  tabIndex={dashTab === t.id ? 0 : -1}
                  onClick={() => setDashTab(t.id)}
                  onKeyDown={onTabKeyDown}
                  className={`rounded px-3 py-1.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    dashTab === t.id
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onRefresh()}
                className="rounded border border-gray-400 dark:border-neutral-500 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {busy ? "Working…" : "Refresh"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onLogout()}
                className="rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-3 py-1.5 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Sign out
              </button>
            </div>
          </div>

          {noticeEl}

          <AttendanceAlert items={attendanceItems} onView={() => setDashTab("attendance")} />

          <div role="tabpanel" id={`student-panel-${dashTab}`} aria-labelledby={`student-tab-${dashTab}`} tabIndex={0}>
            {dashTab === "overview" && <OverviewPanel d={dashboard} />}
            {dashTab === "timetable" && <TimetablePanel d={dashboard} />}
            {dashTab === "attendance" && <AttendancePanel items={attendanceItems} section={dashboard.attendance} />}
            {dashTab === "marks" && <MarksPanel d={dashboard} />}
            {dashTab === "courses" && <CoursesPanel d={dashboard} />}
            {dashTab === "calendar" && <CalendarPanel d={dashboard} />}
          </div>
        </div>
      )}
    </div>
  );
}
