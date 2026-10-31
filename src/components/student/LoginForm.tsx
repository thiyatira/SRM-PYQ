import type { FormEvent } from "react";
import { MUTED } from "./ui";

export type AuthStep = "username" | "password";

const INPUT =
  "w-full rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
const PRIMARY =
  "w-full rounded bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800";

type Props = {
  step: AuthStep;
  username: string;
  password: string;
  busy: boolean;
  onUsername: (v: string) => void;
  onPassword: (v: string) => void;
  onContinue: () => void;
  onSignIn: () => void;
  onFullLogin: () => void;
  onBack: () => void;
};

export default function LoginForm(p: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (p.busy) return;
    if (p.step === "username") {
      if (p.username.trim()) p.onContinue();
    } else if (p.password) {
      p.onSignIn();
    }
  };

  if (p.step === "username") {
    return (
      <form onSubmit={submit} className="space-y-4" aria-label="Sign in to SRM Academia">
        <div>
          <label htmlFor="srm-username" className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
            SRM email / username
          </label>
          <input
            id="srm-username"
            name="username"
            type="text"
            inputMode="email"
            className={INPUT}
            value={p.username}
            onChange={(e) => p.onUsername(e.target.value)}
            placeholder="e.g. ab1234@srmist.edu.in"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>
        <button type="submit" disabled={p.busy || !p.username.trim()} className={PRIMARY}>
          {p.busy ? "Please wait…" : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Enter your password">
      <p className={`text-sm ${MUTED}`}>
        Signing in as <span className="font-mono text-gray-900 dark:text-gray-100 break-all">{p.username.trim()}</span>
      </p>
      {/* Lets password managers associate the saved credential with the right account. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={p.username}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <div>
        <label htmlFor="srm-password" className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
          Password
        </label>
        <input
          id="srm-password"
          name="password"
          type="password"
          className={INPUT}
          value={p.password}
          onChange={(e) => p.onPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />
      </div>
      <button type="submit" disabled={p.busy || !p.password} className={PRIMARY}>
        {p.busy ? "Signing in…" : "Sign in"}
      </button>
      <div>
        <button
          type="button"
          disabled={p.busy || !p.password}
          onClick={p.onFullLogin}
          className="w-full rounded border border-gray-400 dark:border-neutral-500 text-gray-900 dark:text-gray-100 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Sign in (terminate other sessions)
        </button>
        <p className={`mt-1 text-xs ${MUTED}`}>Use this if Academia says you have too many active sessions.</p>
      </div>
      <button
        type="button"
        disabled={p.busy}
        onClick={p.onBack}
        className="w-full text-sm text-gray-700 dark:text-gray-300 underline disabled:opacity-50"
      >
        Use a different username
      </button>
    </form>
  );
}
