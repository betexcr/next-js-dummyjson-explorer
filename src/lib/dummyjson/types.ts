/**
 * Core types for the DummyJSON Workbench capability registry.
 *
 * The registry is the single source of truth for:
 * - navigation
 * - operation lookup
 * - request forms
 * - documentation metadata
 * - coverage tests
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * User-supplied parameter values keyed by parameter name. The special
 * `__body` key carries the raw JSON request body string for operations that
 * accept a body (see `request-builder.ts`).
 */
export type ParameterValues = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ParameterLocation = "path" | "query" | "header" | "body";

export type ParameterType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "json"
  | "select";

export interface ParameterDefinition {
  /** Name of the parameter (header name, query key, path placeholder key). */
  name: string;
  in: ParameterLocation;
  type: ParameterType;
  required?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  /** Allowed values for enum/select types. */
  options?: string[];
  /**
   * Path parameter that may be omitted entirely. When omitted, the whole
   * path segment is dropped (e.g. `/image/150` vs `/image/200x100/008080`).
   */
  optionalPathSegment?: boolean;
}

export interface BodyProperty {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "enum";
  required?: boolean;
  description?: string;
  example?: unknown;
  /** Element schema when type is "array". */
  items?: BodyProperty;
  /** Child schema when type is "object". */
  properties?: BodyProperty[];
}

export interface BodySchema {
  description?: string;
  /**
   * A complete example request body that the UI can load as a starting
   * point. Keys are always JSON-serializable.
   */
  example: Record<string, unknown>;
}

export type AuthRequirement = "none" | "optional" | "required";

export type ResponseKind = "json" | "json-list" | "binary";

export type GroupId =
  | "products"
  | "carts"
  | "recipes"
  | "users"
  | "posts"
  | "comments"
  | "todos"
  | "quotes"
  | "auth"
  | "image"
  | "http"
  | "tools"
  | "utility";

export interface ApiOperation {
  /** Stable unique id, e.g. `products-list`. */
  id: string;
  group: GroupId;
  name: string;
  method: HttpMethod;
  /**
   * Path template with `{placeholder}` segments, relative to the base URL,
   * e.g. `/products/{id}`.
   */
  path: string;
  summary: string;
  /** Link to the official documentation anchor, e.g. `https://dummyjson.com/docs/products#products-single`. */
  docsUrl: string;
  auth: AuthRequirement;
  /** When true, the operation supports the documented `/auth/{path}` route for authenticated requests. */
  supportsAuthRoute?: boolean;
  parameters?: ParameterDefinition[];
  requestBody?: BodySchema;
  responseKind?: ResponseKind;
  /** Free-form tags used by search/command palette. */
  tags?: string[];
}

export interface ApiGroup {
  id: GroupId;
  name: string;
  description: string;
  docsUrl: string;
}

export type Registry = {
  groups: ApiGroup[];
  operations: ApiOperation[];
};