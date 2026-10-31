import { useMemo } from "react";
import { ATTENDANCE_THRESHOLD_PCT, computeAttendance, formatPct, type AttendanceCalc } from "@/lib/attendance";
import type { AttendanceRow, SectionStatus } from "./types";
import { CARD, EmptyState, MUTED, SectionHeader, TH } from "./ui";

type Computed = { row: AttendanceRow; calc: AttendanceCalc };

export function useAttendance(rows: AttendanceRow[] | undefined): Computed[] {
  return useMemo(
    () => (rows ?? []).map((row) => ({ row, calc: computeAttendance(row.courseConducted, row.courseAbsent) })),
    [rows]
  );
}

function fmtCount(n: number): string {
  return Number.isFinite(n) ? String(n) : "∞";
}

const STATE_STYLE: Record<AttendanceCalc["state"], string> = {
  safe: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100",
  borderline: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  risk: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100",
  "no-data": "bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-100",
};

function Verdict({ calc }: { calc: AttendanceCalc }) {
  let text: string;
  if (calc.state === "no-data") text = "No classes yet";
  else if (calc.state === "risk") text = `Attend next ${fmtCount(calc.needed)} class${calc.needed === 1 ? "" : "es"}`;
  else text = `Can skip ${fmtCount(calc.canBunk)} class${calc.canBunk === 1 ? "" : "es"}`;
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${STATE_STYLE[calc.state]}`}>{text}</span>;
}

/** Compact "attendance at risk" banner shown above the dashboard tabs. */
export function AttendanceAlert({ items, onView }: { items: Computed[]; onView: () => void }) {
  const risk = items.filter((i) => i.calc.state === "risk");
  const borderline = items.filter((i) => i.calc.state === "borderline");
  if (!items.length) return null;

  if (!risk.length && !borderline.length) {
    return (
      <div className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-900 dark:text-green-100">
        All {items.length} course{items.length === 1 ? "" : "s"} are at or above {ATTENDANCE_THRESHOLD_PCT}% attendance.
      </div>
    );
  }
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        risk.length
          ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100"
          : "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100"
      }`}
    >
      <p className="font-semibold">
        {risk.length
          ? `${risk.length} course${risk.length === 1 ? "" : "s"} below ${ATTENDANCE_THRESHOLD_PCT}% attendance`
          : `${borderline.length} course${borderline.length === 1 ? "" : "s"} close to the ${ATTENDANCE_THRESHOLD_PCT}% limit`}
      </p>
      <ul className="mt-1 list-disc pl-5">
        {[...risk, ...borderline].slice(0, 6).map(({ row, calc }) => (
          <li key={`${row.courseCode}-${row.courseSlot}`}>
            {row.courseTitle || row.courseCode} ({formatPct(calc.pct)}):{" "}
            {calc.state === "risk"
              ? `attend the next ${fmtCount(calc.needed)} class${calc.needed === 1 ? "" : "es"} to recover`
              : `only ${fmtCount(calc.canBunk)} spare class${calc.canBunk === 1 ? "" : "es"}`}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onView} className="mt-2 underline font-medium">
        View attendance details
      </button>
    </div>
  );
}

export function AttendancePanel({ items, section }: { items: Computed[]; section: SectionStatus }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="p-5 pb-0">
        <SectionHeader title="Attendance" section={section} />
        <p className={`text-xs ${MUTED}`}>
          Minimum required: {ATTENDANCE_THRESHOLD_PCT}%. &quot;Can skip&quot; is how many upcoming classes you can miss and
          stay at or above the limit; &quot;Attend next&quot; is how many in a row you need to get back to it.
        </p>
      </div>
      {!items.length ? (
        <div className="p-5">
          <EmptyState>No attendance data available yet.</EmptyState>
        </div>
      ) : (
        <div className="overflow-x-auto mt-3">
          <table className="min-w-full text-sm text-gray-900 dark:text-gray-100">
            <caption className="sr-only">Attendance by course</caption>
            <thead className="bg-gray-50 dark:bg-neutral-900/80 text-left">
              <tr>
                <th scope="col" className={TH}>Code</th>
                <th scope="col" className={TH}>Title</th>
                <th scope="col" className={TH}>Slot</th>
                <th scope="col" className={TH}>Conducted</th>
                <th scope="col" className={TH}>Absent</th>
                <th scope="col" className={TH}>%</th>
                <th scope="col" className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ row, calc }, idx) => (
                <tr key={`${row.courseCode}-${row.courseSlot}-${idx}`} className="border-t border-gray-200 dark:border-neutral-700">
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{row.courseCode}</td>
                  <td className="px-3 py-2 min-w-[12rem]">{row.courseTitle}</td>
                  <td className="px-3 py-2">{row.courseSlot}</td>
                  <td className="px-3 py-2">{row.courseConducted}</td>
                  <td className="px-3 py-2">{row.courseAbsent}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{calc.pct === null ? row.courseAttendance || "—" : formatPct(calc.pct)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Verdict calc={calc} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
