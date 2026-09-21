/**
 * Shared credential-sensitive field classification.
 *
 * Used by history persistence and code-snippet generation so secrets are
 * not persisted to storage or copied to the clipboard. Keys are matched
 * case-insensitively and cover header, query, and JSON body field names.
 */

/** Case-insensitive regex for keys/headers that carry credentials or secrets. */
export const SENSITIVE_KEY =
  /^(authorization|bearer|proxy-authorization|x-api-key|x_api_key|api-key|api_key|apiKey|clientSecret|client-secret|client_secret|id_token|accessToken|access-token|access_token|refreshToken|refresh-token|refresh_token|authToken|auth-token|auth_token|sessionToken|session-token|session_token|jwt|privateKey|private-key|private_key|x-auth-token|x_auth_token|x-access-token|x_access_token|password|token|secret|key|credential|cookie|set-cookie|x-csrf-token|csrf)$/i;

/** True when `key` looks like it carries a credential or secret. */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

/**
 * Recursively redacts credential-like values from a JSON string.
 * Returns `undefined` for malformed JSON so callers can drop it.
 */
export function redactSensitiveJson(body: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(body);
    const redacted = redactSensitiveValue(parsed);
    return JSON.stringify(redacted);
  } catch {
    return undefined;
  }
}

function redactSensitiveValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValue);
  }
  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    out[key] = isSensitiveKey(key) ? "***REDACTED***" : redactSensitiveValue(val);
  }
  return out;
}
