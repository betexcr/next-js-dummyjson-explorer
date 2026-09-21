/**
 * Generates cURL and fetch() snippets from a BuiltRequest (TASK-022).
 * Pure string builders, exported for copy buttons and tests.
 *
 * Credential-bearing headers, query parameters, and JSON body fields are
 * redacted so copied snippets do not leak secrets to the clipboard.
 */
import {
  isSensitiveKey,
  redactSensitiveJson,
} from "@/lib/security/sensitive";
import { toUrl, type BuiltRequest } from "@/lib/request/request-builder";

const doubleQuote = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** Single-quotes a value for the POSIX shell (used by curl args). */
const shellQuote = (value: string): string =>
  `'${value.replace(/'/g, `'\\''`)}'`;

/** Returns a header record with credential-bearing values redacted. */
function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    out[name] = isSensitiveKey(name) ? "***REDACTED***" : value;
  }
  return out;
}

/** Returns a query array with credential-bearing values redacted. */
function redactQuery(query: [string, string][]): [string, string][] {
  return query.map(([name, value]) => [
    name,
    isSensitiveKey(name) ? "***REDACTED***" : value,
  ]);
}

/**
 * Returns a BuiltRequest clone with sensitive headers, query params, and body
 * fields redacted, suitable for display/copy. Malformed bodies are dropped
 * rather than emitted verbatim because they may contain unreached secrets.
 */
function redactBuiltRequest(built: BuiltRequest): BuiltRequest {
  const headers = redactHeaders(built.headers);
  const query = redactQuery(built.query);
  const body =
    built.body !== undefined ? redactSensitiveJson(built.body) : undefined;
  return { ...built, headers, query, body };
}

/** Renders a request as a `curl` command line. */
export function generateCurl(built: BuiltRequest): string {
  const safe = redactBuiltRequest(built);
  const parts = ["curl", "--request", safe.method];
  parts.push(doubleQuote(toUrl(safe)));
  for (const [name, value] of Object.entries(safe.headers)) {
    parts.push("--header", shellQuote(`${name}: ${value}`));
  }
  if (safe.body !== undefined) {
    parts.push("--data", shellQuote(safe.body));
  }
  return parts.join(" ");
}

/** Renders a request as an async `fetch(...)` snippet. */
export function generateFetch(built: BuiltRequest): string {
  const safe = redactBuiltRequest(built);
  const lines: string[] = [`fetch(${doubleQuote(toUrl(safe))}, {`];
  lines.push(`  method: ${doubleQuote(safe.method)},`);
  if (Object.keys(safe.headers).length > 0) {
    lines.push(`  headers: ${JSON.stringify(safe.headers, null, 2)},`);
  }
  if (safe.body !== undefined) {
    // The builder only emits valid JSON for bodies; re-serialize it so the
    // snippet is valid JS regardless of user formatting.
    lines.push(`  body: ${JSON.stringify(JSON.parse(safe.body), null, 2)},`);
  }
  lines.push("});");
  return lines.join("\n");
}
