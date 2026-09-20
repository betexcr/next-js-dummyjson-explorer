import type { ApiOperation } from "../types";
import { op } from "./helpers";

const DOCS = "https://dummyjson.com/docs/http";

export const httpOperations: ApiOperation[] = [
  op(
    "http-status",
    "http",
    "Mock / custom HTTP response",
    "GET",
    "/http/{status}/{message}",
    "Echoes a response with the requested HTTP status code and an optional custom message, e.g. `/http/404` or `/http/404/Hello_Peter`. Useful for testing error handling and custom mock responses.",
    `${DOCS}#http-mock`,
    {
      parameters: [
        {
          name: "status",
          in: "path",
          type: "number",
          required: true,
          description: "Any 3-digit HTTP status code, e.g. `404` or `500`.",
          placeholder: "404",
        },
        {
          name: "message",
          in: "path",
          type: "string",
          required: false,
          optionalPathSegment: true,
          description:
            "Optional custom message returned in the response body. When omitted only the default status message is returned.",
          placeholder: "Hello_Peter",
        },
      ],
      responseKind: "json",
      tags: ["http", "status", "mock", "testing"],
    },
  ),
];