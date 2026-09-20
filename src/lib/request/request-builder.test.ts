import { describe, expect, it } from "vitest";
import { getOperation } from "@/lib/dummyjson/registry";
import type { ApiOperation } from "@/lib/dummyjson/types";
import {
  BODY_PARAM,
  buildRequest,
  RequestBuildError,
  substitutePath,
  toUrl,
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