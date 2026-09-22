/**
 * User-configurable API settings (TASK-041 follow-up).
 *
 * Pure store helpers for base URL and request timeout. Settings are persisted
 * to localStorage so they survive reloads, but they are validated before use.
 */
import { DEFAULT_BASE_URL } from "@/lib/dummyjson/client";

export const SETTINGS_STORAGE_KEY = "djwb.settings";
export { DEFAULT_BASE_URL };
export const DEFAULT_TIMEOUT_MS = 30_000;
export const MIN_TIMEOUT_MS = 1_000;
export const MAX_TIMEOUT_MS = 120_000;

export interface AppSettings {
  baseUrl: string;
  timeoutMs: number;
}

export const defaultSettings: AppSettings = {
  baseUrl: DEFAULT_BASE_URL,
  timeoutMs: DEFAULT_TIMEOUT_MS,
};

function isValidBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    // A base URL for API requests must be an origin + optional pathname only:
    // no query string, fragment, username, or password.
    if (url.search !== "") return false;
    if (url.hash !== "") return false;
    if (url.username !== "" || url.password !== "") return false;
    return true;
  } catch {
    return false;
  }
}

function clampTimeout(value: number): number {
  if (!Number.isFinite(value) || value < MIN_TIMEOUT_MS) return MIN_TIMEOUT_MS;
  if (value > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return Math.round(value);
}

/** Sanitizes raw settings values into a safe, normalized record. */
export function normalizeSettings(raw: Partial<AppSettings>): AppSettings {
  const baseUrl =
    raw.baseUrl && isValidBaseUrl(raw.baseUrl) ? raw.baseUrl : DEFAULT_BASE_URL;
  const timeoutMs = clampTimeout(raw.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  return { baseUrl, timeoutMs };
}

function isSettingsRecord(value: unknown): value is AppSettings {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<AppSettings>;
  return (
    typeof record.baseUrl === "string" && typeof record.timeoutMs === "number"
  );
}

/** Loads settings from localStorage, falling back to defaults. */
export function loadSettings(raw: string | null): AppSettings {
  if (!raw) return defaultSettings;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSettingsRecord(parsed)) return defaultSettings;
    return normalizeSettings(parsed);
  } catch {
    return defaultSettings;
  }
}

/** Serializes settings for localStorage. */
export function saveSettings(settings: AppSettings): string {
  return JSON.stringify(normalizeSettings(settings));
}
