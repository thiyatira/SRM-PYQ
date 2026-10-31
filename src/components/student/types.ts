export type SectionStatus = { status: number; error?: string };

export type AttendanceRow = {
  courseCode: string;
  courseTitle: string;
  courseCategory?: string;
  courseFaculty?: string;
  courseSlot: string;
  courseConducted: number;
  courseAbsent: number;
  courseAttendance: string;
};

export type MarkCourse = {
  course: string;
  category: string;
  marks: { exam: string; obtained: number; maxMark: number }[];
  total: { obtained: number; maxMark: number };
};

export type CourseRow = {
  courseCode: string;
  courseTitle: string;
  courseCredit?: string;
  courseCategory?: string;
  courseType: string;
  courseFaculty: string;
  courseSlot: string[];
  courseRoomNo: string;
};

export type TimetableSlot = {
  slot: string;
  time: string;
  isClass: boolean;
  courseTitle?: string;
  courseCode?: string;
  courseRoomNo?: string;
};

export type TimetableDay = { dayOrder: string; class: TimetableSlot[] };

export type CalendarDay = { date: string; day: string; event: string; dayOrder: string };
export type CalendarMonth = { month: string; days: CalendarDay[] };

export type UserInfo = {
  regNumber: string;
  name: string;
  mobile: string;
  section: string;
  program: string;
  department: string;
  semester: string;
  batch: string;
};

export type DashboardJson = {
  attendance: SectionStatus & { attendance?: AttendanceRow[] };
  marks: SectionStatus & { markList?: MarkCourse[] };
  timetable: SectionStatus & { timetable?: TimetableDay[] };
  calendar: SectionStatus & { calendar?: CalendarMonth[] };
  userInfo: SectionStatus & { userInfo?: UserInfo };
  dayOrder: SectionStatus & { dayOrder?: string };
  course: SectionStatus & { courseList?: CourseRow[]; batch?: string };
};

export type DashTab = "overview" | "timetable" | "attendance" | "marks" | "courses" | "calendar";

export const DASH_TABS: { id: DashTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timetable", label: "Timetable" },
  { id: "attendance", label: "Attendance" },
  { id: "marks", label: "Marks" },
  { id: "courses", label: "Courses" },
  { id: "calendar", label: "Calendar" },
];

/** True when Academia rejected the session cookies for (nearly) every section. */
export function isSessionExpired(d: DashboardJson): boolean {
  const sections = [d.attendance, d.marks, d.timetable, d.userInfo, d.dayOrder, d.course, d.calendar];
  const unauthorized = sections.filter((s) => s?.status === 401).length;
  return unauthorized >= 3 || (d.userInfo?.status === 401 && d.attendance?.status === 401);
}
