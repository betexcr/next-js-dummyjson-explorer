"use client";

/**
 * localStorage-backed favorites hook (TASK-027). The store layer stays pure;
 * this hook owns the storage side effects and returns an immutable Set.
 */
import { useCallback, useState } from "react";
import {
  FAVORITES_STORAGE_KEY,
  loadFavorites,
  saveFavorites,
  toggleFavorite as toggleFavoriteStored,
} from "./favorites-store";

function readFavorites(): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  try {
    return loadFavorites(localStorage.getItem(FAVORITES_STORAGE_KEY));
  } catch {
    return new Set();
  }
}

function writeFavorites(favorites: ReadonlySet<string>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, saveFavorites(favorites));
  } catch {
    // Best-effort; favorites still work for the session.
  }
}

export interface UseFavoritesResult {
  favoriteIds: ReadonlySet<string>;
  toggleFavorite: (id: string) => void;
}

export function useFavorites(): UseFavoritesResult {
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(
    readFavorites,
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((previous) => {
      const next = toggleFavoriteStored(previous, id);
      writeFavorites(next);
      return next;
    });
  }, []);

  return { favoriteIds, toggleFavorite };
}