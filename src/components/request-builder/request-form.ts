/**
 * Registry-driven request form helpers (TASK-022).
 *
 * These are pure functions that map operation metadata to form state and
 * back. They keep the React components lean and make the mapping
 * deterministic and unit-testable without a DOM.
 */
import {
  BODY_PARAM,
  USE_AUTH_ROUTE_PARAM,
} from "@/lib/request/request-builder";
import type {
  ApiOperation,
  ParameterDefinition,
  ParameterValues,
} from "@/lib/dummyjson/types";

export { BODY_PARAM, USE_AUTH_ROUTE_PARAM };

export interface GroupedParameters {
  path: ParameterDefinition[];
  query: ParameterDefinition[];
  header: ParameterDefinition[];
}

/** Splits an operation's declared parameters by location, in registry order. */
export function groupParameters(op: ApiOperation): GroupedParameters {
  const path: ParameterDefinition[] = [];
  const query: ParameterDefinition[] = [];
  const header: ParameterDefinition[] = [];
  for (const param of op.parameters ?? []) {
    if (param.in === "path") path.push(param);
    else if (param.in === "query") query.push(param);
    else header.push(param);
  }
  return { path, query, header };
}

/**
 * Produces the initial form values for an operation: declared defaults for
 * path/query/header parameters and the operation's documented example body
 * (TASK-025) under the `BODY_PARAM` sentinel when a body is accepted.
 */
export function defaultParameterValues(op: ApiOperation): ParameterValues {
  const values: ParameterValues = {};
  for (const param of op.parameters ?? []) {
    values[param.name] = param.defaultValue ?? "";
  }
  if (op.requestBody) {
    values[BODY_PARAM] = JSON.stringify(op.requestBody.example, null, 2);
  }
  if (op.supportsAuthRoute) {
    values[USE_AUTH_ROUTE_PARAM] = false;
  }
  return values;
}

/** Returns a message when the body text is not valid JSON, else null. */
export function validateJsonBody(
  text: string | null | undefined,
): string | null {
  if (text === undefined || text === null || text.trim() === "") return null;
  try {
    JSON.parse(text);
    return null;
  } catch {
    return "Body is not valid JSON.";
  }
}

/** True when a parameter value should be considered empty. */
export function isEmptyValue(value: ParameterValues[string]): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}