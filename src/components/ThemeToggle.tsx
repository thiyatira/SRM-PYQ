"use client";

import React from "react";

interface ThemeToggleProps {
  dark: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ dark, onToggle }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onToggle}
      className={`relative inline-flex h-8 w-15 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 cursor-pointer select-none ${
        dark
          ? "bg-gradient-to-r from-neutral-800 via-neutral-800 to-neutral-900 border border-neutral-700 shadow-inner"
          : "bg-gradient-to-r from-amber-100 via-orange-100 to-amber-200 border border-amber-300/80 shadow-sm"
      }`}
      style={{ perspective: "400px" }}
    >
      {/* Background ambient icons */}
      <span
        aria-hidden="true"
        className={`absolute left-2 text-[11px] transition-opacity duration-300 pointer-events-none select-none ${
          dark ? "opacity-30 text-neutral-400" : "opacity-90 text-amber-600 font-bold"
        }`}
      >
        ☀️
      </span>
      <span
        aria-hidden="true"
        className={`absolute right-2 text-[11px] transition-opacity duration-300 pointer-events-none select-none ${
          dark ? "opacity-90 text-amber-300 font-bold" : "opacity-30 text-amber-800"
        }`}
      >
        🌙
      </span>

      {/* Flipping Switch Thumb */}
      <span
        className={`relative flex h-6 w-6 transform items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
          dark
            ? "translate-x-7 bg-neutral-900 text-amber-300 border border-neutral-700"
            : "translate-x-0 bg-white text-amber-500 border border-amber-200"
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: dark
            ? "translateX(1.75rem) rotateY(180deg)"
            : "translateX(0) rotateY(0deg)",
        }}
      >
        {/* Front Face: Sun (visible when dark is false) */}
        <span
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            opacity: dark ? 0 : 1,
          }}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </span>

        {/* Back Face: Moon (visible when dark is true) */}
        <span
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            opacity: dark ? 1 : 0,
          }}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
