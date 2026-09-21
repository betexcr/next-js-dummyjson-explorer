/**
 * Security header policy (TASK-039).
 *
 * Delivered by `next.config.ts` through `headers()`. This is defense in
 * depth: the primary protections are React/SVG-safe rendering, strict
 * request encoding, and storing the bearer token only in session storage —
 * the CSP additionally constrains what code can run and which origins the
 * page may talk to.
 *
 * The development policy intentionally omits the CSP: Next dev serves inline
 * module scripts and uses websocket HMR that a strict policy would block.
 * Playwright E2E runs against `next dev`, so the strict policy is enforced
 * only in production builds (`next start` or a hosting edge).
 *
 * Rationale for CSP choices:
 * - `script-src 'self' 'unsafe-inline'`: Next inlines its RSC
 *   bootstrap/hydration scripts in production (no nonce middleware here).
 *   `'unsafe-eval'` is never allowed. There are no third-party scripts.
 *   This is a deliberate, documented residual risk: a nonce-based policy
 *   would require Next.js middleware and complicate static export/edge
 *   hosting. The app contains no user-generated inline scripts, so the
 *   policy still blocks injected `<script>` blocks from untrusted data.
 * - `img-src 'self' data: blob:`: binary API responses are previewed via
 *   runtime-generated `blob:` URLs.
 * - `connect-src 'self' https://dummyjson.com`: the only outbound API origin.
 * - `frame-ancestors 'none'` + `X-Frame-Options: DENY`: no framing.
 * - No `upgrade-insecure-requests`: the app is often run locally over plain
 *   http (`next start` without TLS); the directive would rewrite same-origin
 *   asset requests to https and break self-hosted setups.
 */

export type SecurityEnvironment = "development" | "production";

export interface SecurityHeader {
  key: string;
  value: string;
}

/** The one outbound API origin the workbench talks to. */
export const API_ORIGIN = "https://dummyjson.com";

/** Builds the production Content-Security-Policy header value. */
export function buildCsp(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "object-src 'none'",
    `connect-src 'self' ${API_ORIGIN}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join("; ");
}

/**
 * Returns the header list for the given environment. Development gets
 * non-CSP hardening only; production adds the CSP and frame protection.
 */
export function buildSecurityHeaders(
  env: SecurityEnvironment,
): SecurityHeader[] {
  const harden: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "no-referrer" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()",
    },
  ];

  if (env === "development") {
    return harden;
  }

  return [
    { key: "Content-Security-Policy", value: buildCsp() },
    // Legacy fallback for browsers that ignore `frame-ancestors`.
    { key: "X-Frame-Options", value: "DENY" },
    ...harden,
  ];
}