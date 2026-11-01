"use client";

import React, { useId, useRef, useState } from "react";
import { useOutsideDismiss } from "./hooks";

/** Accessible checkbox dropdown: "All" == empty selection. */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  minWidth = 200,
}: {
  label: string;
  options: string[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const panelId = useId();

  useOutsideDismiss(rootRef, open, () => setOpen(false));

  function toggle(option: string) {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(next);
  }

  return (
    <div
      className="flex items-center gap-2"
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-2 border border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-sm transition-colors"
        >
          <span id={labelId} className="font-semibold text-gray-800 dark:text-gray-200">
            {label}:
          </span>
          <span className={selected.size ? "font-medium text-blue-700 dark:text-blue-300" : ""}>
            {selected.size === 0 ? "All" : `${selected.size} selected`}
          </span>
          <span aria-hidden="true" className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {open && (
          <div
            id={panelId}
            role="group"
            aria-labelledby={labelId}
            style={{ minWidth }}
            className="absolute left-0 top-full z-20 mt-1 max-w-[85vw] bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-72 overflow-y-auto text-gray-900 dark:text-gray-100 py-1"
          >
            <label
              className={`flex w-full items-center gap-3 px-3 py-2.5 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-neutral-700 border-b border-gray-200 dark:border-neutral-600 ${
                selected.size === 0 ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-blue-600"
                checked={selected.size === 0}
                onChange={() => onChange(new Set())}
              />
              <span className="font-medium text-sm flex-1">All</span>
            </label>
            {options.map((o) => (
              <label
                key={o}
                className={`flex w-full items-center gap-3 px-3 py-2.5 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-neutral-700 ${
                  selected.has(o) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-blue-600"
                  checked={selected.has(o)}
                  onChange={() => toggle(o)}
                />
                <span className="text-sm break-all flex-1">{o}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
