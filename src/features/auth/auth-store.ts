/**
 * Authenticated session helpers (TASK-030 subset).
 *
 * The access token lives in memory for the session and is mirrored to
 * sessionStorage so a refresh keeps the user signed in, without persisting
 * credentials to localStorage.
 */
import type { ParameterValues } from "@/lib/dummyjson/types";
import { BODY_PARAM } from "@/lib/request/request-builder";

export const AUTH_STORAGE_KEY = "djwb.session";

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface StoredAuth {
  token: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface LoginCredentials {
  username: string;
  password: string;
  expiresInMins?: number;
}

/** Serializes login form fields into the `auth-login` request body values. */
export function loginBody(credentials: LoginCredentials): ParameterValues {
  const body: Record<string, unknown> = {
    username: credentials.username,
    password: credentials.password,
  };
  if (credentials.expiresInMins) {
    body["expiresInMins"] = credentials.expiresInMins;
  }
  return { [BODY_PARAM]: JSON.stringify(body) };
}

function isStoredAuth(value: unknown): value is StoredAuth {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<StoredAuth>;
  return typeof record.token === "string" && record.token.length > 0;
}

/** Loads a previously persisted session (null when absent or malformed). */
export function loadAuth(): StoredAuth | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredAuth(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persists a session (null clears it). */
export function saveAuth(auth: StoredAuth | null): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (auth === null) sessionStorage.removeItem(AUTH_STORAGE_KEY);
    else sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Persistence is best-effort; the in-memory token still works.
  }
}