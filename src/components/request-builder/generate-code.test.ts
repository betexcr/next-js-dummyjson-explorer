import { describe, expect, it } from "vitest";
import { getOperation } from "@/lib/dummyjson/registry";
import {
  BODY_PARAM,
  buildRequest,
  toUrl,
  type BuiltRequest,
} from "@/lib/request/request-builder";
import { generateCurl, generateFetch } from "./generate-code";

describe("code generation", () => {
  it("renders a simple GET as curl with no body", () => {
    const op = getOperation("products-list")!;
    const built = buildRequest({
      op,
      values: { limit: 5 },
      basePath: "https://dummyjson.com",
    });
    const curl = generateCurl(built);
    expect(curl).toContain("curl");
    expect(curl).toContain("--request GET");
    expect(curl).toContain("https://dummyjson.com/products?limit=5");
    expect(curl).not.toContain("--data");
  });

  it("renders a POST with headers and JSON body for curl", () => {
    const op = getOperation("products-add")!;
    const built = buildRequest({
      op,
      values: { [BODY_PARAM]: '{ "title": "Widget" }' },
      basePath: "https://dummyjson.com",
    });
    const curl = generateCurl(built);
    expect(curl).toContain("--request POST");
    expect(curl).toContain("--header 'Content-Type: application/json'");
    expect(curl).toContain('--data \'{"title":"Widget"}\'');
  });

  it("redacts authorization headers when they are explicitly supplied", () => {
    const op = getOperation("auth-me")!;
    const built = buildRequest({
      op,
      values: {},
      basePath: "https://dummyjson.com",
    });
    const curl = generateCurl({
      ...built,
      headers: { ...built.headers, Authorization: "Bearer tok" },
    });
    expect(curl).toContain("--header 'Authorization: ***REDACTED***'");
    expect(curl).not.toContain("Bearer tok");
  });

  it("quotes URLs with special characters", () => {
    const op = getOperation("posts-get")!;
    const built = buildRequest({
      op,
      values: { id: "a b\"c" },
      basePath: "https://dummyjson.com",
    });
    expect(generateCurl(built)).toContain('"https://dummyjson.com/posts/a%20b%22c"');
  });

  it("renders a valid fetch snippet with method, headers, and body", () => {
    const op = getOperation("products-update")!;
    const built = buildRequest({
      op,
      values: { id: 7, [BODY_PARAM]: '{"title":"Next"}' },
      basePath: "https://dummyjson.com",
    });
    const snippet = generateFetch(built);
    expect(snippet).toContain('fetch("https://dummyjson.com/products/7", {');
    expect(snippet).toContain('method: "PUT"');
    expect(snippet).toContain('"Content-Type": "application/json"');
    expect(snippet).toContain('body: "{\\"title\\":\\"Next\\"}"');
    expect(toUrl(built)).toContain("/products/7");
  });

  it("generates fetch snippets that are syntactically valid JavaScript", () => {
    const op = getOperation("products-update")!;
    const built = buildRequest({
      op,
      values: { id: 7, [BODY_PARAM]: '{"title":"Next"}' },
      basePath: "https://dummyjson.com",
    });
    const snippet = generateFetch(built);
    // Parsing as a function body validates statement syntax without executing
    // any network call.
    expect(() => new Function(snippet)).not.toThrow();
  });

  it("produces a fetch body that can be passed to fetch()", () => {
    const op = getOperation("products-update")!;
    const built = buildRequest({
      op,
      values: { id: 7, [BODY_PARAM]: '{"title":"Next"}' },
      basePath: "https://dummyjson.com",
    });
    const snippet = generateFetch(built);
    // Extract the body expression and evaluate it to confirm it is a string.
    const bodyLine = snippet.split("\n").find((line) => line.includes("body:"));
    expect(bodyLine).toBeDefined();
    const bodyMatch = bodyLine!.match(/body: (".*"),?$/);
    expect(bodyMatch).not.toBeNull();
    const bodyValue = new Function(`return ${bodyMatch![1]}`)();
    expect(typeof bodyValue).toBe("string");
    expect(JSON.parse(bodyValue)).toEqual({ title: "Next" });
  });

  it("does not include bearer tokens in generated snippets by default", () => {
    // The token is injected by executeOperation, not buildRequest, so
    // generated code must not silently leak an active session credential.
    const op = getOperation("auth-me")!;
    const built = buildRequest({
      op,
      values: {},
      basePath: "https://dummyjson.com",
    });
    const curl = generateCurl(built);
    const fetchSnippet = generateFetch(built);
    expect(curl).not.toContain("Bearer");
    expect(fetchSnippet).not.toContain("Bearer");
    expect(curl).not.toContain("Authorization");
    expect(fetchSnippet).not.toContain("Authorization");
  });

  it("redacts sensitive headers when they are explicitly supplied", () => {
    const op = getOperation("auth-me")!;
    const built = buildRequest({
      op,
      values: {},
      basePath: "https://dummyjson.com",
    });
    const builtWithAuth = {
      ...built,
      headers: {
        ...built.headers,
        Authorization: "Bearer secret-token",
        "X-Api-Key": "secret-key",
        "Content-Type": "application/json",
      },
    };
    const curl = generateCurl(builtWithAuth);
    const fetchSnippet = generateFetch(builtWithAuth);
    expect(curl).not.toContain("secret-token");
    expect(fetchSnippet).not.toContain("secret-token");
    expect(curl).not.toContain("secret-key");
    expect(fetchSnippet).not.toContain("secret-key");
    expect(curl).toContain("Authorization: ***REDACTED***");
    expect(fetchSnippet).toContain("***REDACTED***");
    expect(curl).toContain("Content-Type: application/json");
    expect(fetchSnippet).toContain("application/json");
  });

  it("redacts sensitive query parameters in generated snippets", () => {
    const op = getOperation("tools-2fa-get")!;
    const built = buildRequest({
      op,
      values: { key: "JBSWY3DPEHPK3PXP" },
      basePath: "https://dummyjson.com",
    });
    const curl = generateCurl(built);
    const fetchSnippet = generateFetch(built);
    expect(curl).not.toContain("JBSWY3DPEHPK3PXP");
    expect(fetchSnippet).not.toContain("JBSWY3DPEHPK3PXP");
    expect(curl).toContain("key=***REDACTED***");
    expect(fetchSnippet).toContain("key=***REDACTED***");
  });

  it("redacts sensitive body fields in generated snippets", () => {
    const op = getOperation("tools-2fa-post")!;
    const built = buildRequest({
      op,
      values: { [BODY_PARAM]: '{"key":"JBSWY3DPEHPK3PXP","algorithm":"SHA-1"}' },
      basePath: "https://dummyjson.com",
    });
    const curl = generateCurl(built);
    const fetchSnippet = generateFetch(built);
    expect(curl).not.toContain("JBSWY3DPEHPK3PXP");
    expect(fetchSnippet).not.toContain("JBSWY3DPEHPK3PXP");
    expect(curl).toContain('"key":"***REDACTED***"');
    expect(fetchSnippet).toContain('\\"key\\":\\"***REDACTED***\\"');
    expect(fetchSnippet).toContain('\\"algorithm\\":\\"SHA-1\\"');
  });

  it("omits malformed request bodies from generated snippets", () => {
    // buildRequest rejects malformed JSON, so construct the BuiltRequest
    // directly to test the code-generator's defensive redaction path.
    const built: BuiltRequest = {
      method: "POST",
      pathname: "https://dummyjson.com/2fa",
      query: [],
      headers: { "Content-Type": "application/json" },
      body: '{"key":"JBSWY3DPEHPK3PXP"',
    };
    const curl = generateCurl(built);
    const fetchSnippet = generateFetch(built);
    expect(curl).not.toContain("JBSWY3DPEHPK3PXP");
    expect(fetchSnippet).not.toContain("JBSWY3DPEHPK3PXP");
    expect(curl).not.toContain("--data");
    expect(fetchSnippet).not.toContain("body:");
  });
});