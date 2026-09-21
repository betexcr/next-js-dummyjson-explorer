import { describe, expect, it } from "vitest";
import type { ParameterValues } from "@/lib/dummyjson/types";
import {
  addEntry,
  loadHistory,
  MAX_HISTORY_ENTRIES,
  sanitizeValues,
  type HistoryEntry,
} from "./history-store";

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "e1",
    timestamp: 1000,
    operationId: "products-list",
    values: { limit: "5" },
    ok: true,
    status: 200,
    durationMs: 12,
    ...overrides,
  };
}

describe("history store", () => {
  it("prepends entries and evicts beyond the bound", () => {
    let entries: HistoryEntry[] = [];
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 10; i += 1) {
      entries = addEntry(entries, entry({ id: `e${i}` }));
    }
    expect(entries).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(entries[0].id).toBe(`e${MAX_HISTORY_ENTRIES + 9}`);
  });

  it("sanitizes credential-bearing values before persistence", () => {
    const values: ParameterValues = {
      limit: "5",
      Authorization: "Bearer secret",
      "X-Api-Key": "k",
    };
    const sanitized = sanitizeValues(values);
    expect(sanitized["limit"]).toBe("5");
    expect(sanitized["Authorization"]).toBeUndefined();
    expect(sanitized["X-Api-Key"]).toBeUndefined();
  });

  it("loads valid payloads and ignores malformed ones", () => {
    const payload = JSON.stringify([entry(), { junk: true }, 42]);
    const loaded = loadHistory(payload);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].operationId).toBe("products-list");
    expect(loadHistory("not json")).toEqual([]);
    expect(loadHistory(null)).toEqual([]);
    expect(loadHistory(JSON.stringify({ a: 1 }))).toEqual([]);
  });
});