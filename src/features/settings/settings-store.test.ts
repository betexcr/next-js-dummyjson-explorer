import { describe, expect, it } from "vitest";
import {
  defaultSettings,
  loadSettings,
  MAX_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  normalizeSettings,
  saveSettings,
} from "./settings-store";

describe("settings store", () => {
  it("normalizes invalid base URLs back to the default", () => {
    expect(normalizeSettings({ baseUrl: "not-a-url" }).baseUrl).toBe(
      defaultSettings.baseUrl,
    );
    expect(normalizeSettings({ baseUrl: "ftp://example.com" }).baseUrl).toBe(
      defaultSettings.baseUrl,
    );
  });

  it("accepts valid http/https base URLs", () => {
    expect(normalizeSettings({ baseUrl: "http://localhost:3000" }).baseUrl).toBe(
      "http://localhost:3000",
    );
    expect(
      normalizeSettings({ baseUrl: "https://example.com/api" }).baseUrl,
    ).toBe("https://example.com/api");
  });

  it("rejects base URLs with query strings, fragments, or credentials", () => {
    expect(normalizeSettings({ baseUrl: "https://example.com?x=1" }).baseUrl).toBe(
      defaultSettings.baseUrl,
    );
    expect(normalizeSettings({ baseUrl: "https://example.com#frag" }).baseUrl).toBe(
      defaultSettings.baseUrl,
    );
    expect(
      normalizeSettings({ baseUrl: "https://user:pass@example.com" }).baseUrl,
    ).toBe(defaultSettings.baseUrl);
  });

  it("clamps timeouts to the allowed range", () => {
    expect(normalizeSettings({ timeoutMs: 100 }).timeoutMs).toBe(MIN_TIMEOUT_MS);
    expect(normalizeSettings({ timeoutMs: 999_999 }).timeoutMs).toBe(
      MAX_TIMEOUT_MS,
    );
    expect(normalizeSettings({ timeoutMs: 15_000 }).timeoutMs).toBe(15_000);
  });

  it("loads valid payloads and falls back for malformed ones", () => {
    const payload = saveSettings({
      baseUrl: "https://example.com",
      timeoutMs: 10_000,
    });
    expect(loadSettings(payload)).toEqual({
      baseUrl: "https://example.com",
      timeoutMs: 10_000,
    });
    expect(loadSettings("not json")).toEqual(defaultSettings);
    expect(loadSettings(null)).toEqual(defaultSettings);
    expect(loadSettings('{"baseUrl":"foo"}')).toEqual(defaultSettings);
  });
});
