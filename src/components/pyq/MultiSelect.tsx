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
      <span id={labelId} className="font-semibold text-gray-800 dark:text-gray-200">
        {label}:
      </span>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-labelledby={labelId}
          onClick={() => setOpen((v) => !v)}
          className="rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-1.5 border border-gray-300 dark:border-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-sm"
        >
          {selected.size === 0 ? "All" : `${selected.size} selected`} <span aria-hidden="true">▾</span>
        </button>
        {open && (
          <div
            id={panelId}
            role="group"
            aria-labelledby={labelId}
            style={{ minWidth }}
            className="absolute left-0 top-full z-20 mt-1 max-w-[85vw] bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded shadow-lg max-h-60 overflow-y-auto text-gray-900 dark:text-gray-100"
          >
            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600 border-b border-gray-200 dark:border-neutral-500">
              <input type="checkbox" checked={selected.size === 0} onChange={() => onChange(new Set())} />
              <span className="font-medium text-sm">All</span>
            </label>
            {options.map((o) => (
              <label key={o} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600">
                <input type="checkbox" checked={selected.has(o)} onChange={() => toggle(o)} />
                <span className="text-sm break-all">{o}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
