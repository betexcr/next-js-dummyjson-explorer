/**
 * Shared credential classification tests.
 */
import { describe, expect, it } from "vitest";
import { isSensitiveKey, redactSensitiveJson } from "./sensitive";

describe("isSensitiveKey", () => {
  it("matches common credential header and field names", () => {
    expect(isSensitiveKey("Authorization")).toBe(true);
    expect(isSensitiveKey("x-api-key")).toBe(true);
    expect(isSensitiveKey("api_key")).toBe(true);
    expect(isSensitiveKey("client_secret")).toBe(true);
    expect(isSensitiveKey("access_token")).toBe(true);
    expect(isSensitiveKey("refresh_token")).toBe(true);
    expect(isSensitiveKey("id_token")).toBe(true);
    expect(isSensitiveKey("authToken")).toBe(true);
    expect(isSensitiveKey("auth-token")).toBe(true);
    expect(isSensitiveKey("auth_token")).toBe(true);
    expect(isSensitiveKey("sessionToken")).toBe(true);
    expect(isSensitiveKey("session-token")).toBe(true);
    expect(isSensitiveKey("session_token")).toBe(true);
    expect(isSensitiveKey("jwt")).toBe(true);
    expect(isSensitiveKey("privateKey")).toBe(true);
    expect(isSensitiveKey("x-auth-token")).toBe(true);
    expect(isSensitiveKey("x-access-token")).toBe(true);
    expect(isSensitiveKey("password")).toBe(true);
    expect(isSensitiveKey("key")).toBe(true);
    expect(isSensitiveKey("cookie")).toBe(true);
    expect(isSensitiveKey("csrf")).toBe(true);
  });

  it("does not match ordinary field names", () => {
    expect(isSensitiveKey("limit")).toBe(false);
    expect(isSensitiveKey("title")).toBe(false);
    expect(isSensitiveKey("id")).toBe(false);
  });
});

describe("redactSensitiveJson", () => {
  it("redacts credential-like values recursively", () => {
    const redacted = redactSensitiveJson(
      '{"username":"emilys","password":"pass","nested":{"apiKey":"k"}}',
    );
    const parsed = JSON.parse(redacted!);
    expect(parsed.username).toBe("emilys");
    expect(parsed.password).toBe("***REDACTED***");
    expect(parsed.nested.apiKey).toBe("***REDACTED***");
  });

  it("returns undefined for malformed JSON", () => {
    expect(redactSensitiveJson("not-json")).toBeUndefined();
  });
});
