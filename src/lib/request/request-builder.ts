/**
 * Request builder (TASK-018).
 *
 * Turns registry operation metadata plus user-supplied parameter values into
 * an executable HTTP request. This is the single place where path
 * substitution, query encoding, header collection, and body serialization
 * happen — UI screens must not duplicate this logic.
 */
import type {
  ApiOperation,
  HttpMethod,
  ParameterValues,
} from "../dummyjson/types";

/** Key carrying the raw JSON request body string. */
export const BODY_PARAM = "__body";
export const USE_AUTH_ROUTE_PARAM = "__useAuthRoute";

export interface BuiltRequest {
  method: HttpMethod;
  /** URL path with placeholders substituted, e.g. `/products/5`. */
  pathname: string;
  /** Query parameters in insertion order. */
  query: [string, string][];
  /** Final headers (body content-type included when a body exists). */
  headers: Record<string, string>;
  /** Serialized JSON body when the operation accepts one. */
  body?: string;
}

export class RequestBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestBuildError";
  }
}

function joinBasePath(base: string, pathname: string): string {
  const trimmed = base.trim();
  if (trimmed === "" || trimmed === "/") return pathname;
  const url = new URL(trimmed);
  if (url.search !== "" || url.hash !== "") {
    throw new RequestBuildError(
      "Base URL must not contain query parameters or a fragment.",
    );
  }
  if (url.username !== "" || url.password !== "") {
    throw new RequestBuildError("Base URL must not contain credentials.");
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}${pathname}`;
  return url.toString();
}

function encodePathSegment(value: string): string {
  // encodeURIComponent also escapes `!` `'` `(` `)` `*` which are legal in
  // path segments; use the RFC 3986-safe form for predictable URLs.
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Substitutes `{placeholder}` values into a path template.
 *
 * A segment that consists of a single optional path parameter is dropped
 * entirely when its value is empty. Composite segments such as
 * `{width}x{height}` replace each placeholder individually.
 */
export function substitutePath(
  op: ApiOperation,
  values: ParameterValues,
): string {
  const pathParams = (op.parameters ?? []).filter(
    (p) => p.in === "path",
  );
  const byName = new Map(pathParams.map((p) => [p.name, p]));

  const segments = op.path.split("/");
  const built = segments.map((segment) => {
    if (!segment.includes("{")) return segment;

    const placeholders = segment.match(/\{([^}]+)\}/g) ?? [];
    // A segment made of exactly one optional placeholder is removed when the
    // value is empty. Composite segments never drop.
    if (placeholders.length === 1) {
      const name = placeholders[0].slice(1, -1);
      const def = byName.get(name);
      const raw = values[name];
      if (def?.optionalPathSegment && isValueEmpty(raw)) {
        return null;
      }
    }

    let result = segment;
    for (const placeholder of placeholders) {
      const name = placeholder.slice(1, -1);
      const raw = values[name];
      if (isValueEmpty(raw)) {
        throw new RequestBuildError(
          `Missing required path parameter "${name}" for ${op.id}.`,
        );
      }
      result = result.replace(placeholder, encodePathSegment(String(raw)));
    }
    return result;
  });

  return built.filter((s): s is string => s !== null).join("/");
}

/** True when a value is missing or blank. */
function isValueEmpty(raw: ParameterValues[string]): boolean {
  return (
    raw === undefined ||
    raw === null ||
    (typeof raw === "string" && raw.trim() === "")
  );
}

/** Collects query parameters with non-empty values, in registry order. */
export function buildQuery(
  op: ApiOperation,
  values: ParameterValues,
): [string, string][] {
  const query: [string, string][] = [];
  for (const param of op.parameters ?? []) {
    if (param.in !== "query") continue;
    const raw = values[param.name];
    if (raw === undefined || raw === null) continue;
    const text = String(raw).trim();
    if (text === "") continue;
    query.push([param.name, text]);
  }
  return query;
}

/** Collects header parameter values, in registry order. */
export function buildHeaders(
  op: ApiOperation,
  values: ParameterValues,
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const param of op.parameters ?? []) {
    if (param.in !== "header") continue;
    const raw = values[param.name];
    if (raw === undefined || raw === null) continue;
    const text = String(raw).trim();
    if (text === "") continue;
    headers[param.name] = text;
  }
  return headers;
}

export interface BuildRequestInput {
  op: ApiOperation;
  values: ParameterValues;
  /** Base path prefix, e.g. the API base URL. Defaults to `/`. */
  basePath?: string;
}

/** Throws when a required query or header parameter is empty. */
function validateRequiredParameters(
  op: ApiOperation,
  values: ParameterValues,
): void {
  for (const param of op.parameters ?? []) {
    if (param.in !== "query" && param.in !== "header") continue;
    if (!param.required) continue;
    const raw = values[param.name];
    if (isValueEmpty(raw)) {
      throw new RequestBuildError(
        `Missing required ${param.in} parameter "${param.name}" for ${op.id}.`,
      );
    }
  }
}

/**
 * Builds an executable request from registry metadata. Throws
 * `RequestBuildError` for invalid or unsupported inputs.
 */
export function buildRequest(input: BuildRequestInput): BuiltRequest {
  const { op, values, basePath = "" } = input;

  validateRequiredParameters(op, values);
  const useAuthRoute = Boolean(values[USE_AUTH_ROUTE_PARAM]);
  const effectivePath =
    useAuthRoute && op.supportsAuthRoute ? `/auth${op.path}` : op.path;
  const pathname = substitutePath({ ...op, path: effectivePath }, values);
  const query = buildQuery(op, values);
  const headers = buildHeaders(op, values);

  const bodyRaw = values[BODY_PARAM];
  let body: string | undefined;

  if (bodyRaw !== undefined && bodyRaw !== null && String(bodyRaw).trim() !== "") {
    const text = String(bodyRaw);
    // Accept either a JSON string or an already-parsed object/array.
    if (typeof text === "string") {
      try {
        const parsed: unknown = JSON.parse(text);
        body = JSON.stringify(parsed);
      } catch {
        throw new RequestBuildError(
          `Request body for ${op.id} is not valid JSON.`,
        );
      }
    } else {
      body = JSON.stringify(bodyRaw);
    }
    headers["Content-Type"] = "application/json";
  } else if (op.requestBody) {
    throw new RequestBuildError(
      `Operation ${op.id} requires a JSON request body.`,
    );
  }

  return {
    method: op.method,
    pathname: joinBasePath(basePath, pathname),
    query,
    headers,
    body,
  };
}

/** Serializes a built request into a full URL string. */
export function toUrl(built: BuiltRequest): string {
  const search = new URLSearchParams(built.query).toString();
  return `${built.pathname}${search ? `?${search}` : ""}`;
}