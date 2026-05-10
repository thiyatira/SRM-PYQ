"use client";

import { useCallback, useEffect, useState } from "react";
import { srmApi } from "@/lib/srmApi";

const SESSION_KEY = "srm_academia_cookies";

type AuthStep = "username" | "password" | "done";

type VerifyUserJson = {
  data?: { identifier?: string; digest?: string; status_code: number; message: string };
  error?: string;
  errorReason?: unknown;
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
  errorReason?: unknown;
};

type DashboardJson = {
  attendance: { attendance?: unknown[]; error?: string; status: number };
  marks: { markList?: unknown[]; error?: string; status: number };
  timetable: { timetable?: { dayOrder: string; class: unknown[] }[]; error?: string; status: number };
  calendar: { calendar?: { month: string; days: unknown[] }[]; error?: string; status: number };
  userInfo: {
    userInfo?: {
      regNumber: string;
      name: string;
      mobile: string;
      section: string;
      program: string;
      department: string;
      semester: string;
      batch: string;
    };
    error?: string;
    status: number;
  };
  dayOrder: { dayOrder?: string; error?: string; status: number };
  course: { courseList?: unknown[]; batch?: string; error?: string; status: number };
};

type DashTab = "overview" | "timetable" | "attendance" | "marks" | "courses" | "calendar";

const DASH_TABS: { id: DashTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timetable", label: "Timetable" },
  { id: "attendance", label: "Attendance" },
  { id: "marks", label: "Marks" },
  { id: "courses", label: "Courses" },
  { id: "calendar", label: "Calendar" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-200 dark:border-neutral-700 py-2 last:border-0">
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 shrink-0 sm:w-40">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 break-words">{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status, error }: { status: number; error?: string }) {
  const ok = status === 200 && !error;
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded ${
        ok ? "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100" : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
      }`}
    >
      {ok ? "OK" : `HTTP ${status}${error ? `: ${error}` : ""}`}
    </span>
  );
}

export default function StudentDataSection() {
  const [step, setStep] = useState<AuthStep>("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [digest, setDigest] = useState("");
  const [cookies, setCookies] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardJson | null>(null);
  const [dashTab, setDashTab] = useState<DashTab>("overview");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) setCookies(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const persistCookies = useCallback((c: string) => {
    setCookies(c);
    try {
      if (c) sessionStorage.setItem(SESSION_KEY, c);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const clearSession = useCallback(() => {
    persistCookies("");
    setPassword("");
    setIdentifier("");
    setDigest("");
    setDashboard(null);
    setStep("username");
    setMessage(null);
  }, [persistCookies]);

  const onVerifyUser = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const res = await srmApi("/srm/verify-user", {
        method: "POST",
        body: JSON.stringify({ username: username.trim() }),
      });
      const json: VerifyUserJson = await res.json();
      if (!res.ok) {
        setMessage(json.error || "Could not verify user.");
        return;
      }
      if (json.error) {
        setMessage(json.error);
        return;
      }
      const sc = json.data?.status_code;
      const id = json.data?.identifier;
      const dg = json.data?.digest;
      if ((sc !== 200 && sc !== 201) || !id || !dg) {
        setMessage(json.data?.message || "User not found or incomplete response.");
        return;
      }
      setIdentifier(id);
      setDigest(dg);
      setStep("password");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Network error while verifying user.");
    } finally {
      setBusy(false);
    }
  };

  const loadDashboard = async (cookieStr: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await srmApi("/srm/dashboard", {
        method: "POST",
        body: JSON.stringify({ cookies: cookieStr }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || "Failed to load dashboard.");
        return;
      }
      setDashboard(json as DashboardJson);
      setDashTab("overview");
      setStep("done");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Network error while loading dashboard.");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyPassword = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const res = await srmApi("/srm/verify-password", {
        method: "POST",
        body: JSON.stringify({ identifier, digest, password }),
      });
      const json: VerifyPasswordJson = await res.json();
      if (json.error) {
        setMessage(json.error);
        return;
      }
      if (json.isAuthenticated && json.data?.cookies) {
        persistCookies(json.data.cookies);
        await loadDashboard(json.data.cookies);
        return;
      }
      const captcha = json.data?.captcha;
      if (captcha?.required) {
        setMessage("Captcha is required by Academia for this account. This app cannot complete captcha flows yet.");
        return;
      }
      if (json.data?.isConcurrentLimit || json.data?.statusCode === 435) {
        setMessage(
          json.data?.message ||
            "Concurrent session limit reached. Try “Sign in (terminate other sessions)” below, or sign out from other devices."
        );
        return;
      }
      setMessage(json.data?.message || "Authentication failed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Network error during sign-in.");
    } finally {
      setBusy(false);
    }
  };

  const onFullLogin = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const res = await srmApi("/srm/full-login", {
        method: "POST",
        body: JSON.stringify({ email: username.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setMessage(json.error || "Full login failed.");
        return;
      }
      if (json.isAuthenticated && json.cookies) {
        persistCookies(json.cookies);
        await loadDashboard(json.cookies);
        return;
      }
      setMessage(json.error || "Full login did not return a session.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Network error during full login.");
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    if (!cookies) {
      clearSession();
      return;
    }
    setBusy(true);
    try {
      await srmApi("/srm/logout", {
        method: "POST",
        body: JSON.stringify({ cookies }),
      });
    } catch {
      /* still clear locally */
    } finally {
      clearSession();
      setBusy(false);
    }
  };

  const resumeIfStored = () => {
    if (cookies) void loadDashboard(cookies);
  };

  const timetable = dashboard?.timetable?.timetable;
  const attendanceRows = dashboard?.attendance?.attendance as
    | {
        courseCode: string;
        courseTitle: string;
        courseCategory: string;
        courseFaculty: string;
        courseSlot: string;
        courseConducted: number;
        courseAbsent: number;
        courseAttendance: string;
      }[]
    | undefined;
  const markList = dashboard?.marks?.markList as
    | {
        course: string;
        category: string;
        marks: { exam: string; obtained: number; maxMark: number }[];
        total: { obtained: number; maxMark: number };
      }[]
    | undefined;
  const courseList = dashboard?.course?.courseList as
    | {
        courseCode: string;
        courseTitle: string;
        courseCredit: string;
        courseCategory: string;
        courseType: string;
        courseFaculty: string;
        courseSlot: string[];
        courseRoomNo: string;
      }[]
    | undefined;
  const calendar = dashboard?.calendar?.calendar;
  const userInfo = dashboard?.userInfo?.userInfo;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">Academia (Student data)</h1>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        Sign-in uses the{" "}
        <a
          className="text-blue-600 dark:text-blue-400 underline"
          href="https://www.npmjs.com/package/reddy-api-srm"
          target="_blank"
          rel="noreferrer"
        >
          reddy-api-srm
        </a>{" "}
        flow via the local API server (verify user, then password). Your password is not stored. Session cookies are
        kept in this browser tab only (sessionStorage) unless you clear them. Run <code className="font-mono text-xs">npm run dev:backend</code>{" "}
        (or <code className="font-mono text-xs">npm run dev:all</code>) and set{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_SRM_API_BASE</code> if the API is not on{" "}
        <code className="font-mono text-xs">http://localhost:5000</code>.
      </p>

      {!dashboard && (
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-neutral-700">
          {cookies && step !== "done" && (
            <div className="mb-4 p-3 rounded bg-blue-50 dark:bg-blue-900/20 text-sm text-gray-800 dark:text-gray-200">
              Saved session found in this tab.{" "}
              <button type="button" className="text-blue-700 dark:text-blue-300 underline font-medium" onClick={resumeIfStored} disabled={busy}>
                Load dashboard
              </button>{" "}
              or{" "}
              <button type="button" className="text-blue-700 dark:text-blue-300 underline font-medium" onClick={clearSession} disabled={busy}>
                Clear
              </button>
              .
            </div>
          )}

          {step === "username" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">SRM email / username</label>
                <input
                  className="w-full rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 px-3 py-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ab1234@srmist.edu.in"
                  autoComplete="username"
                />
              </div>
              <button
                type="button"
                disabled={busy || !username.trim()}
                onClick={() => void onVerifyUser()}
                className="w-full rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2"
              >
                {busy ? "Please wait…" : "Continue"}
              </button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Signed in as <span className="font-mono text-gray-900 dark:text-gray-100">{username.trim()}</span>
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button
                type="button"
                disabled={busy || !password}
                onClick={() => void onVerifyPassword()}
                className="w-full rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2"
              >
                {busy ? "Please wait…" : "Sign in"}
              </button>
              <button
                type="button"
                disabled={busy || !password}
                onClick={() => void onFullLogin()}
                className="w-full rounded border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-100 py-2 text-sm"
              >
                Sign in (terminate other sessions)
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep("username");
                  setMessage(null);
                  setPassword("");
                }}
                className="w-full text-sm text-gray-600 dark:text-gray-400 underline"
              >
                Use a different username
              </button>
            </div>
          )}

          {message && (
            <p className="mt-4 text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap" role="alert">
              {message}
            </p>
          )}
        </div>
      )}

      {dashboard && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {DASH_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDashTab(t.id)}
                  className={`rounded px-3 py-1.5 text-sm font-medium border ${
                    dashTab === t.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-600"
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
                onClick={() => void loadDashboard(cookies)}
                className="rounded border border-gray-300 dark:border-neutral-600 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onLogout()}
                className="rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-3 py-1.5 text-sm"
              >
                Sign out
              </button>
            </div>
          </div>

          {dashTab === "overview" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-5 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">User info</h2>
                  <StatusBadge status={dashboard.userInfo.status} error={dashboard.userInfo.error} />
                </div>
                {userInfo ? (
                  <div>
                    <Field label="Name" value={userInfo.name} />
                    <Field label="Reg. no." value={userInfo.regNumber} />
                    <Field label="Program" value={userInfo.program} />
                    <Field label="Department" value={userInfo.department} />
                    <Field label="Section" value={userInfo.section} />
                    <Field label="Semester" value={userInfo.semester} />
                    <Field label="Batch" value={userInfo.batch} />
                    <Field label="Mobile" value={userInfo.mobile} />
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{dashboard.userInfo.error || "No user info."}</p>
                )}
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-5 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Day order</h2>
                  <StatusBadge status={dashboard.dayOrder.status} error={dashboard.dayOrder.error} />
                </div>
                <p className="text-3xl font-semibold text-blue-800 dark:text-blue-300">{dashboard.dayOrder.dayOrder ?? "—"}</p>
                {dashboard.course?.batch && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Batch (courses): {dashboard.course.batch}</p>}
              </div>
            </div>
          )}

          {dashTab === "timetable" && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-5 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Timetable</h2>
                <StatusBadge status={dashboard.timetable.status} error={dashboard.timetable.error} />
              </div>
              {!timetable?.length ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No timetable data.</p>
              ) : (
                <div className="space-y-6">
                  {timetable.map((day, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Day order {day.dayOrder}
                      </h3>
                      <div className="space-y-3">
                        {(day.class as { slot: string; time: string; isClass: boolean; courseTitle?: string; courseCode?: string; courseRoomNo?: string }[]).map(
                          (slot, j) => (
                            <div
                              key={j}
                              className="rounded border border-gray-200 dark:border-neutral-700 p-3 text-sm text-gray-800 dark:text-gray-200"
                            >
                              <div className="font-medium">
                                {slot.slot} · {slot.time}
                              </div>
                              {slot.isClass ? (
                                <div className="mt-1">
                                  <div>{slot.courseTitle || slot.courseCode || "Class"}</div>
                                  {slot.courseRoomNo && <div className="text-gray-600 dark:text-gray-400">Room {slot.courseRoomNo}</div>}
                                </div>
                              ) : (
                                <div className="text-gray-500 dark:text-gray-400">No class</div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {dashTab === "attendance" && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-gray-200 dark:border-neutral-700 overflow-x-auto">
              <div className="p-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Attendance</h2>
                <StatusBadge status={dashboard.attendance.status} error={dashboard.attendance.error} />
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-900/80 text-left">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Slot</th>
                    <th className="px-3 py-2">Conducted</th>
                    <th className="px-3 py-2">Absent</th>
                    <th className="px-3 py-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows?.length ? (
                    attendanceRows.map((r, idx) => (
                      <tr key={idx} className="border-t border-gray-200 dark:border-neutral-700">
                        <td className="px-3 py-2 font-mono">{r.courseCode}</td>
                        <td className="px-3 py-2">{r.courseTitle}</td>
                        <td className="px-3 py-2">{r.courseSlot}</td>
                        <td className="px-3 py-2">{r.courseConducted}</td>
                        <td className="px-3 py-2">{r.courseAbsent}</td>
                        <td className="px-3 py-2">{r.courseAttendance}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-4 text-gray-600 dark:text-gray-400" colSpan={6}>
                        No attendance rows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {dashTab === "marks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Marks</h2>
                <StatusBadge status={dashboard.marks.status} error={dashboard.marks.error} />
              </div>
              {!markList?.length ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No marks data.</p>
              ) : (
                markList.map((c, i) => (
                  <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-gray-200 dark:border-neutral-700 p-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{c.course}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{c.category}</div>
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 dark:text-gray-400">
                          <th className="py-1">Exam</th>
                          <th className="py-1">Obtained</th>
                          <th className="py-1">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.marks.map((m, j) => (
                          <tr key={j} className="border-t border-gray-200 dark:border-neutral-700">
                            <td className="py-1">{m.exam}</td>
                            <td className="py-1">{m.obtained}</td>
                            <td className="py-1">{m.maxMark}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-gray-200 dark:border-neutral-700 font-medium">
                          <td className="py-1">Total</td>
                          <td className="py-1">{c.total.obtained}</td>
                          <td className="py-1">{c.total.maxMark}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}

          {dashTab === "courses" && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-gray-200 dark:border-neutral-700 overflow-x-auto">
              <div className="p-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Courses</h2>
                <StatusBadge status={dashboard.course.status} error={dashboard.course.error} />
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-900/80 text-left">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Faculty</th>
                    <th className="px-3 py-2">Slots</th>
                    <th className="px-3 py-2">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {courseList?.length ? (
                    courseList.map((c, idx) => (
                      <tr key={idx} className="border-t border-gray-200 dark:border-neutral-700">
                        <td className="px-3 py-2 font-mono">{c.courseCode}</td>
                        <td className="px-3 py-2">{c.courseTitle}</td>
                        <td className="px-3 py-2">{c.courseType}</td>
                        <td className="px-3 py-2">{c.courseFaculty}</td>
                        <td className="px-3 py-2">{(c.courseSlot || []).join(", ")}</td>
                        <td className="px-3 py-2">{c.courseRoomNo}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-4 text-gray-600 dark:text-gray-400" colSpan={6}>
                        No course list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {dashTab === "calendar" && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-5 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Academic calendar</h2>
                <StatusBadge status={dashboard.calendar.status} error={dashboard.calendar.error} />
              </div>
              {!calendar?.length ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No calendar data.</p>
              ) : (
                <div className="space-y-6">
                  {calendar.map((m, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{m.month}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 dark:text-gray-400">
                              <th className="py-1 pr-3">Date</th>
                              <th className="py-1 pr-3">Day</th>
                              <th className="py-1 pr-3">DO</th>
                              <th className="py-1">Event</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(m.days as { date: string; day: string; event: string; dayOrder: string }[]).map((d, j) => (
                              <tr key={j} className="border-t border-gray-200 dark:border-neutral-700 align-top">
                                <td className="py-1 pr-3 whitespace-nowrap">{d.date}</td>
                                <td className="py-1 pr-3">{d.day}</td>
                                <td className="py-1 pr-3">{d.dayOrder}</td>
                                <td className="py-1">{d.event}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
