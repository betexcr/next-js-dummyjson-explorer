// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getOperation } from "@/lib/dummyjson/registry";
import type { ParameterValues } from "@/lib/dummyjson/types";
import { BODY_PARAM } from "@/lib/request/request-builder";
import { RequestBuilder } from "./RequestBuilder";

function setup(opId: string, overrides: Partial<Parameters<typeof RequestBuilder>[0]> = {}) {
  const op = getOperation(opId);
  if (!op) throw new Error(`Unknown operation for test: ${opId}`);
  const onChange = vi.fn();
  const onSend = vi.fn();
  const onAbort = vi.fn();
  const onReset = vi.fn();
  const props = {
    op,
    values: {} as ParameterValues,
    onChange,
    status: "idle" as const,
    errorMessage: null,
    authenticated: false,
    onSend,
    onAbort,
    onReset,
    ...overrides,
  };
  render(<RequestBuilder {...props} />);
  return { op, onChange, onSend, onAbort, onReset, props };
}

describe("RequestBuilder", () => {
  it("renders the operation method, path, and summary", () => {
    setup("products-list");
    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("/products")).toBeInTheDocument();
    expect(
      screen.getByText(/Returns a paginated list of products/i),
    ).toBeInTheDocument();
  });

  it("renders registry-declared query parameter fields", () => {
    setup("products-list");
    expect(screen.getByLabelText(/limit/)).toBeInTheDocument();
    expect(screen.getByLabelText(/order/)).toBeInTheDocument();
  });

  it("calls onSend with current values", async () => {
    const user = userEvent.setup();
    const { onSend } = setup("products-list", { values: { limit: "5" } });
    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    expect(onSend).toHaveBeenCalledWith({ limit: "5" });
  });

  it("calls onReset", async () => {
    const user = userEvent.setup();
    const { onReset } = setup("products-list");
    await user.click(screen.getByRole("button", { name: /^Reset$/ }));
    expect(onReset).toHaveBeenCalled();
  });

  it("shows Cancel while loading and calls onAbort", async () => {
    const user = userEvent.setup();
    const { onAbort } = setup("products-list", { status: "loading" });
    await user.click(screen.getByRole("button", { name: /^Cancel$/ }));
    expect(onAbort).toHaveBeenCalled();
  });

  it("shows a validation error message when present", () => {
    setup("products-list", { errorMessage: "Invalid JSON body" });
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid JSON body");
  });

  it("offers a documented example body for body operations", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("products-add");
    await user.click(
      screen.getByRole("button", { name: /Load documented example/i }),
    );
    const passed = onChange.mock.calls[0][0] as ParameterValues;
    const body = JSON.parse(passed[BODY_PARAM] as string) as Record<string, unknown>;
    expect(body["title"]).toBeDefined();
  });

  it("renders cURL and fetch snippets", () => {
    setup("products-list", { values: { limit: "5" } });
    expect(screen.getByText("cURL")).toBeInTheDocument();
    expect(screen.getByText("fetch")).toBeInTheDocument();
    // The label's parent row is followed by the <pre> that holds the snippet.
    const code = screen.getByText("cURL").parentElement?.nextElementSibling;
    expect(code?.textContent).toContain("https://dummyjson.com/products");
  });

  it("never crashes rendering snippets when required path parameters are empty", () => {
    // products-update needs a path `id` with no default; with empty values
    // neither the current values nor the documented defaults can build a
    // request, so the panel must fall back to placeholder comments.
    setup("products-update");
    expect(
      screen.getAllByText(
        /Fill in the required parameters for products-update first/,
      ),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /^Send$/ }),
    ).toBeInTheDocument();
  });

  it("warns about required authentication when signed out", () => {
    setup("auth-me", { authenticated: false });
    expect(screen.getByText(/requires authentication/i)).toBeInTheDocument();
  });

  it("confirms the bearer token is attached when signed in", () => {
    setup("auth-me", { authenticated: true });
    expect(screen.getByText(/Authorization: Bearer token will be attached/i)).toBeInTheDocument();
  });
});