import type { ReactNode } from "react";
import type { SectionStatus } from "./types";

export const CARD =
  "bg-white dark:bg-neutral-800 rounded-lg shadow border border-gray-200 dark:border-neutral-700";
export const MUTED = "text-gray-600 dark:text-gray-300";
export const TH = "px-3 py-2 font-semibold text-gray-700 dark:text-gray-200";

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-200 dark:border-neutral-700 py-2 last:border-0">
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 shrink-0 sm:w-40">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 break-words">{value || "—"}</span>
    </div>
  );
}

export function StatusBadge({ status, error }: SectionStatus) {
  const ok = status === 200 && !error;
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded ${
        ok
          ? "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100"
          : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
      }`}
    >
      {ok ? "OK" : `HTTP ${status}${error ? `: ${error}` : ""}`}
    </span>
  );
}

export function SectionHeader({ title, section }: { title: string; section: SectionStatus }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      <StatusBadge status={section.status} error={section.error} />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className={`text-sm ${MUTED}`}>{children}</p>;
}
