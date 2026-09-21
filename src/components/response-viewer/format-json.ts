/**
 * Response formatting helpers (TASK-023). Pure and DOM-free so they can be
 * unit-tested directly.
 */

/** Formats an arbitrary JSON value for display with 2-space indentation. */
export function formatJson(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "bigint") return String(value);
  if (typeof value === "string") {
    // Already-rendered text (raw response bodies) must stay untouched.
    return value;
  }
  try {
    const formatted = JSON.stringify(value, null, 2);
    return formatted ?? String(value);
  } catch {
    return String(value);
  }
}

/** Raw size guard threshold (bytes) above which tree rendering is disabled. */
export const LARGE_RESPONSE_THRESHOLD = 1_000_000;

/** Returns a defensive count of JSON list items, or null for non-arrays. */
export function listLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null;
}