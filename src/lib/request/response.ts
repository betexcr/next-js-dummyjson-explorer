/**
 * Response processing (TASK-019).
 *
 * Normalizes raw `fetch` outcomes into a structured result with status,
 * timing, headers, parsed body, raw text, and a discriminated error union.
 * All errors preserve enough detail for the UI to render useful messages.
 */

export type ResponseBodyKind = "json" | "text" | "binary";

export interface NormalizedResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  /** Wall-clock duration of the request, in milliseconds. */
  durationMs: number;
  /** Parsed body: JSON value for JSON responses, text otherwise. */
  body: unknown;
  /** Raw body text (empty for binary responses). */
  raw: string;
  kind: ResponseBodyKind;
  /** Present only for binary responses. */
  binaryData?: ArrayBuffer;
}

export type ApiError =
  | { type: "network"; message: string; cause?: unknown }
  | { type: "timeout"; message: string }
  | { type: "aborted"; message: string }
  | {
      type: "http";
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: unknown;
      raw: string;
      kind: ResponseBodyKind;
      durationMs: number;
      message: string;
    }
  | { type: "invalid-json"; message: string; raw: string }
  | { type: "validation"; message: string; issues: unknown[] };

/** True when `value` is a structured ApiError (e.g. thrown by a helper). */
export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return (
    type === "network" ||
    type === "timeout" ||
    type === "aborted" ||
    type === "http" ||
    type === "invalid-json" ||
    type === "validation"
  );
}

/** Reads a `Headers` instance into a plain record. */
export function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function summarizeHttpError(
  status: number,
  statusText: string,
  body: unknown,
): string {
  if (body !== null && typeof body === "object") {
    const maybe = body as Record<string, unknown>;
    if (typeof maybe["message"] === "string" && maybe["message"].length > 0) {
      return maybe["message"] as string;
    }
  }
  const fallback = statusText.trim() || "Request failed";
  return `${fallback} (HTTP ${status})`;
}

export interface NormalizeResponseInput {
  response: Response;
  durationMs: number;
  /** When true, the body is captured as an `ArrayBuffer` (image/SVG). */
  binary?: boolean;
}

/**
 * Normalizes a successfully returned `fetch` response. HTTP error statuses
 * are NOT thrown here — they are represented as `ok: false` responses so the
 * UI can still render status, headers, and body. Network-level failures are
 * thrown as `ApiError` by the caller instead.
 */
export async function normalizeResponse(
  input: NormalizeResponseInput,
): Promise<NormalizedResponse> {
  const { response, durationMs, binary = false } = input;

  if (binary) {
    const data = await response.arrayBuffer();
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: headersToRecord(response.headers),
      durationMs,
      body: undefined,
      raw: "",
      kind: "binary",
      binaryData: data,
    };
  }

  const raw = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  let body: unknown = raw;
  let kind: ResponseBodyKind = "text";
  if (contentType.includes("json")) {
    kind = "json";
    if (raw.trim() === "") {
      body = null;
    } else {
      try {
        body = JSON.parse(raw) as unknown;
      } catch {
        // A successful response with a malformed JSON body is a transport
        // problem. For HTTP error responses the status/statusText are the
        // primary signal, so fall back to raw text instead of masking them
        // with an invalid-json error.
        if (!response.ok) {
          kind = "text";
        } else {
          throw {
            type: "invalid-json",
            message: "Response body is not valid JSON.",
            raw,
          } satisfies ApiError;
        }
      }
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: headersToRecord(response.headers),
    durationMs,
    body,
    raw,
    kind,
  };
}

/** Builds the normalized error record for a non-2xx HTTP response. */
export function httpError(
  response: NormalizedResponse,
): ApiError {
  return {
    type: "http",
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: response.body,
    raw: response.raw,
    kind: response.kind,
    durationMs: response.durationMs,
    message: summarizeHttpError(
      response.status,
      response.statusText,
      response.body,
    ),
  };
}