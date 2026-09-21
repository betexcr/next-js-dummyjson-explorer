/**
 * CRUD E2E: POST / PUT / DELETE through the workbench (TASK-034).
 * The transport is mocked; assertions verify the exact method, path, and
 * body the UI serialized.
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

function responsePanel(page: Page) {
  return page.getByRole("region", { name: "Response" });
}

test("POST: adds a product with documented example body", async ({ page }) => {
  const seen = await openWorkbench(page);
  await page.getByRole("button", { name: "POST Add a product" }).click();
  await page
    .getByRole("button", { name: /Load documented example/i })
    .click();
  await page.getByRole("button", { name: /^Send$/ }).click();

  await expect(page.getByRole("status")).toContainText("201");
  await page.getByRole("radio", { name: "Raw" }).click();
  await expect(responsePanel(page).locator("pre")).toContainText("BMW Pencil");

  const sent = seen.find(
    (r) => r.method === "POST" && r.url.endsWith("/products/add"),
  );
  expect(sent).toBeDefined();
  expect(sent!.postData).not.toBeNull();
  expect(JSON.parse(sent!.postData!)).toMatchObject({
    title: "BMW Pencil",
    category: "stationery",
  });
  expect(sent!.headers["content-type"]).toContain("application/json");
});

test("PUT: updates a product at /products/{id} with body", async ({ page }) => {
  const seen = await openWorkbench(page);
  await page.getByRole("button", { name: "PUT Update a product" }).click();
  await page.getByLabel(/^id/).fill("42");
  await page
    .getByRole("button", { name: /Load documented example/i })
    .click();
  await page.getByRole("button", { name: /^Send$/ }).click();

  await expect(page.getByRole("status")).toContainText("200");
  const sent = seen.find(
    (r) => r.method === "PUT" && r.url.includes("/products/42"),
  );
  expect(sent).toBeDefined();
  expect(sent!.postData).not.toBeNull();
  expect(JSON.parse(sent!.postData!)).toMatchObject({ title: "iPhone Galaxy +1" });
});

test("DELETE: removes a product at /products/{id}", async ({ page }) => {
  const seen = await openWorkbench(page);
  await page.getByRole("button", { name: "DELETE Delete a product" }).click();
  await page.getByLabel(/^id/).fill("9");
  await page.getByRole("button", { name: /^Send$/ }).click();

  await expect(page.getByRole("status")).toContainText("200");
  const sent = seen.find(
    (r) => r.method === "DELETE" && r.url.includes("/products/9"),
  );
  expect(sent).toBeDefined();
  await page.getByRole("radio", { name: "Raw" }).click();
  await expect(responsePanel(page).locator("pre")).toContainText("isDeleted");
});

test("validation: a body operation without a body produces a useful error", async ({
  page,
}) => {
  await openWorkbench(page);
  await page.getByRole("button", { name: "POST Add a product" }).click();
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByRole("alert", { name: /requires a JSON request body/ })).toBeVisible();
});