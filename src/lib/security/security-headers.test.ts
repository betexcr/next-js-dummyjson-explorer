/**
 * Security header policy tests (TASK-039).
 *
 * Guards the defense-in-depth headers delivered by next.config.ts: the
 * production policy must be strict, the development policy must not break
 * Next dev HMR, and the CSP must never allow `unsafe-eval`.
 */
import { describe, expect, it } from "vitest";
import { buildCsp, buildSecurityHeaders } from "./security-headers";

describe("buildSecurityHeaders", () => {
  it("keeps the development policy free of a CSP so HMR keeps working", () => {
    const headers = buildSecurityHeaders("development");
    const byKey = new Map(headers.map((h) => [h.key, h.value]));
    expect(byKey.has("Content-Security-Policy")).toBe(false);
    expect(byKey.get("X-Content-Type-Options")).toBe("nosniff");
    expect(byKey.get("Referrer-Policy")).toBe("no-referrer");
    expect(byKey.has("Permissions-Policy")).toBe(true);
  });

  it("enforces a strict CSP and framing protection in production", () => {
    const headers = buildSecurityHeaders("production");
    const byKey = new Map(headers.map((h) => [h.key, h.value]));
    const csp = byKey.get("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).toContain("connect-src 'self' https://dummyjson.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(byKey.get("X-Frame-Options")).toBe("DENY");
    expect(byKey.get("X-Content-Type-Options")).toBe("nosniff");
    expect(byKey.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("never downgrades script policy with unsafe-eval", () => {
    expect(buildCsp()).not.toContain("unsafe-eval");
  });

  it("returns unique header keys for both environments", () => {
    for (const env of ["development", "production"] as const) {
      const keys = buildSecurityHeaders(env).map((h) => h.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});