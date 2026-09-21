import { describe, expect, it } from "vitest";
import {
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from "./favorites-store";

describe("favorites store", () => {
  it("round-trips sets through JSON", () => {
    const saved = saveFavorites(new Set(["a", "b"]));
    expect(loadFavorites(saved)).toEqual(new Set(["a", "b"]));
  });

  it("ignores malformed payloads", () => {
    expect(loadFavorites("nope")).toEqual(new Set());
    expect(loadFavorites(JSON.stringify({ a: 1 }))).toEqual(new Set());
    expect(loadFavorites(JSON.stringify([1, "ok", null]))).toEqual(
      new Set(["ok"]),
    );
  });

  it("toggles membership immutably", () => {
    const original = new Set(["a"]);
    const next = toggleFavorite(original, "a");
    expect(original.has("a")).toBe(true);
    expect(next.has("a")).toBe(false);
    expect(toggleFavorite(next, "a").has("a")).toBe(true);
  });
});