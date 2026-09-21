/**
 * Image / HTTP-mock + QA E2E (TASK-014/015/034 + visual QA).
 *
 * Image operations produce binary responses rendered as a preview; HTTP
 * mocking produces arbitrary statuses with custom messages. Also verifies
 * the page loads without uncaught console/page errors and that important
 * controls are keyboard-reachable.
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

test("image: binary SVG response renders an image preview", async ({ page }) => {
  const seen = await openWorkbench(page);
  await page.getByRole("button", { name: "GET Generate square image" }).click();
  await page.getByLabel(/^size/).fill("400");
  await page.getByRole("button", { name: /^Send$/ }).click();

  const preview = page.getByAltText("Binary response preview");
  await expect(preview).toBeVisible();
  await expect(page.getByRole("status")).toContainText("200");
  expect(
    seen.some((r) => r.method === "GET" && r.url.includes("/image/400")),
  ).toBe(true);
});

test("http mock: arbitrary status and custom message round trip", async ({
  page,
}) => {
  const seen = await openWorkbench(page);
  await page
    .getByRole("button", { name: "GET Mock / custom HTTP response" })
    .click();

  // Custom message with a 200 status.
  await page.getByLabel(/^status/).fill("200");
  await page.getByLabel(/^message/).fill("Hello_Peter");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByRole("status")).toContainText("200");
  await page.getByRole("radio", { name: "Raw" }).click();
  await expect(responsePanel(page).locator("pre")).toContainText("Hello_Peter");
  expect(
    seen.some((r) => r.method === "GET" && r.url.includes("/http/200/Hello_Peter")),
  ).toBe(true);
});

test("QA: no uncaught console or page errors during a full flow", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: Error[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err));

  await openWorkbench(page);
  await page.getByRole("button", { name: "GET Get all products" }).click();
  await page.getByLabel(/^limit/).fill("5");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByRole("status")).toContainText("200");
  await page.getByRole("radio", { name: "Raw" }).click();
  await page.getByRole("tab", { name: /^Headers/ }).click();

  expect(pageErrors).toEqual([]);
  // Next.js dev overlay messages can appear as warnings; assert no errors.
  expect(consoleErrors).toEqual([]);
});

test("QA: keyboard can reach the operation search and a Send control", async ({
  page,
}) => {
  await openWorkbench(page);
  // Initial tab order: skip link, header link, history, sign-in, then search.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "DummyJSON Workbench" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const search = page.getByRole("searchbox", { name: "Search operations" });
  await expect(search).toBeFocused();

  // Type a query via keyboard and activate the single result with Enter.
  await page.keyboard.type("search products");
  await expect(page.getByText("1 matching operation")).toBeVisible();
  await page.getByRole("button", { name: "GET Search products" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?op=products-search$/);

  // The Send control is reachable and triggers a request from the keyboard.
  await page.getByRole("button", { name: /^Send$/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("200");
});