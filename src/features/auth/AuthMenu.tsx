"use client";

/**
 * Sign-in menu (TASK-030 subset). Calls the documented `auth-login`
 * operation, stores the session in memory + sessionStorage, and exposes the
 * token to the request pipeline. Demo credentials for DummyJSON are prefilled
 * since the API is explicitly a demo service.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import type { LoginCredentials } from "./auth-store";

export interface AuthMenuProps {
  token: string | null;
  userLabel: string | null;
  busy: boolean;
  error: string | null;
  onLogin: (credentials: LoginCredentials) => void;
  onLogout: () => void;
}

export function AuthMenu(props: AuthMenuProps) {
  const { token, userLabel, busy, error, onLogin, onLogout } = props;
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("emilys");
  const [password, setPassword] = useState("emilyspass");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  // Focus the first control when the panel opens and restore focus to the
  // trigger when it closes (ARIA disclosure pattern).
  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>(
        "input, button, [tabindex]",
      );
      (first ?? panelRef.current)?.focus();
    } else if (wasOpen.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close the panel when a session starts (token transitions null -> value)
  // so a successful sign-in lands the user back on the workbench.
  const hadToken = useRef(token !== null);
  useEffect(() => {
    if (token !== null && !hadToken.current) {
      setOpen(false);
    }
    hadToken.current = token !== null;
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent): void => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    onLogin({ username, password, expiresInMins: 60 });
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((previous) => !previous)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          token
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="max-w-32 truncate">{token ? userLabel ?? "Signed in" : "Sign in"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-80 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {token !== null ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {userLabel !== null ? (
                  <>Signed in as <span className="font-semibold">{userLabel}</span>.</>
                ) : (
                  "Signed in."
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <div>
                <label htmlFor="auth-username" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Username
                </label>
                <input
                  id="auth-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="mt-1 w-full rounded-md border border-zinc-200 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-md border border-zinc-200 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              {error !== null && (
                <p role="alert" className="text-[11px] text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Demo: emilys / emilyspass
                </p>
                <button
                  type="submit"
                  aria-label="Submit sign in"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}