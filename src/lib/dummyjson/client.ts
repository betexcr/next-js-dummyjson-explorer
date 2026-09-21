/**
 * DummyJSON API client (TASK-017).
 *
 * Centralizes URL construction, query serialization, headers, auth, body
 * encoding, cancellation, timeout, and response/error normalization. UI
 * components must not call `fetch` directly.
 */
import { buildRequest, BODY_PARAM, toUrl } from "@/lib/request/request-builder";
import {
  type ApiError,
  httpError,
  isApiError,
  type NormalizedResponse,
  normalizeResponse,
} from "@/lib/request/response";
import type { ApiOperation, ParameterValues } from "./types";

export const DEFAULT_BASE_URL = "https://dummyjson.com";

export interface ExecuteOptions {
  /** Overrides the default base URL (used by tests). */
  baseUrl?: string;
  /** Bearer token applied when the operation requires/accepts auth. */
  authToken?: string | null;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
  /** Timeout in milliseconds; requests are aborted after this. */
  timeoutMs?: number;
  /** Underlying fetch implementation (defaults to global fetch). */
  fetchFn?: typeof fetch;
}

export type ExecuteResult =
  | { ok: true; response: NormalizedResponse }
  | { ok: false; error: ApiError };

/** Maps an `AbortSignal` reason into a normalized ApiError. */
function toError(
  error: unknown,
  timedOut: boolean,
): ApiError {
  if (timedOut) {
    return { type: "timeout", message: "Request timed out." };
  }
  if (error instanceof Error && error.name === "AbortError") {
    return { type: "aborted", message: "Request was cancelled." };
  }
  return {
    type: "network",
    message:
      error instanceof Error ? error.message : "Network request failed.",
    cause: error,
  };
}

/**
 * Combines an external abort signal with an internal controller signal so a
 * timeout (which aborts the controller) and caller cancellation both work.
 */
function combineSignals(
  signal: AbortSignal | undefined,
  controller: AbortController,
): AbortSignal {
  if (!signal) return controller.signal;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, controller.signal]);
  }
  // Fallback for older runtimes: forward external aborts to the controller.
  signal.addEventListener("abort", () => controller.abort(), { once: true });
  return controller.signal;
}

/**
 * Executes an operation against the DummyJSON API and normalizes the result.
 *
 * Note on HTTP error statuses: they are returned as `ok: false` results with
 * a fully populated `NormalizedResponse` (status, headers, body), so callers
 * can render the failure detail. Only network/timeout/abort/parse failures
 * surface as `error` results.
 */
export async function executeOperation(
  op: ApiOperation,
  values: ParameterValues,
  options: ExecuteOptions = {},
): Promise<ExecuteResult> {
  const {
    baseUrl = DEFAULT_BASE_URL,
    authToken,
    signal,
    timeoutMs,
    fetchFn = fetch,
  } = options;

  let built;
  try {
    built = buildRequest({ op, values, basePath: baseUrl });
  } catch (cause) {
    return {
      ok: false,
      error: {
        type: "validation",
        message: cause instanceof Error ? cause.message : "Invalid request.",
        issues: [cause],
      },
    };
  }

  if (authToken && authToken.trim() !== "") {
    built.headers["Authorization"] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const signalToUse = combineSignals(signal, controller);
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  if (timeoutMs !== undefined && timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  const started = performance.now();
  try {
    const response = await fetchFn(toUrl(built), {
      method: built.method,
      headers: built.headers,
      body: built.body,
      signal: signalToUse,
    });
    const durationMs = performance.now() - started;
    const normalized = await normalizeResponse({
      response,
      durationMs,
      binary: op.responseKind === "binary",
    });

    if (!normalized.ok) {
      return { ok: false, error: httpError(normalized) };
    }
    return { ok: true, response: normalized };
  } catch (cause) {
    // Structured ApiError throws (e.g. invalid JSON bodies from
    // normalizeResponse) must surface as-is instead of being re-labeled as
    // generic network failures.
    return { ok: false, error: isApiError(cause) ? cause : toError(cause, timedOut) };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Convenience export used by request history records. */
export { BODY_PARAM };