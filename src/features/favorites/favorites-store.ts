/**
 * Favorites storage helpers (localStorage-backed set of operation ids).
 * Pure functions, unit-testable without a DOM.
 */
export const FAVORITES_STORAGE_KEY = "djwb.favorites";

/** Loads a set of operation ids from a raw localStorage payload. */
export function loadFavorites(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((item): item is string => typeof item === "string"),
    );
  } catch {
    return new Set();
  }
}

/** Serializes a set of operation ids for localStorage. */
export function saveFavorites(favorites: ReadonlySet<string>): string {
  return JSON.stringify([...favorites]);
}

/** Toggles membership and returns a new set. */
export function toggleFavorite(
  favorites: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(favorites);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}