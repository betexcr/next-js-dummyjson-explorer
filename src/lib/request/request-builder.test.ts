import { describe, expect, it } from "vitest";
import { getOperation } from "@/lib/dummyjson/registry";
import type { ApiOperation } from "@/lib/dummyjson/types";
import {
  BODY_PARAM,
  buildRequest,
  RequestBuildError,
  substitutePath,
  toUrl,
  USE_AUTH_ROUTE_PARAM,
} from "./request-builder";

function opOf(id: string): ApiOperation {
  const op = getOperation(id);
  if (!op) throw new Error(`operation ${id} must exist`);
  return op;
}

describe("request builder: path substitution", () => {
  it("substitutes simple path parameters", () => {
    const op = opOf("products-get");
    const built = buildRequest({ op, values: { id: "5" } });
    expect(built.pathname).toBe("/products/5");
    expect(built.method).toBe("GET");
  });

  it("drops optional path segments when empty", () => {
    const http = opOf("http-status");
    expect(
      buildRequest({ op: http, values: { status: "404" } }).pathname,
    ).toBe("/http/404");
    expect(
      buildRequest({
        op: http,
        values: { status: "404", message: "Hello_Peter" },
      }).pathname,
    ).toBe("/http/404/Hello_Peter");
  });

  it("resolves composite size segments", () => {
    const op = opOf("image-custom");
    expect(
      buildRequest({ op, values: { width: "200", height: "100" } }).pathname,
    ).toBe("/image/200x100");
  });

  it("appends optional image color segments in order", () => {
    const op = opOf("image-square");
    expect(buildRequest({ op, values: { size: "400" } }).pathname).toBe(
      "/image/400",
    );
    expect(
      buildRequest({ op, values: { size: "400", backgroundColor: "008080" } })
        .pathname,
    ).toBe("/image/400/008080");
    expect(
      buildRequest({
        op,
        values: { size: "400", backgroundColor: "008080", textColor: "ffffff" },
      }).pathname,
    ).toBe("/image/400/008080/ffffff");
  });

  it("throws for missing required path parameters", () => {
    const op = opOf("products-get");
    expect(() => buildRequest({ op, values: {} })).toThrowError(
      /Missing required path parameter "id"/,
    );
  });

  it("URL-encodes path values", () => {
    const op = opOf("products-category");
    expect(
      buildRequest({ op, values: { category: "smart phones" } }).pathname,
    ).toBe("/products/category/smart%20phones");
  });
});

describe("request builder: query and headers", () => {
  it("adds query parameters in registry order", () => {
    const op = opOf("products-list");
    const built = buildRequest({
      op,
      values: { limit: 10, skip: "5", select: "title,price", delay: 1000 },
    });
    expect(built.query).toEqual([
      ["limit", "10"],
      ["skip", "5"],
      ["select", "title,price"],
      ["delay", "1000"],
    ]);
    expect(toUrl(built)).toBe(
      "/products?limit=10&skip=5&select=title%2Cprice&delay=1000",
    );
  });

  it("ignores empty query values", () => {
    const op = opOf("products-list");
    const built = buildRequest({
      op,
      values: { limit: "", skip: undefined, select: "title" },
    });
    expect(built.query).toEqual([["select", "title"]]);
  });

  it("throws for missing required query parameters", () => {
    const op = opOf("products-search");
    expect(() => buildRequest({ op, values: {} })).toThrowError(
      /Missing required query parameter "q"/,
    );
    expect(() => buildRequest({ op, values: { q: "" } })).toThrowError(
      /Missing required query parameter "q"/,
    );
  });

  it("throws for missing required header parameters", () => {
    const op: ApiOperation = {
      ...opOf("products-list"),
      parameters: [
        {
          name: "X-Required",
          in: "header",
          type: "string",
          required: true,
          description: "Required header",
        },
      ],
    };
    expect(() => buildRequest({ op, values: {} })).toThrowError(
      /Missing required header parameter "X-Required"/,
    );
  });

  it("collects header parameters", () => {
    const op = opOf("auth-me"); // no header params, but builder must stay generic
    const built = buildRequest({ op, values: {} });
    expect(built.headers).toEqual({});
  });

  it("applies a base path prefix", () => {
    const op = opOf("products-get");
    const built = buildRequest({
      op,
      values: { id: "3" },
      basePath: "https://dummyjson.com",
    });
    expect(built.pathname).toBe("https://dummyjson.com/products/3");
  });

  it("prefixes the path with /auth when the authenticated route is selected", () => {
    const op = opOf("products-get");
    expect(op.supportsAuthRoute).toBe(true);
    const built = buildRequest({
      op,
      values: { id: "3", [USE_AUTH_ROUTE_PARAM]: true },
      basePath: "https://dummyjson.com",
    });
    expect(built.pathname).toBe("https://dummyjson.com/auth/products/3");
  });

  it("ignores the auth-route flag for non-resource operations", () => {
    const op = opOf("auth-me");
    expect(op.supportsAuthRoute).toBe(false);
    const built = buildRequest({
      op,
      values: { [USE_AUTH_ROUTE_PARAM]: true },
      basePath: "https://dummyjson.com",
    });
    expect(built.pathname).toBe("https://dummyjson.com/auth/me");
  });
});

describe("request builder: bodies", () => {
  it("serializes a valid JSON body and sets content type", () => {
    const op = opOf("products-add");
    const built = buildRequest({
      op,
      values: {
        [BODY_PARAM]: JSON.stringify({
          title: "BMW Pencil",
          price: 9.99,
        }),
      },
    });
    expect(built.body).toBe('{"title":"BMW Pencil","price":9.99}');
    expect(built.headers["Content-Type"]).toBe("application/json");
  });

  it("throws when body is not valid JSON", () => {
    const op = opOf("products-add");
    expect(() =>
      buildRequest({ op, values: { [BODY_PARAM]: "{not json" } }),
    ).toThrowError(/not valid JSON/);
    expect(() =>
      buildRequest({ op, values: { [BODY_PARAM]: "{not json" } }),
    ).toThrowError(RequestBuildError);
  });

  it("throws when a body is required but missing", () => {
    const op = opOf("products-add");
    expect(() => buildRequest({ op, values: {} })).toThrowError(
      /requires a JSON request body/,
    );
  });

  it("does not require a body for bodyless operations", () => {
    const op = opOf("products-list");
    expect(() => buildRequest({ op, values: {} })).not.toThrow();
  });
});

describe("request builder: base URL joining", () => {
  it("joins a base URL origin with an operation path", () => {
    const op = opOf("products-list");
    expect(
      buildRequest({ op, values: {}, basePath: "https://example.test" })
        .pathname,
    ).toBe("https://example.test/products");
  });

  it("joins a base URL with a path prefix", () => {
    const op = opOf("products-list");
    expect(
      buildRequest({ op, values: {}, basePath: "https://example.test/api/" })
        .pathname,
    ).toBe("https://example.test/api/products");
  });

  it("omits query parameters from the base URL", () => {
    const op = opOf("products-list");
    expect(
      buildRequest({ op, values: {}, basePath: "https://example.test?x=1" })
        .pathname,
    ).toBe("https://example.test/products");
  });
});

describe("substitutePath standalone", () => {
  it("leaves static paths alone", () => {
    const op = opOf("products-list");
    expect(substitutePath(op, {})).toBe("/products");
  });

  it("keeps composite segments when a sub-placeholder is empty but required", () => {
    const op = opOf("image-custom");
    expect(() => substitutePath(op, { width: "200" })).toThrowError(
      /Missing required path parameter "height"/,
    );
  });
});