import { describe, expect, it } from "vitest";
import {
  countOperations,
  getGroup,
  getOperation,
  getOperationsByGroup,
  GROUPS,
  OPERATIONS,
  searchOperations,
} from "./registry";
import type { HttpMethod } from "./types";

const METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

describe("registry", () => {
  it("registers a non-empty, deterministically ordered operation list", () => {
    expect(OPERATIONS.length).toBeGreaterThan(0);
    expect(new Set(OPERATIONS.map((o) => o.id)).size).toBe(OPERATIONS.length);
  });

  it("assigns every group exactly one location in navigation order", () => {
    expect(new Set(GROUPS.map((g) => g.id)).size).toBe(GROUPS.length);
  });

  it("gives every operation complete, valid metadata", () => {
    for (const op of OPERATIONS) {
      expect(op.id.trim().length).toBeGreaterThan(0);
      expect(GROUPS.some((g) => g.id === op.group)).toBe(true);
      expect(op.name.trim().length).toBeGreaterThan(0);
      expect(METHODS).toContain(op.method);
      expect(op.path.startsWith("/")).toBe(true);
      expect(op.summary.trim().length).toBeGreaterThan(0);
      expect(op.docsUrl.startsWith("https://dummyjson.com/")).toBe(true);
      expect(["none", "optional", "required"]).toContain(op.auth);
    }
  });

  it("keeps path templates consistent with path parameter metadata", () => {
    for (const op of OPERATIONS) {
      const pathParams = (op.parameters ?? []).filter((p) => p.in === "path");
      for (const param of pathParams) {
        expect(op.path).toContain(`{${param.name}}`);
        if (param.optionalPathSegment) {
          expect(param.required).not.toBe(true);
        }
      }
      // Every {placeholder} in the path needs metadata.
      const placeholders = op.path.match(/\{([^}]+)\}/g) ?? [];
      for (const placeholder of placeholders) {
        const name = placeholder.slice(1, -1);
        expect(
          pathParams.some((p) => p.name === name),
          `missing path parameter metadata for ${name} in ${op.id}`,
        ).toBe(true);
      }
    }
  });

  it("dialects of every group have at least one operation", () => {
    for (const group of GROUPS) {
      expect(
        getOperationsByGroup(group.id).length,
        `group ${group.id} has no operations`,
      ).toBeGreaterThan(0);
    }
  });

  it("looks operations up by stable id", () => {
    const productsList = getOperation("products-list");
    expect(productsList).toBeDefined();
    expect(productsList?.method).toBe("GET");
    expect(productsList?.path).toBe("/products");
    expect(getOperation("does-not-exist")).toBeUndefined();
  });

  it("looks groups up by id", () => {
    expect(getGroup("auth")?.name).toBe("Auth");
    expect(getGroup("auth")?.docsUrl).toContain("/docs/auth");
  });

  it("searches across names, tags, methods, and groups case-insensitively", () => {
    expect(searchOperations("products").length).toBeGreaterThan(0);
    const byName = searchOperations("random quote");
    expect(byName.map((o) => o.id)).toContain("quotes-random");
    const byTag = searchOperations("webhook");
    expect(byTag.map((o) => o.id)).toContain("tools-webhook-create");
    const byMethod = searchOperations("delete");
    expect(byMethod.map((o) => o.method).every((m) => m === "DELETE")).toBe(true);
    expect(searchOperations("")).toEqual([]);
    expect(searchOperations("zzz-no-such-term-zzz")).toEqual([]);
  });

  it("reports per-group operation counts", () => {
    expect(countOperations("products")).toBe(9);
    expect(countOperations("auth")).toBe(3);
    expect(countOperations("utility")).toBe(2);
    expect(countOperations("image")).toBe(3);
  });
});