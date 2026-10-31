/** Minimum attendance percentage required by the university. Change here only. */
export const ATTENDANCE_THRESHOLD_PCT = 75;

/** A course with this many (or fewer) spare classes is flagged as borderline. */
export const BORDERLINE_MARGIN_CLASSES = 2;

export type AttendanceState = "safe" | "borderline" | "risk" | "no-data";

export type AttendanceCalc = {
  state: AttendanceState;
  conducted: number;
  present: number;
  /** Attendance percent (0-100), or null when no classes were conducted / data invalid. */
  pct: number | null;
  /** Classes that can still be skipped while staying >= threshold (0 when below threshold). */
  canBunk: number;
  /** Consecutive classes that must be attended to reach the threshold (0 when already there). */
  needed: number;
};

function toCount(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * Pure integer-arithmetic attendance maths (no floating-point drift at the
 * threshold boundary).
 *
 *  - Needed: smallest x with (p + x) / (c + x) >= T/100
 *            => x = ceil((T*c - 100*p) / (100 - T))
 *  - Can bunk: largest x with p / (c + x) >= T/100
 *            => x = floor((100*p - T*c) / T)
 */
export function computeAttendance(
  conductedRaw: unknown,
  absentRaw: unknown,
  threshold: number = ATTENDANCE_THRESHOLD_PCT
): AttendanceCalc {
  const conducted = toCount(conductedRaw);
  const absent = toCount(absentRaw);
  if (conducted === null || absent === null || absent > conducted || conducted === 0) {
    return { state: "no-data", conducted: conducted ?? 0, present: 0, pct: null, canBunk: 0, needed: 0 };
  }

  const present = conducted - absent;
  const pct = (present / conducted) * 100;
  const t = Math.min(Math.max(threshold, 0), 100);

  const meets = present * 100 >= t * conducted;
  if (meets) {
    const canBunk = t === 0 ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor((100 * present - t * conducted) / t));
    return {
      state: canBunk <= BORDERLINE_MARGIN_CLASSES ? "borderline" : "safe",
      conducted,
      present,
      pct,
      canBunk,
      needed: 0,
    };
  }

  // Below threshold. If t === 100 it can never be recovered; report as unreachable.
  const needed = t >= 100 ? Number.POSITIVE_INFINITY : Math.ceil((t * conducted - 100 * present) / (100 - t));
  return { state: "risk", conducted, present, pct, canBunk: 0, needed };
}

export function formatPct(pct: number | null): string {
  return pct === null ? "—" : `${pct.toFixed(1)}%`;
}
