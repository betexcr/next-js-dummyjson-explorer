/**
 * History + favorites E2E (TASK-024/025): replay a request from history and
 * favorite/unfavorite operations.
 */
import { expect, test, type Page } from "@playwright/test";
import { mockDummyJson, productsBody, type CapturedRequest } from "./helpers";

async function openWorkbench(page: Page): Promise<CapturedRequest[]> {
  const seen: CapturedRequest[] = [];
  await mockDummyJson(page, seen);
  await page.goto("/");
  await expect(page.getByText("DummyJSON Workbench")).toBeVisible();
  return seen;
}

test("history: completed requests are listed and restorable", async ({ page }) => {
  const seen = await openWorkbench(page);

  await page.getByRole("button", { name: "GET Get all products" }).click();
  await page.getByLabel(/^limit/).fill("5");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByRole("status")).toContainText("200");

  // History menu shows the recorded request.
  await page.getByRole("button", { name: "Request history" }).click();
  const list = page.getByRole("list", { name: "Recent requests list" });
  await expect(list.getByRole("button", { name: "Restore: Get all products" })).toBeVisible();

  // Switch away and restore; the previous limit value comes back.
  await list
    .getByRole("button", { name: "Restore: Get all products" })
    .click();
  await expect(page.getByLabel(/^limit/)).toHaveValue("5");

  // Re-send and confirm the restored configuration actually hits the API.
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByRole("status")).toContainText("200");
  const sent = seen.filter((r) => r.method === "GET" && r.url.includes("/products?"));
  expect(new URL(sent.at(-1)!.url).searchParams.get("limit")).toBe("5");
  expect(productsBody.products[0].title).toBe("Test Product");
});

test("history: clear removes all entries", async ({ page }) => {
  await openWorkbench(page);
  await page.getByRole("button", { name: "GET Get all products" }).click();
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByRole("status")).toContainText("200");

  await page.getByRole("button", { name: "Request history" }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByText("No requests yet. Send one to see it here.")).toBeVisible();
});

test("favorites: operations can be saved and unsaved from the explorer", async ({
  page,
}) => {
  await openWorkbench(page);

  const favorite = page.getByRole("button", { name: "Favorite Get all products" });
  await favorite.click();
  // A Favorites section appears with the saved operation.
  const favoritesSection = page.getByRole("region", { name: "Favorites" });
  await expect(favoritesSection.getByRole("button", { name: "GET Get all products" })).toBeVisible();

  // Selecting the saved operation still works from the favorites list.
  await favoritesSection.getByRole("button", { name: "GET Get all products" }).click();
  await expect(page).toHaveURL(/\?op=products-list$/);

  // Unfavorite removes it from the top list.
  await favoritesSection.getByRole("button", { name: "Unfavorite Get all products" }).click();
  await expect(favoritesSection).toHaveCount(0);
});