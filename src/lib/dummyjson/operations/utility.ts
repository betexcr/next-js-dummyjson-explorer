import type { ApiOperation } from "../types";
import { op } from "./helpers";

const DOCS = "https://dummyjson.com/docs";

export const utilityOperations: ApiOperation[] = [
  op(
    "utility-test",
    "utility",
    "Test route",
    "GET",
    "/test",
    "Simple connectivity test. Works with any HTTP method and echoes the method back.",
    `${DOCS}#intro-test`,
    {
      parameters: [],
      responseKind: "json",
      tags: ["utility", "test", "health"],
    },
  ),
  op(
    "utility-ip",
    "utility",
    "Get client IP address",
    "GET",
    "/ip",
    "Returns the IP address and user agent of the client making the request.",
    `${DOCS}#intro-ip`,
    {
      parameters: [],
      responseKind: "json",
      tags: ["utility", "ip", "network"],
    },
  ),
];