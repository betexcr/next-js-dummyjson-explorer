"use client";

/**
 * Settings menu (TASK-041 follow-up): configure API base URL and request
 * timeout. Values are validated and persisted to localStorage.
 */
import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  type AppSettings,
} from "./settings-store";

export interface SettingsMenuProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onReset: () => void;
}

export function SettingsMenu({ settings, onUpdate, onReset }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const baseUrlRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<HTMLInputElement | null>(null);
  const wasOpen = useRef(false);

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

  const submit = (): void => {
    const baseUrl = (baseUrlRef.current?.value ?? "").trim() || DEFAULT_BASE_URL;
    const timeoutRaw = timeoutRef.current?.value ?? String(DEFAULT_TIMEOUT_MS);
    const timeoutMs = Number(timeoutRaw);
    onUpdate({
      baseUrl,
      timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS,
    });
    setOpen(false);
  };

  const reset = (): void => {
    onReset();
    setOpen(false);
  };

  const validateUrl = (value: string): boolean => {
    const trimmed = value.trim();
    return (
      trimmed === "" ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    );
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Settings"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Settings aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Settings</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-80 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="space-y-3"
          >
            <h2 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              API settings
            </h2>
            <div>
              <label
                htmlFor="settings-base-url"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Base URL
              </label>
              <input
                id="settings-base-url"
                ref={baseUrlRef}
                type="url"
                defaultValue={settings.baseUrl}
                placeholder={DEFAULT_BASE_URL}
                onChange={(event) => {
                  if (!validateUrl(event.target.value)) {
                    event.target.setCustomValidity(
                      "Must start with http:// or https://",
                    );
                  } else {
                    event.target.setCustomValidity("");
                  }
                }}
                className="mt-1 w-full rounded-md border border-zinc-200 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
            <div>
              <label
                htmlFor="settings-timeout"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Timeout (ms)
              </label>
              <input
                id="settings-timeout"
                ref={timeoutRef}
                type="number"
                min={MIN_TIMEOUT_MS}
                max={MAX_TIMEOUT_MS}
                defaultValue={settings.timeoutMs}
                className="mt-1 w-full rounded-md border border-zinc-200 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                {MIN_TIMEOUT_MS}–{MAX_TIMEOUT_MS} ms
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
