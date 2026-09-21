import { describe, expect, it } from "vitest";
import { formatJson, listLength } from "./format-json";

describe("format-json helpers", () => {
  it("pretty-prints JSON values with indentation", () => {
    expect(formatJson({ a: 1, b: [2, 3] })).toBe(
      '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}',
    );
  });

  it("keeps raw strings untouched", () => {
    expect(formatJson("plain text")).toBe("plain text");
  });

  it("handles undefined and bigint defensively", () => {
    expect(formatJson(undefined)).toBe("undefined");
    expect(formatJson(BigInt(42))).toBe("42");
  });

  it("reports list lengths or null", () => {
    expect(listLength([1, 2])).toBe(2);
    expect(listLength({ length: 2 })).toBeNull();
    expect(listLength("ab")).toBeNull();
  });
});