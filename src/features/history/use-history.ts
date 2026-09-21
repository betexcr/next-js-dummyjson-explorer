"use client";

/**
 * In-memory + sessionStorage-backed history hook (TASK-024). The store layer
 * stays pure; this hook owns the storage side effects.
 */
import { useCallback, useState } from "react";
import {
  addEntry,
  HISTORY_STORAGE_KEY,
  loadHistory,
  type HistoryEntry,
} from "./history-store";

function readEntries(): HistoryEntry[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const entries = loadHistory(sessionStorage.getItem(HISTORY_STORAGE_KEY));
    // Rewrite sanitized entries back to storage so legacy secrets are evicted
    // on first load after a security update.
    writeEntries(entries);
    return entries;
  } catch {
    return [];
  }
}

function writeEntries(entries: HistoryEntry[]): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Best-effort; the in-memory list still works for the session.
  }
}

export interface UseHistoryResult {
  entries: HistoryEntry[];
  append: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  clear: () => void;
}

export function useHistory(): UseHistoryResult {
  const [entries, setEntries] = useState<HistoryEntry[]>(readEntries);

  const append = useCallback((entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const full: HistoryEntry = { ...entry, id, timestamp: Date.now() };
    setEntries((previous) => {
      const next = addEntry(previous, full);
      writeEntries(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    writeEntries([]);
  }, []);

  return { entries, append, clear };
}