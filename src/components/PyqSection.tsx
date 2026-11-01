"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Catalogue } from "@/lib/pyq/data";
import { useCatalogue } from "@/lib/pyq/CatalogueContext";
import { NAV_KEY, readJson, writeJson } from "@/lib/pyq/storage";
import { SemesterList, SubjectList } from "./pyq/Browse";
import { SubjectSearch } from "./pyq/SubjectSearch";
import { QuestionViewer } from "./pyq/QuestionViewer";

/*
 * PYQ browser: Semester -> Subject -> Questions.
 *
 * Pieces live in ./pyq (UI) and @/lib/pyq (data, loading, markdown/KaTeX/Prism
 * rendering). This component owns navigation state, which is
 *  - persisted (localStorage) so the last course survives reloads / tab switches,
 *  - mirrored into the URL hash (#pyq/<subject>[/<question>]) for shareable links.
 * Both are read only after mount, so server and first client render match.
 */

type NavState =
  | { view: "semesters" }
  | { view: "subjects"; semesterId: number }
  | { view: "questions"; subjectCode: string };

const HOME: NavState = { view: "semesters" };

function sanitizeNav(value: unknown, { getSubject, getSemester }: Catalogue): NavState {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (v.view === "questions" && typeof v.subjectCode === "string" && getSubject(v.subjectCode)) {
      return { view: "questions", subjectCode: v.subjectCode };
    }
    if (v.view === "subjects" && typeof v.semesterId === "number" && getSemester(v.semesterId)) {
      return { view: "subjects", semesterId: v.semesterId };
    }
  }
  return HOME;
}

/** Parses `#pyq/<subjectCode>[/<questionId>]`. */
function parseHash(hash: string, { getSubject }: Catalogue): { code: string; focusId: string | null } | null {
  const m = hash.match(/^#pyq\/([^/]+)(?:\/(.+))?$/);
  if (!m) return null;
  try {
    const code = decodeURIComponent(m[1]);
    if (!getSubject(code)) return null;
    return { code, focusId: m[2] ? decodeURIComponent(m[2]) : null };
  } catch {
    return null;
  }
}

const crumbLink =
  "font-medium transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-[#7A5C1E] dark:text-amber-400 hover:underline";
const crumbCurrent = "text-gray-900 dark:text-gray-100 font-semibold";

const PyqSection: React.FC = () => {
  const catalogue = useCatalogue();
  const { getSubject, getSemester } = catalogue;
  const [nav, setNav] = useState<NavState>(HOME);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  // Restore navigation after mount (URL hash wins over stored state).
  useEffect(() => {
    const fromHash = parseHash(window.location.hash, catalogue);
    if (fromHash) {
      setNav({ view: "questions", subjectCode: fromHash.code });
      setFocusId(fromHash.focusId);
    } else {
      setNav(sanitizeNav(readJson<unknown>(NAV_KEY, null), catalogue));
    }
    setRestored(true);

    const onHashChange = () => {
      const h = parseHash(window.location.hash, catalogue);
      if (h) {
        setNav({ view: "questions", subjectCode: h.code });
        setFocusId(h.focusId);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [catalogue]);

  // Persist navigation + keep the URL hash in sync (never before restore, or we'd clobber it).
  useEffect(() => {
    if (!restored) return;
    writeJson(NAV_KEY, nav);
    const { pathname, search, hash } = window.location;
    if (nav.view === "questions") {
      const wanted = `#pyq/${encodeURIComponent(nav.subjectCode)}`;
      if (!hash.startsWith(wanted)) window.history.replaceState(null, "", `${pathname}${search}${wanted}`);
    } else if (hash.startsWith("#pyq")) {
      window.history.replaceState(null, "", `${pathname}${search}`);
    }
  }, [nav, restored]);

  // After a user-initiated view change, bring the new view to the top and move focus into it.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start" });
    viewRef.current?.focus({ preventScroll: true });
  }, [nav]);

  const go = useCallback((next: NavState) => {
    moveFocus.current = true;
    setFocusId(null);
    setNav(next);
  }, []);

  const activeSubject = nav.view === "questions" ? getSubject(nav.subjectCode) ?? null : null;
  const activeSemester =
    nav.view === "subjects"
      ? getSemester(nav.semesterId) ?? null
      : activeSubject
        ? activeSubject.semester
        : null;

  return (
    <div className={`max-w-6xl mx-auto px-4 ${nav.view === "questions" ? "py-4" : "py-8"}`} ref={rootRef}>
      {nav.view === "questions" ? (
        <h1 className="sr-only">SRM PYQs — B.Tech CSE Previous Year Questions</h1>
      ) : (
        <>
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">SRM PYQs</h1>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
            B.Tech CSE — Previous Year Questions
          </p>
        </>
      )}

      <SubjectSearch onSelect={(code) => go({ view: "questions", subjectCode: code })} />

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className={`max-w-2xl mx-auto px-1 ${nav.view === "questions" ? "mb-3" : "mb-6"}`}>
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          <li>
            <button
              type="button"
              onClick={() => go(HOME)}
              aria-current={nav.view === "semesters" ? "page" : undefined}
              className={nav.view === "semesters" ? crumbCurrent : crumbLink}
            >
              All Semesters
            </button>
          </li>
          {activeSemester && (
            <>
              <li aria-hidden="true" className="text-gray-500 dark:text-neutral-500">›</li>
              <li>
                <button
                  type="button"
                  onClick={() => go({ view: "subjects", semesterId: activeSemester.id })}
                  aria-current={nav.view === "subjects" ? "page" : undefined}
                  className={nav.view === "subjects" ? crumbCurrent : crumbLink}
                >
                  {activeSemester.name}
                </button>
              </li>
            </>
          )}
          {activeSubject && (
            <>
              <li aria-hidden="true" className="text-gray-500 dark:text-neutral-500">›</li>
              <li aria-current="page" className={`${crumbCurrent} truncate max-w-[16rem] sm:max-w-md`} title={activeSubject.title}>
                {activeSubject.code}: {activeSubject.name}
              </li>
            </>
          )}
        </ol>
      </nav>

      <div ref={viewRef} tabIndex={-1} className="outline-none">
        {nav.view === "semesters" && (
          <SemesterList onSelect={(semesterId) => go({ view: "subjects", semesterId })} />
        )}

        {nav.view === "subjects" && activeSemester && (
          <SubjectList
            semester={activeSemester}
            onBack={() => go(HOME)}
            onSelectSemester={(semesterId) => go({ view: "subjects", semesterId })}
            onSelectSubject={(code) => go({ view: "questions", subjectCode: code })}
          />
        )}

        {nav.view === "questions" && activeSubject && (
          <>
            <h2 className="sr-only">
              {activeSubject.title}
            </h2>
            <QuestionViewer key={activeSubject.code} subject={activeSubject} focusId={focusId} />
          </>
        )}
      </div>
    </div>
  );
};

export default PyqSection;
