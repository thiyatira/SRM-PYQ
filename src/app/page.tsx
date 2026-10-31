"use client";

import PyqSection from "@/components/PyqSection";
import StudentDataSection from "@/components/StudentDataSection";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useHashTab, type AppTab } from "@/hooks/useHashTab";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-neutral-900";

const TABS: { id: AppTab; label: string }[] = [
  { id: "pyq", label: "PYQs" },
  { id: "student", label: "Student data" },
];

export default function Home() {
  const [tab, setTab] = useHashTab();
  const [dark, setDark] = useDarkMode();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-neutral-900 transition-colors duration-300">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-neutral-800 bg-gray-100/95 dark:bg-neutral-900/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-gray-100">SRM StudyHub</span>
            <span className="text-gray-400 dark:text-neutral-600" aria-hidden="true">|</span>
            <nav aria-label="Primary" className="flex rounded-lg border border-gray-300 dark:border-neutral-600 overflow-hidden text-sm">
              {TABS.map(({ id, label }, i) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    aria-current={active ? "page" : undefined}
                    className={`px-3 py-1.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                      i > 0 ? "border-l border-gray-300 dark:border-neutral-600" : ""
                    } ${
                      active
                        ? "bg-blue-600 text-white focus-visible:ring-white"
                        : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700/80"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
          <button
            type="button"
            aria-pressed={dark}
            aria-label="Dark mode"
            className={`rounded px-3 py-1.5 text-sm font-medium border transition-colors duration-200 ${FOCUS_RING} ${
              dark
                ? "bg-blue-400 text-black border-blue-400 hover:bg-blue-300"
                : "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200"
            }`}
            onClick={() => setDark((d) => !d)}
          >
            <span aria-hidden="true">{dark ? "☀️ Light" : "🌙 Dark"}</span>
          </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {tab === "pyq" ? <PyqSection /> : <StudentDataSection />}
      </main>

      <footer className="border-t border-gray-200 dark:border-neutral-800 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
        SRM StudyHub &middot; Unofficial student project, not affiliated with SRMIST &middot;{" "}
        <a
          href="https://github.com/thiyatira/SRM-PYQ"
          className={`underline hover:text-gray-700 dark:hover:text-gray-200 rounded ${FOCUS_RING}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
        </a>
      </footer>
    </div>
  );
}
