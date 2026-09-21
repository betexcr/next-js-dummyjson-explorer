/**
 * Bounded local request history (TASK-024).
 *
 * Pure store helpers: add/evict/serialize/deserialize plus value sanitizing
 * so secrets (Authorization headers, bearer-style strings, TOTP keys, etc.)
 * are never persisted.
 */
import type { ParameterValues } from "@/lib/dummyjson/types";
import {
  isSensitiveKey,
  redactSensitiveJson,
} from "@/lib/security/sensitive";

export const HISTORY_STORAGE_KEY = "djwb.history";
export const MAX_HISTORY_ENTRIES = 100;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  operationId: string;
  values: ParameterValues;
  ok: boolean;
  status: number | null;
  durationMs: number;
}

/** Redacts request values that carry credentials. */
export function sanitizeValues(values: ParameterValues): ParameterValues {
  const out: ParameterValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (isSensitiveKey(key)) continue;
    if (key === "__body" && typeof value === "string") {
      const sanitizedBody = redactSensitiveJson(value);
      if (sanitizedBody !== undefined) out[key] = sanitizedBody;
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Prepends an entry and evicts old entries beyond the bound. */
export function addEntry(
  entries: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  return [entry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<HistoryEntry>;
  return (
    typeof record.id === "string" &&
    typeof record.timestamp === "number" &&
    typeof record.operationId === "string" &&
    typeof record.values === "object" &&
    record.values !== null &&
    typeof record.ok === "boolean" &&
    (record.status === null || typeof record.status === "number") &&
    typeof record.durationMs === "number"
  );
}

/**
 * Loads and validates entries from a raw localStorage payload. Each entry is
 * re-sanitized so secrets persisted by older versions of the app are not
 * replayed or displayed verbatim.
 */
export function loadHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isHistoryEntry)
      .map((entry) => ({ ...entry, values: sanitizeValues(entry.values) }));
  } catch {
    return [];
  }
}
