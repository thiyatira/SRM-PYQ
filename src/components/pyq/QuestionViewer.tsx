"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { SubjectEntry } from "@/lib/pyq/data";
import { unitOrder, type Question, type SubjectData } from "@/lib/pyq/loader";
import { QuestionCard, questionDomId } from "./QuestionCard";
import { MultiSelect } from "./MultiSelect";
import { useBookmarks, useDebouncedValue, useSubjectData } from "./hooks";
import { printQuestions } from "./print";

const PAGE_SIZE = 25;
const EMPTY_SET: ReadonlySet<string> = new Set();

interface Props {
  subject: SubjectEntry;
  /** Question id to scroll to + highlight once loaded (from a shared link). */
  focusId: string | null;
}

export function QuestionViewer({ subject, focusId }: Props) {
  if (subject.files.length === 0) {
    return (
      <div className="text-center py-16">
        <div aria-hidden="true" className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No papers available yet</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Papers for {subject.name} haven&apos;t been added yet. Check back later!
        </p>
      </div>
    );
  }
  return <LoadedViewer subject={subject} focusId={focusId} />;
}

function LoadedViewer({ subject, focusId }: Props) {
  const { state, retry } = useSubjectData(subject.code);

  if (state.status === "error") {
    return (
      <div role="alert" className="text-center py-12">
        <div aria-hidden="true" className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Couldn&apos;t load questions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{state.message}</p>
        <button
          type="button"
          onClick={retry}
          className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }
  if (state.status !== "ready") {
    return (
      <div role="status" aria-live="polite" className="text-center py-12">
        <div aria-hidden="true" className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <div className="text-gray-600 dark:text-gray-400">Loading {subject.files.length} papers…</div>
      </div>
    );
  }
  return <Viewer key={subject.code} subject={subject} data={state.data} focusId={focusId} onRetry={retry} />;
}

function Viewer({
  subject,
  data,
  focusId,
  onRetry,
}: Props & { data: SubjectData; onRetry: () => void }) {
  const [filterPapers, setFilterPapers] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [filterUnits, setFilterUnits] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [minMarks, setMinMarks] = useState(0);
  const [starredOnly, setStarredOnly] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [notice, setNotice] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [pageState, setPageState] = useState({ sig: "", pages: 1 });
  const handledFocus = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const marksId = useId();

  const { bookmarks, toggle } = useBookmarks();
  const query = useDebouncedValue(queryInput, 250).trim().toLowerCase();
  const sliderMax = Math.ceil(data.maxMarks);

  // Filter, then order by unit and marks (stable w.r.t. paper order).
  const ordered = useMemo(() => {
    const out: Question[] = [];
    for (const q of data.questions) {
      if (filterPapers.size > 0 && !filterPapers.has(q.source)) continue;
      if (filterUnits.size > 0 && !filterUnits.has(q.unit)) continue;
      if ((q.marks ?? 0) < minMarks) continue;
      if (starredOnly && !bookmarks.has(`${subject.code}|${q.id}`)) continue;
      if (query && !(q.question_text.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query))) {
        continue;
      }
      out.push(q);
    }
    return out
      .map((q, i) => ({ q, i }))
      .sort((a, b) => unitOrder(a.q.unit) - unitOrder(b.q.unit) || (a.q.marks ?? 0) - (b.q.marks ?? 0) || a.i - b.i)
      .map(({ q }) => q);
  }, [data.questions, filterPapers, filterUnits, minMarks, starredOnly, bookmarks, query, subject.code]);

  const sig = `${[...filterPapers].join(",")}|${[...filterUnits].join(",")}|${minMarks}|${starredOnly}|${query}`;
  const pages = pageState.sig === sig ? pageState.pages : 1;
  const focusIndex = focusId ? ordered.findIndex((q) => q.id === focusId) : -1;
  const visibleCount = Math.min(
    ordered.length,
    Math.max(pages * PAGE_SIZE, focusIndex >= 0 ? focusIndex + 1 + PAGE_SIZE : 0)
  );
  const hasMore = visibleCount < ordered.length;

  const loadMore = useCallback(() => {
    setPageState((p) => ({ sig, pages: (p.sig === sig ? p.pages : 1) + 1 }));
  }, [sig]);

  // Infinite scroll: observer is recreated whenever more rows render, so a
  // sentinel that is still on screen keeps loading.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!hasMore || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, visibleCount, loadMore]);

  // Scroll to + highlight a question opened through a shared link.
  useEffect(() => {
    if (!focusId || handledFocus.current === focusId || focusIndex < 0) return;
    const el = document.getElementById(questionDomId(focusId));
    if (!el) return;
    handledFocus.current = focusId;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    setHighlightId(focusId);
    const t = setTimeout(() => setHighlightId(null), 4000);
    return () => clearTimeout(t);
  }, [focusId, focusIndex, visibleCount]);

  // Group the visible slice by unit (ordered is already unit-sorted).
  const sections = useMemo(() => {
    const out: { unit: string; items: { q: Question; number: number }[] }[] = [];
    ordered.slice(0, visibleCount).forEach((q, i) => {
      let last = out[out.length - 1];
      if (!last || last.unit !== q.unit) {
        last = { unit: q.unit, items: [] };
        out.push(last);
      }
      last.items.push({ q, number: i + 1 });
    });
    return out;
  }, [ordered, visibleCount]);

  const starredCount = useMemo(
    () => data.questions.reduce((n, q) => n + (bookmarks.has(`${subject.code}|${q.id}`) ? 1 : 0), 0),
    [data.questions, bookmarks, subject.code]
  );

  const unknownMarks = useMemo(() => data.questions.filter((q) => q.marks === undefined).length, [data.questions]);

  const filtersActive =
    filterPapers.size > 0 || filterUnits.size > 0 || minMarks > 0 || starredOnly || queryInput.trim() !== "";

  function resetFilters() {
    setFilterPapers(EMPTY_SET);
    setFilterUnits(EMPTY_SET);
    setMinMarks(0);
    setStarredOnly(false);
    setQueryInput("");
  }

  // Delegated handler for the "Copy" button inside rendered code blocks.
  function onContentClick(e: React.MouseEvent<HTMLElement>) {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".copy-code-btn");
    if (!btn) return;
    const text = btn.closest(".code-block-wrapper")?.querySelector("pre")?.textContent ?? "";
    const span = btn.querySelector("span");
    const say = (msg: string) => {
      if (!span) return;
      const original = span.textContent;
      span.textContent = msg;
      setTimeout(() => {
        span.textContent = original === msg ? "Copy" : original;
      }, 1800);
    };
    navigator.clipboard.writeText(text).then(
      () => say("Copied!"),
      () => say("Failed")
    );
  }

  function handlePrint() {
    if (!printQuestions(subject.title, subject.name, ordered)) {
      setNotice("Pop-up blocked. Allow pop-ups for this site to print or save as PDF.");
    } else {
      setNotice("");
    }
  }

  const btn =
    "rounded px-3 py-1.5 text-sm font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-neutral-900";

  return (
    <div onClick={onContentClick}>
      {data.failed.length > 0 && (
        <div
          role="alert"
          className="max-w-3xl mx-auto mb-6 rounded-lg border border-amber-300 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {data.failed.length} of {data.totalFiles} papers couldn&apos;t be loaded, so some questions may be missing.
            </span>
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1 rounded border border-amber-500 dark:border-amber-500/70 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Retry
            </button>
          </div>
          <details className="mt-1">
            <summary className="cursor-pointer">Show files</summary>
            <ul className="mt-1 list-disc pl-5 break-all">
              {data.failed.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* ── Filter controls ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/50 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={searchId} className="sr-only">
            Search questions
          </label>
          <input
            id={searchId}
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search questions or answers…"
            className="flex-1 min-w-[12rem] rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MultiSelect label="Paper" options={data.papers} selected={filterPapers} onChange={setFilterPapers} minWidth={220} />
          <MultiSelect label="Unit" options={data.units} selected={filterUnits} onChange={setFilterUnits} minWidth={160} />
          {sliderMax > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor={marksId} className="font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                Marks ≥ {minMarks}
              </label>
              <input
                id={marksId}
                type="range"
                min={0}
                max={sliderMax}
                step={1}
                value={Math.min(minMarks, sliderMax)}
                onChange={(e) => setMinMarks(parseInt(e.target.value, 10))}
                className="w-24 h-2 accent-blue-600 cursor-pointer"
              />
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showAllAnswers}
            className={`${btn} ${
              showAllAnswers
                ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-black dark:border-gray-100"
                : "bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            }`}
            onClick={() => setShowAllAnswers((v) => !v)}
          >
            {showAllAnswers ? "Hide answers" : "Show answers"}
          </button>
          <button
            type="button"
            aria-pressed={starredOnly}
            className={`${btn} inline-flex items-center gap-1.5 ${
              starredOnly
                ? "bg-amber-500 text-black border-amber-600"
                : "bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
            }`}
            onClick={() => setStarredOnly((v) => !v)}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill={starredOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Starred ({starredCount})
          </button>
          <button
            type="button"
            className={`${btn} border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800/50`}
            onClick={handlePrint}
            disabled={ordered.length === 0}
          >
            <span aria-hidden="true">🖨️ </span>Print / PDF
          </button>
          <span className="ml-auto flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <span role="status" aria-live="polite">
              {ordered.length === data.questions.length
                ? `${ordered.length} questions`
                : `${ordered.length} of ${data.questions.length} questions`}
            </span>
            {filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="underline text-blue-700 dark:text-blue-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Reset
              </button>
            )}
          </span>
        </div>
        {minMarks > 0 && unknownMarks > 0 && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {unknownMarks} question{unknownMarks === 1 ? "" : "s"} with no marks listed {unknownMarks === 1 ? "is" : "are"} hidden.
          </p>
        )}
        {notice && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300 mt-2">
            {notice}
          </p>
        )}
      </div>

      {/* ── Questions ───────────────────────────────────────────────── */}
      <div id="content" className="text-gray-900 dark:text-gray-100">
        {ordered.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            {starredOnly && starredCount === 0
              ? "You haven't bookmarked any questions in this subject yet. Use the star on a question to save it."
              : "No questions found for selected filters."}
          </div>
        ) : (
          sections.map((section) => (
            <section
              key={section.unit}
              aria-label={section.unit}
              className="mb-10 bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg shadow-md"
            >
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 border-b border-gray-200 dark:border-neutral-700 pb-2 mb-6">
                {section.unit}
              </h2>
              {section.items.map(({ q, number }) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  number={number}
                  subjectCode={subject.code}
                  starred={bookmarks.has(`${subject.code}|${q.id}`)}
                  showAllAnswers={showAllAnswers}
                  highlighted={highlightId === q.id}
                  onToggleStar={toggle}
                />
              ))}
            </section>
          ))
        )}
        {hasMore && (
          <div ref={sentinelRef} className="text-center py-6">
            <button
              type="button"
              onClick={loadMore}
              className="px-5 py-2 rounded border border-gray-400 dark:border-gray-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Show more ({ordered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
