import type { CalendarMonth, CourseRow, DashboardJson, MarkCourse, TimetableDay } from "./types";
import { CARD, EmptyState, Field, MUTED, SectionHeader, TH } from "./ui";

export function OverviewPanel({ d }: { d: DashboardJson }) {
  const u = d.userInfo?.userInfo;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className={`${CARD} p-5`}>
        <SectionHeader title="User info" section={d.userInfo} />
        {u ? (
          <div>
            <Field label="Name" value={u.name} />
            <Field label="Reg. no." value={u.regNumber} />
            <Field label="Program" value={u.program} />
            <Field label="Department" value={u.department} />
            <Field label="Section" value={u.section} />
            <Field label="Semester" value={u.semester} />
            <Field label="Batch" value={u.batch} />
            <Field label="Mobile" value={u.mobile} />
          </div>
        ) : (
          <EmptyState>{d.userInfo?.error || "No user info."}</EmptyState>
        )}
      </div>
      <div className={`${CARD} p-5`}>
        <SectionHeader title="Day order" section={d.dayOrder} />
        <p className="text-3xl font-semibold text-blue-800 dark:text-blue-300">{d.dayOrder?.dayOrder ?? "—"}</p>
        {d.course?.batch && <p className={`mt-2 text-sm ${MUTED}`}>Batch (courses): {d.course.batch}</p>}
      </div>
    </div>
  );
}

export function TimetablePanel({ d }: { d: DashboardJson }) {
  const timetable: TimetableDay[] | undefined = d.timetable?.timetable;
  return (
    <div className={`${CARD} p-5`}>
      <SectionHeader title="Timetable" section={d.timetable} />
      {!timetable?.length ? (
        <EmptyState>{d.timetable?.error || "No timetable data."}</EmptyState>
      ) : (
        <div className="space-y-6">
          {timetable.map((day, i) => (
            <div key={`${day.dayOrder}-${i}`}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Day order {day.dayOrder}</h3>
              <div className="space-y-3">
                {(day.class ?? []).map((slot, j) => (
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
                        {slot.courseRoomNo && <div className={MUTED}>Room {slot.courseRoomNo}</div>}
                      </div>
                    ) : (
                      <div className={MUTED}>No class</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MarksPanel({ d }: { d: DashboardJson }) {
  const markList: MarkCourse[] | undefined = d.marks?.markList;
  return (
    <div className="space-y-4">
      <SectionHeader title="Marks" section={d.marks} />
      {!markList?.length ? (
        <EmptyState>{d.marks?.error || "No marks published yet."}</EmptyState>
      ) : (
        markList.map((c, i) => (
          <div key={`${c.course}-${i}`} className={`${CARD} p-4 overflow-x-auto`}>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{c.course}</div>
            <div className={`text-xs ${MUTED} mb-2`}>{c.category}</div>
            <table className="min-w-full text-sm text-gray-900 dark:text-gray-100">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-200">
                  <th scope="col" className="py-1">Exam</th>
                  <th scope="col" className="py-1">Obtained</th>
                  <th scope="col" className="py-1">Max</th>
                </tr>
              </thead>
              <tbody>
                {(c.marks ?? []).map((m, j) => (
                  <tr key={j} className="border-t border-gray-200 dark:border-neutral-700">
                    <td className="py-1">{m.exam}</td>
                    <td className="py-1">{m.obtained}</td>
                    <td className="py-1">{m.maxMark}</td>
                  </tr>
                ))}
                {c.total && (
                  <tr className="border-t border-gray-200 dark:border-neutral-700 font-medium">
                    <td className="py-1">Total</td>
                    <td className="py-1">{c.total.obtained}</td>
                    <td className="py-1">{c.total.maxMark}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export function CoursesPanel({ d }: { d: DashboardJson }) {
  const courseList: CourseRow[] | undefined = d.course?.courseList;
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="p-5 pb-0">
        <SectionHeader title="Courses" section={d.course} />
      </div>
      {!courseList?.length ? (
        <div className="p-5 pt-0">
          <EmptyState>{d.course?.error || "No course list."}</EmptyState>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-900 dark:text-gray-100">
            <caption className="sr-only">Registered courses</caption>
            <thead className="bg-gray-50 dark:bg-neutral-900/80 text-left">
              <tr>
                <th scope="col" className={TH}>Code</th>
                <th scope="col" className={TH}>Title</th>
                <th scope="col" className={TH}>Type</th>
                <th scope="col" className={TH}>Faculty</th>
                <th scope="col" className={TH}>Slots</th>
                <th scope="col" className={TH}>Room</th>
              </tr>
            </thead>
            <tbody>
              {courseList.map((c, idx) => (
                <tr key={`${c.courseCode}-${idx}`} className="border-t border-gray-200 dark:border-neutral-700">
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{c.courseCode}</td>
                  <td className="px-3 py-2 min-w-[12rem]">{c.courseTitle}</td>
                  <td className="px-3 py-2">{c.courseType}</td>
                  <td className="px-3 py-2">{c.courseFaculty}</td>
                  <td className="px-3 py-2">{(c.courseSlot || []).join(", ")}</td>
                  <td className="px-3 py-2">{c.courseRoomNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CalendarPanel({ d }: { d: DashboardJson }) {
  const calendar: CalendarMonth[] | undefined = d.calendar?.calendar;
  return (
    <div className={`${CARD} p-5`}>
      <SectionHeader title="Academic calendar" section={d.calendar} />
      {!calendar?.length ? (
        <EmptyState>{d.calendar?.error || "No calendar data."}</EmptyState>
      ) : (
        <div className="space-y-6">
          {calendar.map((m, i) => (
            <div key={`${m.month}-${i}`}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{m.month}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-900 dark:text-gray-100">
                  <thead>
                    <tr className="text-left text-gray-700 dark:text-gray-200">
                      <th scope="col" className="py-1 pr-3">Date</th>
                      <th scope="col" className="py-1 pr-3">Day</th>
                      <th scope="col" className="py-1 pr-3">DO</th>
                      <th scope="col" className="py-1">Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(m.days ?? []).map((day, j) => (
                      <tr key={j} className="border-t border-gray-200 dark:border-neutral-700 align-top">
                        <td className="py-1 pr-3 whitespace-nowrap">{day.date}</td>
                        <td className="py-1 pr-3">{day.day}</td>
                        <td className="py-1 pr-3">{day.dayOrder}</td>
                        <td className="py-1">{day.event}</td>
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
  );
}
