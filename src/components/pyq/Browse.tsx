"use client";

import React from "react";
import { SEMESTERS, type SemesterInfo } from "@/lib/pyq/data";
import { ForwardArrowIcon, getSemesterBadgeIcon, getSubjectBadgeIcon } from "./icons";

const CARD =
  "group relative w-full overflow-hidden rounded-[24px] border p-4 sm:p-5 text-left transition-all duration-300 flex items-center gap-4 sm:gap-5 bg-gradient-to-r from-[#F7F2E7] via-[#F1E7D3] to-[#E9D9B7] border-[#DFCFA7] shadow-[0_4px_18px_-2px_rgba(168,136,70,0.14)] hover:shadow-[0_8px_26px_-4px_rgba(168,136,70,0.25)] hover:-translate-y-0.5 hover:border-[#CFBC8B] dark:from-[#191921] dark:via-[#1F1E27] dark:to-[#262320] dark:border-neutral-700/70 dark:shadow-[0_4px_22px_rgba(0,0,0,0.45)] dark:hover:border-amber-500/50 dark:hover:shadow-[0_8px_30px_rgba(245,158,11,0.18)] dark:hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-neutral-900";

const BADGE =
  "relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/95 dark:bg-[#121217] border border-[#DECFA5] dark:border-neutral-700/90 shadow-sm dark:shadow-inner text-[#A58338] dark:text-amber-400 group-hover:scale-105 transition-transform duration-300";

const CRESCENT =
  "absolute -right-8 sm:-right-6 top-1/2 -translate-y-1/2 w-36 sm:w-44 h-36 sm:h-44 rounded-full pointer-events-none transition-transform duration-300 group-hover:scale-105 bg-[#E4D1A7]/75 dark:bg-amber-400/[0.08]";

const ARROW =
  "relative z-10 flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-[#9A7420] dark:text-amber-400 group-hover:text-[#8D6B24] dark:group-hover:text-amber-300 group-hover:translate-x-1 transition-all duration-300";

export function SemesterList({ onSelect }: { onSelect: (semesterId: number) => void }) {
  return (
    <section className="max-w-2xl mx-auto" aria-labelledby="pyq-sem-heading">
      <div className="text-center mb-6">
        <h2 id="pyq-sem-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-neutral-100">
          Select Semester
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 mt-1">
          Choose your semester to access subjects and question papers
        </p>
      </div>

      <div className="space-y-3.5 sm:space-y-4">
        {SEMESTERS.map((sem) => {
          const paperCount = sem.subjects.reduce((sum, s) => sum + s.files.length, 0);
          return (
            <button key={sem.id} type="button" onClick={() => onSelect(sem.id)} className={CARD}>
              <div aria-hidden="true" className={CRESCENT} />
              <div className={BADGE}>{getSemesterBadgeIcon(sem.id)}</div>
              <div className="flex-1 min-w-0 relative z-10 py-0.5">
                <h3 className="text-base sm:text-lg font-bold text-[#2A2317] dark:text-neutral-100 tracking-tight leading-snug group-hover:text-amber-950 dark:group-hover:text-white transition-colors">
                  {sem.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#5E513C] dark:text-neutral-300 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                  <span>{sem.subjects.length} Subjects</span>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span>{paperCount} Question Papers</span>
                </p>
              </div>
              <div className={ARROW}>
                <ForwardArrowIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function SubjectList({
  semester,
  onSelectSemester,
  onSelectSubject,
  onBack,
}: {
  semester: SemesterInfo;
  onSelectSemester: (semesterId: number) => void;
  onSelectSubject: (code: string) => void;
  onBack: () => void;
}) {
  return (
    <section className="max-w-2xl mx-auto" aria-labelledby="pyq-subj-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8C6B25] dark:text-amber-400 hover:text-[#674D16] dark:hover:text-amber-300 transition-colors self-start rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Semesters</span>
        </button>

        <div
          role="group"
          aria-label="Switch semester"
          className="flex items-center gap-1 p-1 rounded-xl bg-gray-200/70 dark:bg-neutral-800 border border-gray-300/60 dark:border-neutral-700/60 text-xs self-start sm:self-auto overflow-x-auto max-w-full"
        >
          {SEMESTERS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === semester.id}
              onClick={() => onSelectSemester(s.id)}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                s.id === semester.id
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-amber-300 shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 id="pyq-subj-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-neutral-100">
          {semester.name} Subjects
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 mt-1">
          Select a subject to view all previous year questions and answer keys
        </p>
      </div>

      <div className="space-y-3.5 sm:space-y-4">
        {semester.subjects.map((sub) => {
          if (sub.files.length > 0) {
            return (
              <button key={sub.code} type="button" onClick={() => onSelectSubject(sub.code)} className={CARD}>
                <div aria-hidden="true" className={CRESCENT} />
                <div className={BADGE}>{getSubjectBadgeIcon(sub.code, sub.name)}</div>
                <div className="flex-1 min-w-0 relative z-10 py-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#2A2317] dark:text-neutral-100 tracking-tight leading-snug group-hover:text-amber-950 dark:group-hover:text-white transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5E513C] dark:text-neutral-300 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-amber-900 dark:text-amber-300">
                      {sub.code}
                    </span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span>
                      {sub.files.length} Question Paper{sub.files.length !== 1 ? "s" : ""}
                    </span>
                  </p>
                </div>
                <div className={ARROW}>
                  <ForwardArrowIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </button>
            );
          }

          // Subjects without papers: shown but not actionable.
          return (
            <div
              key={sub.code}
              aria-disabled="true"
              className="group relative w-full overflow-hidden rounded-[24px] border p-4 sm:p-5 text-left flex items-center gap-4 sm:gap-5 bg-gradient-to-r from-[#F7F2E7]/60 via-[#F1E7D3]/60 to-[#E9D9B7]/60 border-[#DFCFA7]/60 dark:from-[#191921]/60 dark:via-[#1F1E27]/60 dark:to-[#262320]/60 dark:border-neutral-800/60 opacity-70 cursor-not-allowed"
            >
              <div aria-hidden="true" className="absolute -right-8 sm:-right-6 top-1/2 -translate-y-1/2 w-36 sm:w-44 h-36 sm:h-44 rounded-full pointer-events-none bg-[#E4D1A7]/35 dark:bg-white/[0.02]" />
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/70 dark:bg-neutral-800/80 border border-[#DECFA5]/60 dark:border-neutral-700/50 text-gray-500 dark:text-neutral-400">
                {getSubjectBadgeIcon(sub.code, sub.name)}
              </div>
              <div className="flex-1 min-w-0 relative z-10 py-0.5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-neutral-300 tracking-tight leading-snug">
                  {sub.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono">{sub.code}</span>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span className="italic">Papers coming soon</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
