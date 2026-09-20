import type {
  ApiOperation,
  BodySchema,
  HttpMethod,
  ParameterDefinition,
} from "../types";

/** Query parameter for pagination: `limit`. */
export function limitParam(
  description = "Number of items to return per page. Use `0` to return all items.",
): ParameterDefinition {
  return {
    name: "limit",
    in: "query",
    type: "number",
    required: false,
    description,
    placeholder: "30",
  };
}

/** Query parameter for pagination: `skip`. */
export function skipParam(): ParameterDefinition {
  return {
    name: "skip",
    in: "query",
    type: "number",
    required: false,
    description: "Number of items to skip for pagination.",
    placeholder: "0",
  };
}

/** Query parameter for field selection: `select`. */
export function selectParam(): ParameterDefinition {
  return {
    name: "select",
    in: "query",
    type: "select",
    required: false,
    description:
      "Comma-separated list of fields to include in the response, e.g. `title,price`. May be repeated.",
    placeholder: "title,price",
  };
}

/** Query parameter for sorting: `sortBy`. */
export function sortByParam(fieldHint = "field name"): ParameterDefinition {
  return {
    name: "sortBy",
    in: "query",
    type: "string",
    required: false,
    description: `Sort results by a ${fieldHint}, e.g. \`title\`.`,
    placeholder: "title",
  };
}

/** Query parameter for sort direction: `order`. */
export function orderParam(): ParameterDefinition {
  return {
    name: "order",
    in: "query",
    type: "enum",
    required: false,
    description: "Sort order. Only applies when `sortBy` is provided.",
    options: ["asc", "desc"],
    defaultValue: "asc",
  };
}

/** Query parameter for artificial delay (works on every endpoint). */
export function delayParam(): ParameterDefinition {
  return {
    name: "delay",
    in: "query",
    type: "number",
    required: false,
    description: "Simulate a response delay between 0 and 5000 milliseconds.",
    placeholder: "0",
  };
}

/** Standard parameters documented for list endpoints. */
export function listParams(opts?: {
  sort?: boolean;
  extra?: ParameterDefinition[];
}): ParameterDefinition[] {
  const params: ParameterDefinition[] = [
    limitParam(),
    skipParam(),
    selectParam(),
  ];
  if (opts?.sort) {
    params.push(sortByParam(), orderParam());
  }
  if (opts?.extra) {
    params.push(...opts.extra);
  }
  params.push(delayParam());
  return params;
}

/** Path parameter for a resource id. */
export function pathId(
  name: string,
  description: string,
): ParameterDefinition {
  return {
    name,
    in: "path",
    type: "string",
    required: true,
    description,
    placeholder: "1",
  };
}

/** Helper to build an operation tuple. */
export function op(
  id: string,
  group: ApiOperation["group"],
  name: string,
  method: HttpMethod,
  path: string,
  summary: string,
  docsUrl: string,
  extra?: Partial<ApiOperation>,
): ApiOperation {
  return {
    id,
    group,
    name,
    method,
    path,
    summary,
    docsUrl,
    auth: "none",
    responseKind: "json-list",
    ...extra,
  };
}

/** Helper to build a JSON request body schema. */
export function body(example: Record<string, unknown>, extra?: Partial<BodySchema>): BodySchema {
  return { example, ...extra };
}