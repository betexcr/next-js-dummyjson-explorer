import type { ApiOperation } from "../types";
import { body, op } from "./helpers";

const DOCS = "https://dummyjson.com/docs/tools";

export const toolsOperations: ApiOperation[] = [
  op(
    "tools-2fa-get",
    "tools",
    "Generate TOTP code (GET)",
    "GET",
    "/2fa",
    "Generate a real TOTP verification code from a base32 secret key. Also available at `/totp`.",
    `${DOCS}#tools-2fa-get`,
    {
      parameters: [
        {
          name: "key",
          in: "query",
          type: "string",
          required: true,
          description:
            "Base32 secret key or otpauth URI, e.g. `JBSWY3DPEHPK3PXP`.",
          placeholder: "JBSWY3DPEHPK3PXP",
        },
      ],
      responseKind: "json",
      tags: ["tools", "2fa", "totp"],
    },
  ),
  op(
    "tools-2fa-post",
    "tools",
    "Generate TOTP code (POST)",
    "POST",
    "/2fa",
    "Generate a TOTP code by sending the secret in the request body — keeps the key out of URLs.",
    `${DOCS}#tools-2fa-post`,
    {
      parameters: [],
      requestBody: body({
        key: "JBSWY3DPEHPK3PXP",
      }),
      responseKind: "json",
      tags: ["tools", "2fa", "totp"],
    },
  ),
  op(
    "tools-custom-generate",
    "tools",
    "Create custom mock API",
    "POST",
    "/c/generate",
    "Create a mock REST API by sending a JSON response body and preferred HTTP method. Returns a unique URL you can call.",
    `${DOCS}#tools-custom-generate`,
    {
      parameters: [],
      requestBody: body(
        {
          json: { message: "Hello from my custom API" },
          method: "GET",
        },
        {
          description:
            "`json` is the payload the mock endpoint returns; `method` must be one of GET, POST, PUT, PATCH, DELETE. Maximum payload size is 300 KB.",
        },
      ),
      responseKind: "json",
      tags: ["tools", "custom response", "mock"],
    },
  ),
  op(
    "tools-custom-use",
    "tools",
    "Call custom mock API",
    "GET",
    "/c/{id}",
    "Call a previously generated custom mock endpoint with the method chosen at creation time. The response is the `json` payload provided to `/c/generate`.",
    `${DOCS}#tools-custom-use`,
    {
      parameters: [
        {
          name: "id",
          in: "path",
          type: "string",
          required: true,
          description: "Custom endpoint id returned by `/c/generate`, e.g. `f4d8-2771-4d04-addf`.",
          placeholder: "f4d8-2771-4d04-addf",
        },
      ],
      responseKind: "json",
      tags: ["tools", "custom response", "mock"],
    },
  ),
  op(
    "tools-webhook-create",
    "tools",
    "Create webhook endpoint",
    "POST",
    "/webhook/create",
    "Create a temporary webhook URL to capture and inspect incoming HTTP requests. Webhooks expire after 1 day.",
    `${DOCS}#tools-webhook-create`,
    {
      parameters: [],
      responseKind: "json",
      tags: ["tools", "webhook"],
    },
  ),
  op(
    "tools-webhook-capture",
    "tools",
    "Capture a webhook request",
    "POST",
    "/webhook/{identifier}",
    "Send any HTTP request to a webhook URL. The request is stored and a `received` acknowledgement is returned. All HTTP methods are supported.",
    `${DOCS}#tools-webhook-capture`,
    {
      parameters: [
        {
          name: "identifier",
          in: "path",
          type: "string",
          required: true,
          description: "Webhook identifier from `/webhook/create`, e.g. `a3f9k2m1`.",
          placeholder: "a3f9k2m1",
        },
      ],
      requestBody: body({ event: "order.created" }),
      responseKind: "json",
      tags: ["tools", "webhook"],
    },
  ),
  op(
    "tools-webhook-list",
    "tools",
    "List captured webhook requests",
    "GET",
    "/webhook/{identifier}/requests",
    "Retrieve all captured requests for a webhook. Up to 100 requests are stored; the oldest are dropped beyond that.",
    `${DOCS}#tools-webhook-list`,
    {
      parameters: [
        {
          name: "identifier",
          in: "path",
          type: "string",
          required: true,
          description: "Webhook identifier from `/webhook/create`, e.g. `a3f9k2m1`.",
          placeholder: "a3f9k2m1",
        },
      ],
      responseKind: "json",
      tags: ["tools", "webhook"],
    },
  ),
  op(
    "tools-webhook-delete-request",
    "tools",
    "Delete a captured webhook request",
    "DELETE",
    "/webhook/{identifier}/requests/{requestId}",
    "Remove a single captured request by its `requestId`.",
    `${DOCS}#tools-webhook-delete`,
    {
      parameters: [
        {
          name: "identifier",
          in: "path",
          type: "string",
          required: true,
          description: "Webhook identifier from `/webhook/create`, e.g. `a3f9k2m1`.",
          placeholder: "a3f9k2m1",
        },
        {
          name: "requestId",
          in: "path",
          type: "string",
          required: true,
          description: "Request id returned when the request was captured.",
          placeholder: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        },
      ],
      responseKind: "json",
      tags: ["tools", "webhook"],
    },
  ),
];