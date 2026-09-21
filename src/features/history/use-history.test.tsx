// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHistory } from "./use-history";
import { HISTORY_STORAGE_KEY } from "./history-store";

describe("useHistory", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("crypto", {
      randomUUID: () => "00000000-0000-0000-0000-000000000000",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sanitizes legacy entries and rewrites them to storage on first load", () => {
    const stale = {
      id: "e1",
      timestamp: 1000,
      operationId: "products-list",
      values: {
        limit: "5",
        Authorization: "Bearer old-token",
        key: "secret",
      },
      ok: true,
      status: 200,
      durationMs: 12,
    };
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([stale]));

    renderHook(() => useHistory());

    const rewritten = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    expect(rewritten).not.toContain("old-token");
    expect(rewritten).not.toContain('"key":"secret"');
    expect(rewritten).toContain('"limit":"5"');
  });
});
