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
      bearer: "token",
      "Proxy-Authorization": "Basic x",
    };
    const sanitized = sanitizeValues(values);
    expect(sanitized["limit"]).toBe("5");
    expect(sanitized["Authorization"]).toBeUndefined();
    expect(sanitized["X-Api-Key"]).toBeUndefined();
    expect(sanitized["bearer"]).toBeUndefined();
    expect(sanitized["Proxy-Authorization"]).toBeUndefined();
  });

  it("preserves non-credential values including request bodies", () => {
    const values: ParameterValues = {
      limit: "5",
      __body: '{"title":"Widget"}',
    };
    const sanitized = sanitizeValues(values);
    expect(sanitized["limit"]).toBe("5");
    expect(sanitized["__body"]).toBe('{"title":"Widget"}');
  });

  it("redacts credential-like fields inside request bodies", () => {
    const values: ParameterValues = {
      __body:
        '{"username":"emilys","password":"emilyspass","accessToken":"tok","refreshToken":"rt","nested":{"secret":"shh"}}',
    };
    const sanitized = sanitizeValues(values);
    const body = JSON.parse(sanitized["__body"] as string);
    expect(body.username).toBe("emilys");
    expect(body.password).toBe("***REDACTED***");
    expect(body.accessToken).toBe("***REDACTED***");
    expect(body.refreshToken).toBe("***REDACTED***");
    expect(body.nested.secret).toBe("***REDACTED***");
  });

  it("drops malformed bodies instead of persisting them verbatim", () => {
    const values: ParameterValues = { __body: "not-json" };
    const sanitized = sanitizeValues(values);
    expect(sanitized["__body"]).toBeUndefined();
  });
  it("redacts common credential keys such as apiKey and clientSecret", () => {
    const values: ParameterValues = {
      __body:
        '{"apiKey":"ak","clientSecret":"cs","id_token":"it","credential":"c"}',
    };
    const sanitized = sanitizeValues(values);
    const body = JSON.parse(sanitized["__body"] as string);
    expect(body.apiKey).toBe("***REDACTED***");
    expect(body.clientSecret).toBe("***REDACTED***");
    expect(body.id_token).toBe("***REDACTED***");
    expect(body.credential).toBe("***REDACTED***");
  });

  it("redacts TOTP secret keys in query parameters and bodies", () => {
    const queryValues: ParameterValues = { key: "JBSWY3DPEHPK3PXP" };
    expect(sanitizeValues(queryValues).key).toBeUndefined();

    const bodyValues: ParameterValues = {
      __body: '{"key":"JBSWY3DPEHPK3PXP","algorithm":"SHA-1"}',
    };
    const sanitized = sanitizeValues(bodyValues);
    const body = JSON.parse(sanitized["__body"] as string);
    expect(body.key).toBe("***REDACTED***");
    expect(body.algorithm).toBe("SHA-1");
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

  it("re-sanitizes previously persisted entries on load", () => {
    const stale = entry({
      values: {
        Authorization: "Bearer old-token",
        key: "JBSWY3DPEHPK3PXP",
        __body: '{"password":"old-pass"}',
        limit: "5",
      },
    });
    const loaded = loadHistory(JSON.stringify([stale]));
    expect(loaded).toHaveLength(1);
    expect(loaded[0].values.Authorization).toBeUndefined();
    expect(loaded[0].values.key).toBeUndefined();
    expect(loaded[0].values.limit).toBe("5");
    const body = JSON.parse(loaded[0].values["__body"] as string);
    expect(body.password).toBe("***REDACTED***");
  });
});