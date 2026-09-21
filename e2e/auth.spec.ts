/**
 * Auth E2E (TASK-030): sign in, execute an authenticated request with the
 * bearer token attached, and sign out.
 */
import { expect, test, type Page } from "@playwright/test";
import { mockDummyJson, type CapturedRequest } from "./helpers";

async function openWorkbench(page: Page): Promise<CapturedRequest[]> {
  const seen: CapturedRequest[] = [];
  await mockDummyJson(page, seen);
  await page.goto("/");
  await expect(page.getByText("DummyJSON Workbench")).toBeVisible();
  return seen;
}

test("login: demo credentials produce a stored session", async ({ page }) => {
  await openWorkbench(page);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await page.getByRole("button", { name: "Submit sign in" }).click();
  await expect(page.getByRole("button", { name: /Emily Johnson/ })).toBeVisible();
  // History does not leak the token into the UI header.
  await expect(page.getByText("access-token-123")).toHaveCount(0);
});

test("authenticated request: auth/me sends the bearer token", async ({ page }) => {
  const seen = await openWorkbench(page);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await page.getByRole("button", { name: "Submit sign in" }).click();
  await expect(page.getByRole("button", { name: /Emily Johnson/ })).toBeVisible();

  await page.getByRole("button", { name: "GET Get current user" }).click();
  await page.getByRole("button", { name: /^Send$/ }).click();

  await expect(page.getByRole("status")).toContainText("200");
  const sent = seen.find((r) => r.method === "GET" && r.url.endsWith("/auth/me"));
  expect(sent).toBeDefined();
  expect(sent!.headers["authorization"]).toBe("Bearer access-token-123");
  // Request body must not be persisted into any visible value fields.
  await expect(page.getByText("access-token-123")).toHaveCount(0);
});

test("logout: clears the session and returns to signed-out state", async ({
  page,
}) => {
  await openWorkbench(page);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await page.getByRole("button", { name: "Submit sign in" }).click();
  await expect(page.getByRole("button", { name: /Emily Johnson/ })).toBeVisible();

  await page.getByRole("button", { name: /Emily Johnson/ }).click();
  await page.getByRole("button", { name: /Sign out/ }).click();
  await expect(page.getByRole("button", { name: /^Sign in$/ })).toBeVisible();
});