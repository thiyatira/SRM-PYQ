"use client";

import { useState } from "react";
import PyqSection from "@/components/PyqSection";
import StudentDataSection from "@/components/StudentDataSection";
import { useDarkMode } from "@/hooks/useDarkMode";

type AppTab = "pyq" | "student";

export default function Home() {
  const [tab, setTab] = useState<AppTab>("pyq");
  const [dark, setDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-neutral-800 bg-gray-100/95 dark:bg-neutral-900/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-gray-100">SRM Toolkit</span>
            <span className="text-gray-400 dark:text-neutral-600">|</span>
            <nav className="flex rounded-lg border border-gray-300 dark:border-neutral-600 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setTab("pyq")}
                className={`px-3 py-1.5 font-medium ${
                  tab === "pyq"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700/80"
                }`}
              >
                PYQs
              </button>
              <button
                type="button"
                onClick={() => setTab("student")}
                className={`px-3 py-1.5 font-medium border-l border-gray-300 dark:border-neutral-600 ${
                  tab === "student"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700/80"
                }`}
              >
                Student data
              </button>
            </nav>
          </div>
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm font-medium border transition-colors duration-200 ${
              dark
                ? "bg-blue-400 text-black border-blue-400 hover:bg-blue-300"
                : "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200"
            }`}
            onClick={() => setDark((d) => !d)}
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      {tab === "pyq" ? <PyqSection /> : <StudentDataSection />}
    </div>
  );
}
