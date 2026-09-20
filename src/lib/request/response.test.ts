import { describe, expect, it } from "vitest";
import {
  headersToRecord,
  httpError,
  normalizeResponse,
  type NormalizedResponse,
} from "./response";

describe("response processing", () => {
  it("normalizes a JSON response", async () => {
    const response = new Response(JSON.stringify({ hello: "world" }), {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json; charset=utf-8" },
    });
    const normalized = await normalizeResponse({
      response,
      durationMs: 12,
    });
    expect(normalized).toMatchObject({
      ok: true,
      status: 200,
      statusText: "OK",
      durationMs: 12,
      body: { hello: "world" },
      kind: "json",
    });
    expect(normalized.headers["content-type"]).toContain("application/json");
  });

  it("keeps error responses as ok:false with parsed body", async () => {
    const response = new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
      statusText: "Not Found",
      headers: { "content-type": "application/json" },
    });
    const normalized = await normalizeResponse({ response, durationMs: 3 });
    expect(normalized.ok).toBe(false);
    expect(normalized.status).toBe(404);
    expect(normalized.body).toEqual({ message: "Not found" });
  });

  it("treats non-JSON text responses as text", async () => {
    const response = new Response("plain text", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    const normalized = await normalizeResponse({ response, durationMs: 1 });
    expect(normalized.kind).toBe("text");
    expect(normalized.body).toBe("plain text");
    expect(normalized.raw).toBe("plain text");
  });

  it("captures binary responses as ArrayBuffer", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const response = new Response(bytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
    const normalized = await normalizeResponse({
      response,
      durationMs: 5,
      binary: true,
    });
    expect(normalized.kind).toBe("binary");
    expect(normalized.binaryData).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(normalized.binaryData as ArrayBuffer)).toEqual(bytes);
  });

  it("throws an ApiError for invalid JSON bodies", async () => {
    const response = new Response("{oops", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    await expect(
      normalizeResponse({ response, durationMs: 1 }),
    ).rejects.toMatchObject({ type: "invalid-json" });
  });

  it("converts headers to a plain record", () => {
    const record = headersToRecord(
      new Headers({ "x-one": "1", "x-two": "2" }),
    );
    expect(record).toEqual({ "x-one": "1", "x-two": "2" });
  });

  it("summarizes HTTP errors from the response body message", () => {
    const normalized: NormalizedResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      durationMs: 1,
      body: { message: "Invalid/Expired Token!" },
      raw: "",
      kind: "json",
    };
    const error = httpError(normalized);
    if (error.type !== "http") throw new Error("expected http error");
    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid/Expired Token!");
  });

  it("falls back to statusText when no message is present", () => {
    const normalized: NormalizedResponse = {
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      headers: {},
      durationMs: 1,
      body: null,
      raw: "",
      kind: "json",
    };
    expect(httpError(normalized).message).toContain("Bad Gateway");
  });
});