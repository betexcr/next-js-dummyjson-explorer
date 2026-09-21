// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getOperation } from "@/lib/dummyjson/registry";
import type { ExecuteResult } from "@/lib/dummyjson/client";
import { ResponseViewer } from "./ResponseViewer";

const products = getOperation("products-list")!;

function okResult(body: unknown, status = 200): ExecuteResult {
  return {
    ok: true,
    response: {
      ok: true,
      status,
      statusText: status === 200 ? "OK" : "Not Modified",
      headers: { "content-type": "application/json" },
      body,
      raw: JSON.stringify(body),
      kind: "json",
      durationMs: 12.5,
    },
  };
}

describe("ResponseViewer", () => {
  it("prompts to send when there is no result", () => {
    render(<ResponseViewer result={null} op={products} />);
    expect(screen.getByText("Send the request to inspect the response.")).toBeInTheDocument();
  });

  it("renders status, timing, and a JSON tree", () => {
    render(
      <ResponseViewer
        result={okResult({ products: [{ id: 1, title: "A" }], total: 1 })}
        op={products}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("200 OK");
    expect(screen.getByText("12.5 ms")).toBeInTheDocument();
    // JSON tree renders as native disclosure widgets (details/summary).
    expect(screen.getAllByText("Object").length).toBeGreaterThan(0);
    expect(screen.getByText("products:")).toBeInTheDocument();
  });

  it("switches between tree and raw views", async () => {
    const user = userEvent.setup();
    render(
      <ResponseViewer
        result={okResult({ products: [{ id: 1, title: "A" }], total: 1 })}
        op={products}
      />,
    );
    expect(screen.getAllByText("Object").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("radio", { name: "Raw" }));
    expect(screen.queryAllByText("Object")).toHaveLength(0);
    expect(screen.getByText(/"title": "A"/)).toBeInTheDocument();
  });

  it("lists response headers on the headers tab", async () => {
    const user = userEvent.setup();
    render(<ResponseViewer result={okResult({})} op={products} />);
    await user.click(screen.getByRole("tab", { name: /Headers/ }));
    expect(screen.getByRole("cell", { name: "application/json" })).toBeInTheDocument();
  });

  it("renders network errors with the error message", () => {
    render(
      <ResponseViewer
        result={{ ok: false, error: { type: "network", message: "Failed to fetch", cause: new Error("boom") } }}
        op={products}
      />,
    );
    expect(screen.getByText("network")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders invalid-json errors with the truncated raw body", () => {
    const longRaw = "x".repeat(600);
    render(
      <ResponseViewer
        result={{
          ok: false,
          error: {
            type: "invalid-json",
            message: "Response body is not valid JSON.",
            raw: longRaw,
          },
        }}
        op={products}
      />,
    );
    expect(screen.getByText("invalid-json")).toBeInTheDocument();
    expect(
      screen.getByText("Response body is not valid JSON."),
    ).toBeInTheDocument();
    expect(screen.getByText("raw body (truncated)")).toBeInTheDocument();
    // Only the first 500 characters are shown.
    expect(screen.getByText("x".repeat(500))).toBeInTheDocument();
    expect(screen.queryByText("x".repeat(600))).not.toBeInTheDocument();
  });

  it("renders timeout errors with a clear message", () => {
    render(
      <ResponseViewer
        result={{ ok: false, error: { type: "timeout", message: "Request timed out." } }}
        op={products}
      />,
    );
    expect(screen.getByText("timeout")).toBeInTheDocument();
    expect(screen.getByText("Request timed out.")).toBeInTheDocument();
  });

  it("renders HTTP failures with status and error body", () => {
    render(
      <ResponseViewer
        result={{
          ok: false,
          error: {
            type: "http",
            status: 404,
            statusText: "Not Found",
            headers: { "content-type": "application/json" },
            body: { message: "nope" },
            raw: '{"message":"nope"}',
            kind: "json",
            durationMs: 4,
            message: "404 Not Found",
          },
        }}
        op={products}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("404 Not Found");
    expect(screen.getByText(/nope/)).toBeInTheDocument();
  });
});