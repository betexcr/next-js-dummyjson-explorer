// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { JsonTree, MAX_TREE_DEPTH } from "./JsonTree";

function deepObject(depth: number): Record<string, unknown> {
  let node: Record<string, unknown> = { leaf: true };
  for (let i = 0; i < depth; i += 1) {
    node = { child: node };
  }
  return node;
}

describe("JsonTree", () => {
  it("renders a flat object with entries", () => {
    const { container } = render(
      <JsonTree data={{ a: 1, b: "x", c: true, d: null }} />,
    );
    expect(container.querySelectorAll("details").length).toBe(1);
    expect(container.textContent).toContain("a");
    expect(container.textContent).toContain("b");
    expect(container.textContent).toContain('"x"');
    expect(container.textContent).toContain("true");
    expect(container.textContent).toContain("null");
  });

  it("renders nested containers", () => {
    const { container } = render(
      <JsonTree data={{ list: [1, { deep: "v" }] }} />,
    );
    expect(container.querySelectorAll("details").length).toBe(3); // root, list, deep
    expect(container.textContent).toContain("Array[2]");
    expect(container.textContent).toContain("Object{1}");
  });

  it("caps nesting depth and elides deeper values without crashing", () => {
    const data = deepObject(MAX_TREE_DEPTH + 8);
    const { container } = render(<JsonTree data={data} />);
    // Pathologically deep payloads render bounded DOM instead of overflowing
    // the call stack.
    expect(container.querySelectorAll("details").length).toBeLessThanOrEqual(
      MAX_TREE_DEPTH + 1,
    );
    expect(container.textContent).toContain("…");
  });
});