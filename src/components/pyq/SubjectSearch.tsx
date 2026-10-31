"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ALL_SUBJECTS, type SubjectEntry } from "@/lib/pyq/data";
import { ForwardArrowIcon, getSubjectBadgeIcon } from "./icons";
import { useDebouncedValue, useOutsideDismiss } from "./hooks";

const STOP_WORDS = new Set(["and", "of", "to", "for", "the", "in", "a", "an"]);

interface IndexedSubject {
  subject: SubjectEntry;
  haystack: string;
}

// Built once: lower-cased searchable text, plus acronym ("DSA", "OS", ...).
const INDEX: IndexedSubject[] = ALL_SUBJECTS.map((subject) => {
  const initials = subject.name
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()))
    .map((w) => w[0])
    .join("");
  return {
    subject,
    haystack: `${subject.code} ${subject.name} ${subject.semester.name} sem${subject.semester.id} ${initials}`.toLowerCase(),
  };
});

export function searchSubjects(query: string): SubjectEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return INDEX.filter(({ haystack }) => tokens.every((t) => haystack.includes(t))).map((i) => i.subject);
}

export function SubjectSearch({ onSelect }: { onSelect: (code: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const debounced = useDebouncedValue(query, 150);
  const results = useMemo(() => searchSubjects(debounced), [debounced]);
  const hasQuery = query.trim().length > 0;
  const showList = open && hasQuery;

  useOutsideDismiss(rootRef, open, () => setOpen(false));

  // Keep the highlighted option inside the result range as results change.
  const activeIndex = results.length === 0 ? -1 : Math.min(active, results.length - 1);

  useEffect(() => {
    if (!showList || activeIndex < 0) return;
    document.getElementById(`${listId}-opt-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [showList, activeIndex, listId]);

  function choose(code: string) {
    setQuery("");
    setOpen(false);
    onSelect(code);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (results.length === 0) return;
      e.preventDefault();
      setOpen(true);
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + delta + results.length) % results.length);
    } else if (e.key === "Enter") {
      if (showList && activeIndex >= 0) {
        e.preventDefault();
        choose(results[activeIndex].code);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      } else if (query) {
        setQuery("");
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto mb-4" ref={rootRef} role="search">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          role="combobox"
          aria-label="Search subjects"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder='Search subjects… (e.g. "DSA", "Chemistry", "21CSC201J")'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="w-full pl-12 pr-11 py-3 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm transition-all duration-200"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-r-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {showList && (
          <div
            id={listId}
            role="listbox"
            aria-label="Matching subjects"
            className="absolute left-0 right-0 top-full z-30 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-80 overflow-y-auto"
          >
            {results.length === 0 ? (
              <div role="status" className="px-4 py-6 text-center text-gray-600 dark:text-gray-300 text-sm">
                {debounced === query ? <>No subjects found for &quot;{query}&quot;</> : "Searching…"}
              </div>
            ) : (
              results.map((sub, i) => (
                <div
                  key={sub.code}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(sub.code)}
                  className={`w-full text-left px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-neutral-700/50 last:border-b-0 ${
                    i === activeIndex ? "bg-[#F3EBD5] dark:bg-neutral-700/70" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-white dark:bg-neutral-900 border border-[#DFCFA5] dark:border-neutral-700 flex items-center justify-center text-[#A58338] dark:text-amber-400 flex-shrink-0 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-5 sm:[&_svg]:h-5">
                    {getSubjectBadgeIcon(sub.code, sub.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{sub.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-amber-900 dark:text-amber-300">{sub.code}</span>
                      <span aria-hidden="true" className="text-gray-300 dark:text-neutral-600">·</span>
                      <span>{sub.semester.name}</span>
                      <span aria-hidden="true" className="text-gray-300 dark:text-neutral-600">·</span>
                      <span>
                        {sub.files.length === 0
                          ? "coming soon"
                          : `${sub.files.length} paper${sub.files.length !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>
                  <ForwardArrowIcon className="w-5 h-5 text-[#B28B38] dark:text-amber-400 flex-shrink-0 opacity-70" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
