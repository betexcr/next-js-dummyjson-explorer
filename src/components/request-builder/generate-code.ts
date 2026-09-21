/**
 * Generates cURL and fetch() snippets from a BuiltRequest (TASK-022).
 * Pure string builders, exported for copy buttons and tests.
 */
import { toUrl, type BuiltRequest } from "@/lib/request/request-builder";

const doubleQuote = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** Single-quotes a value for the POSIX shell (used by curl args). */
const shellQuote = (value: string): string =>
  `'${value.replace(/'/g, `'\\''`)}'`;

/** Renders a request as a `curl` command line. */
export function generateCurl(built: BuiltRequest): string {
  const parts = ["curl", "--request", built.method];
  parts.push(doubleQuote(toUrl(built)));
  for (const [name, value] of Object.entries(built.headers)) {
    parts.push("--header", shellQuote(`${name}: ${value}`));
  }
  if (built.body !== undefined) {
    parts.push("--data", shellQuote(built.body));
  }
  return parts.join(" ");
}

/** Renders a request as an async `fetch(...)` snippet. */
export function generateFetch(built: BuiltRequest): string {
  const lines: string[] = [`fetch(${doubleQuote(toUrl(built))}, {`];
  lines.push(`  method: ${doubleQuote(built.method)},`);
  if (Object.keys(built.headers).length > 0) {
    lines.push(`  headers: ${JSON.stringify(built.headers, null, 2)}.`);
  }
  if (built.body !== undefined) {
    // The builder only emits valid JSON for bodies; re-serialize it so the
    // snippet is valid JS regardless of user formatting.
    lines.push(`  body: ${JSON.stringify(JSON.parse(built.body), null, 2)},`);
  }
  lines.push("});");
  return lines.join("\n");
}