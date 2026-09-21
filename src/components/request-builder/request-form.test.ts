import { describe, expect, it } from "vitest";
import { getOperation } from "@/lib/dummyjson/registry";
import { BODY_PARAM } from "@/lib/request/request-builder";
import {
  defaultParameterValues,
  groupParameters,
  isEmptyValue,
  validateJsonBody,
} from "./request-form";

describe("request-form helpers", () => {
  it("groups parameters by location in registry order", () => {
    const op = getOperation("image-custom")!;
    const grouped = groupParameters(op);
    expect(grouped.path.length).toBeGreaterThan(0);
    expect(grouped.query.length).toBeGreaterThan(0);
    expect(grouped.path.every((p) => p.in === "path")).toBe(true);
    expect(grouped.query.every((p) => p.in === "query")).toBe(true);
  });

  it("seeds defaults for parameters with default values", () => {
    const op = getOperation("products-list")!;
    const values = defaultParameterValues(op);
    expect(values["order"]).toBe("asc");
    expect(values["limit"]).toBe("");
  });

  it("seeds the request body example under the body sentinel", () => {
    const op = getOperation("products-add")!;
    const values = defaultParameterValues(op);
    const body = values[BODY_PARAM];
    expect(typeof body).toBe("string");
    if (typeof body === "string") {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      expect(parsed["title"]).toBeTypeOf("string");
    }
  });

  it("does not seed a body for body-less operations", () => {
    const op = getOperation("utility-test")!;
    expect(defaultParameterValues(op)[BODY_PARAM]).toBeUndefined();
  });

  it("validates JSON bodies and accepts empty bodies", () => {
    expect(validateJsonBody("{")).toBe("Body is not valid JSON.");
    expect(validateJsonBody('{"a":1}')).toBeNull();
    expect(validateJsonBody("")).toBeNull();
    expect(validateJsonBody(undefined)).toBeNull();
  });

  it("detects empty values consistently", () => {
    expect(isEmptyValue("")).toBe(true);
    expect(isEmptyValue("  ")).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue("x")).toBe(false);
    expect(isEmptyValue(0)).toBe(false);
  });
});