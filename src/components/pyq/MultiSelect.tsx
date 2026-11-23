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
            <Row checked={selected.size === 0} onClick={() => onChange(new Set())} divider>
              <span className="font-medium">All</span>
            </Row>
            {options.map((o) => (
              <Row key={o} checked={selected.has(o)} onClick={() => toggle(o)}>
                <span className="break-all">{o}</span>
              </Row>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** One full-width clickable option row with a visual checkbox. */
function Row({
  checked,
  onClick,
  divider,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-neutral-700 ${
        checked ? "bg-blue-50 dark:bg-blue-900/20" : ""
      } ${divider ? "border-b border-gray-200 dark:border-neutral-600" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] leading-none text-white ${
          checked ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-neutral-800 border-gray-400 dark:border-neutral-500"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}
