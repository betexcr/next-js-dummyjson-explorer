/**
 * Integration-style client tests using a mocked fetch implementation
 * (TASK-033 foundation: registry -> request builder -> client -> response).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getOperation } from "./registry";
import { BODY_PARAM, executeOperation } from "./client";
import { USE_AUTH_ROUTE_PARAM } from "@/lib/request/request-builder";

function jsonResponse(
  body: unknown,
  init: { status?: number; statusText?: string; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DummyJSON client", () => {
  it("executes a GET and returns the normalized body", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        products: [{ id: 1, title: "iPhone 9" }],
        total: 1,
        skip: 0,
        limit: 1,
      }),
    );

    const result = await executeOperation(
      getOperation("products-list")!,
      { limit: 1 },
      { baseUrl: "https://example.test", fetchFn },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.body).toMatchObject({ total: 1 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/products?limit=1");
    expect(init.method).toBe("GET");
  });

  it("uses the configured base URL and timeout for requests", async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init.signal as AbortSignal;
            signal.addEventListener("abort", () => {
              const err = new Error("Aborted");
              err.name = "AbortError";
              reject(err);
            });
          }),
      );

    const result = await executeOperation(
      getOperation("products-list")!,
      {},
      {
        baseUrl: "https://custom.example/api",
        timeoutMs: 25,
        fetchFn,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("timeout");
    const [url] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://custom.example/api/products");
  });

  it("injects the bearer token for authenticated operations", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }));

    const result = await executeOperation(
      getOperation("auth-me")!,
      {},
      {
        baseUrl: "https://example.test",
        authToken: "token-123",
        fetchFn,
      },
    );

    expect(result.ok).toBe(true);
    const [, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer token-123",
    );
  });

  it("does not send the bearer token to unauthenticated operations", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ products: [] }));

    const result = await executeOperation(
      getOperation("products-list")!,
      {},
      {
        baseUrl: "https://example.test",
        authToken: "token-123",
        fetchFn,
      },
    );

    expect(result.ok).toBe(true);
    const [, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>)["Authorization"],
    ).toBeUndefined();
  });

  it("sends the bearer token for authenticated resource routes", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ products: [] }));

    const result = await executeOperation(
      getOperation("products-list")!,
      { [USE_AUTH_ROUTE_PARAM]: true },
      {
        baseUrl: "https://example.test",
        authToken: "token-123",
        fetchFn,
      },
    );

    expect(result.ok).toBe(true);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/auth/products");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer token-123",
    );
  });

  it("sends the JSON body for write operations", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 999, title: "X" }));

    const result = await executeOperation(
      getOperation("products-add")!,
      { [BODY_PARAM]: JSON.stringify({ title: "X", price: 1 }) },
      { baseUrl: "https://example.test", fetchFn },
    );

    expect(result.ok).toBe(true);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/products/add");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"title":"X","price":1}');
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("returns http errors as ok:false with detail", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" },
      ),
    );

    const result = await executeOperation(
      getOperation("products-get")!,
      { id: "999999" },
      { baseUrl: "https://example.test", fetchFn },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("http");
    if (result.error.type !== "http") return;
    expect(result.error.status).toBe(404);
    expect(result.error.message).toBe("Not found");
  });

  it("returns a timeout error when the request exceeds the limit", async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init.signal as AbortSignal;
            signal.addEventListener("abort", () => {
              const err = new Error("Aborted");
              err.name = "AbortError";
              reject(err);
            });
          }),
      );

    const result = await executeOperation(
      getOperation("products-list")!,
      {},
      { baseUrl: "https://example.test", fetchFn, timeoutMs: 20 },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("timeout");
  });

  it("returns an aborted error when the caller cancels", async () => {
    const controller = new AbortController();
    const fetchFn = vi
      .fn()
      .mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init.signal as AbortSignal;
            signal.addEventListener("abort", () => {
              const err = new Error("Aborted");
              err.name = "AbortError";
              reject(err);
            });
          }),
      );

    const promise = executeOperation(
      getOperation("products-list")!,
      {},
      { baseUrl: "https://example.test", fetchFn, signal: controller.signal },
    );
    controller.abort();
    const result = await promise;

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("aborted");
  });

  it("surfaces request build errors as validation errors", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}));
    const result = await executeOperation(
      getOperation("products-add")!,
      {},
      { baseUrl: "https://example.test", fetchFn },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("validation");
    expect(result.error.message).toContain("requires a JSON request body");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("handles network failures as network errors", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const result = await executeOperation(
      getOperation("products-list")!,
      {},
      { baseUrl: "https://example.test", fetchFn },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("network");
  });

  it("surfaces invalid JSON response bodies as invalid-json errors", async () => {
    // Regression: normalizeResponse throws a structured ApiError; the client
    // must pass it through instead of re-labeling it as a network failure.
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("{oops", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await executeOperation(
      getOperation("products-list")!,
      {},
      { baseUrl: "https://example.test", fetchFn },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("invalid-json");
    if (result.error.type !== "invalid-json") return;
    expect(result.error.message).toContain("not valid JSON");
    expect(result.error.raw).toBe("{oops");
  });
});