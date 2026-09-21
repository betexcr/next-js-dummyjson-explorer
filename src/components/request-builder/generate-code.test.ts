import { describe, expect, it } from "vitest";
import { getOperation } from "@/lib/dummyjson/registry";
import {
  BODY_PARAM,
  buildRequest,
  toUrl,
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

  it("includes authorization headers when present", () => {
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
    expect(curl).toContain("--header 'Authorization: Bearer tok'");
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
    expect(snippet).toContain('body: {\n  "title": "Next"');
    expect(toUrl(built)).toContain("/products/7");
  });
});