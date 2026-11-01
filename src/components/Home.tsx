"use client";

import PyqSection from "@/components/PyqSection";
import ThemeToggle from "@/components/ThemeToggle";
import { useDarkMode } from "@/hooks/useDarkMode";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-neutral-900";

export default function Home() {
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
          </div>
          <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <PyqSection />
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
