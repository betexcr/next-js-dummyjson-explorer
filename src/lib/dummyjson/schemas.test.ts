import { describe, expect, it } from "vitest";
import {
  authTokenResponseSchema,
  errorResponseSchema,
  ipResponseSchema,
  listResponseSchema,
  testResponseSchema,
  totpResponseSchema,
  webhookCaptureSchema,
} from "./schemas";

describe("DummyJSON response schemas", () => {
  it("validates a paginated list envelope", () => {
    const schema = listResponseSchema("products");
    const parsed = schema.safeParse({
      products: [{ id: 1 }, { id: 2 }],
      total: 194,
      skip: 0,
      limit: 30,
    });
    expect(parsed.success).toBe(true);

    const missingLimit = schema.safeParse({
      products: [],
      total: 0,
      skip: 0,
    });
    expect(missingLimit.success).toBe(false);

    const itemsNotArray = schema.safeParse({
      products: { id: 1 },
      total: 1,
      skip: 0,
      limit: 30,
    });
    expect(itemsNotArray.success).toBe(false);
  });

  it("validates an item list schema", () => {
    const schema = listResponseSchema("users", testResponseSchema);
    expect(
      schema.safeParse({
        users: [
          { status: "ok", method: "GET" },
          { status: "ok", method: "POST" },
        ],
        total: 2,
        skip: 0,
        limit: 10,
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        users: [{ status: "ok" }],
        total: 2,
        skip: 0,
        limit: 10,
      }).success,
    ).toBe(false);
  });

  it("validates the auth token response", () => {
    const payload = {
      id: 1,
      username: "emilys",
      email: "emily.johnson@x.dummyjson.com",
      firstName: "Emily",
      lastName: "Johnson",
      gender: "female",
      image: "https://dummyjson.com/icon/emilys/128",
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    };
    expect(authTokenResponseSchema.safeParse(payload).success).toBe(true);
    expect(
      authTokenResponseSchema.safeParse({ ...payload, accessToken: undefined })
        .success,
    ).toBe(false);
  });

  it("validates utility endpoint responses", () => {
    expect(
      testResponseSchema.safeParse({ status: "ok", method: "GET" }).success,
    ).toBe(true);
    expect(testResponseSchema.safeParse({ status: "ok" }).success).toBe(false);
    expect(
      ipResponseSchema.safeParse({
        ip: "127.0.0.1",
        userAgent: "curl/8.0.0",
      }).success,
    ).toBe(true);
    expect(
      ipResponseSchema.safeParse({ ip: "127.0.0.1" }).success,
    ).toBe(false);
  });

  it("validates documented error and misc responses", () => {
    expect(errorResponseSchema.safeParse({ message: "Invalid token" }).success).toBe(
      true,
    );
    expect(
      totpResponseSchema.safeParse({
        totp: "123456",
        expiresIn: 17,
        period: 30,
      }).success,
    ).toBe(true);
    expect(
      webhookCaptureSchema.safeParse({
        received: true,
        requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      }).success,
    ).toBe(true);
  });
});