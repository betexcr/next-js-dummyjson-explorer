"use client";

/**
 * Request history menu (TASK-024): lists recent requests from the bounded
 * in-memory store and restores their configuration on click. Only the
 * operation id and sanitized values are stored locally.
 */
import { useEffect, useRef, useState } from "react";
import { History, X } from "lucide-react";
import { getOperation } from "@/lib/dummyjson/registry";
import type { HistoryEntry } from "./history-store";

export interface HistoryMenuProps {
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryMenu({ entries, onRestore, onClear }: HistoryMenuProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Request history"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <History aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">History</span>
        {entries.length > 0 && (
          <span className="rounded-full bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {entries.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 flex max-h-96 w-80 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Recent requests
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClear}
                disabled={entries.length === 0}
                className="rounded px-1.5 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:hover:bg-zinc-800"
              >
                Clear
              </button>
              <button
                type="button"
                aria-label="Close history"
                onClick={() => setOpen(false)}
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {entries.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-zinc-500">
              No requests yet. Send one to see it here.
            </p>
          ) : (
            <ul aria-label="Recent requests list" className="min-h-0 flex-1 overflow-y-auto">
              {entries.map((entry) => {
                const operation = getOperation(entry.operationId);
                return (
                  <li key={entry.id} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/60">
                    <button
                      type="button"
                      aria-label={`Restore: ${operation?.name ?? entry.operationId}`}
                      onClick={() => {
                        onRestore(entry);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:hover:bg-zinc-800/60"
                    >
                      <span
                        className={`shrink-0 rounded px-1 font-mono text-[10px] font-semibold ${
                          entry.ok
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {entry.status ?? "ERR"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
                        {operation?.name ?? entry.operationId}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                        {formatTime(entry.timestamp)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}