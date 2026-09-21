// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { BODY_PARAM } from "@/lib/request/request-builder";
import { loadAuth, loginBody, saveAuth } from "./auth-store";

describe("auth store", () => {
  it("builds the login body from credentials", () => {
    const values = loginBody({ username: "emilys", password: "emilyspass" });
    const parsed = JSON.parse(values[BODY_PARAM] as string) as Record<
      string,
      unknown
    >;
    expect(parsed["username"]).toBe("emilys");
    expect(parsed["expiresInMins"]).toBeUndefined();
  });

  it("includes expiry when provided", () => {
    const values = loginBody({
      username: "emilys",
      password: "emilyspass",
      expiresInMins: 60,
    });
    const parsed = JSON.parse(values[BODY_PARAM] as string) as Record<
      string,
      unknown
    >;
    expect(parsed["expiresInMins"]).toBe(60);
  });

  it("persists and clears the session", () => {
    saveAuth({ token: "tok", user: { id: 1, username: "emilys" } });
    expect(loadAuth()?.token).toBe("tok");
    saveAuth(null);
    expect(loadAuth()).toBeNull();
  });

  it("rejects malformed sessions", () => {
    sessionStorage.setItem(
      "djwb.session",
      JSON.stringify({ refreshToken: "x" }),
    );
    expect(loadAuth()).toBeNull();
  });
});