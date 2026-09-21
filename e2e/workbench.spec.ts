/**
 * Workbench E2E: open, browse, configure, execute, inspect (TASK-034).
 *
 * Every test mocks the DummyJSON transport via `mockDummyJson` so the suite
 * is deterministic and never depends on DummyJSON uptime (TESTING.md).
 */
import { expect, test, type Page } from "@playwright/test";
import { mockDummyJson, type CapturedRequest } from "./helpers";

/** Registers the mock transport and returns the capture buffer. */
async function openWorkbench(page: Page): Promise<CapturedRequest[]> {
  const seen: CapturedRequest[] = [];
  await mockDummyJson(page, seen);
  await page.goto("/");
  await expect(page.getByText("DummyJSON Workbench")).toBeVisible();
  return seen;
}

/** The output panel section of the workbench. */
function responsePanel(page: Page) {
  return page.getByRole("region", { name: "Response" });
}

test("open: renders the workbench shell with registry-derived counts", async ({
  page,
}) => {
  await openWorkbench(page);
  await expect(page.getByRole("button", { name: "Request history" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sign in$/ })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search operations" })).toBeVisible();
});

test("navigate: selecting an operation reflects in URL and builder", async ({
  page,
}) => {
  await openWorkbench(page);
  await page
    .getByRole("button", { name: "GET Get all products" })
    .click();
  await expect(page).toHaveURL(/\?op=products-list$/);
  await expect(
    page
      .getByRole("region", { name: "Request builder: products-list" })
      .getByText("/products", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Send$/ })).toBeVisible();
});

test("find: registry-backed search narrows operations", async ({ page }) => {
  await openWorkbench(page);
  const search = page.getByRole("searchbox", { name: "Search operations" });
  await search.fill("search products");
  await expect(page.getByText("1 matching operation")).toBeVisible();
  await page.getByRole("button", { name: "GET Search products" }).click();
  await expect(page).toHaveURL(/\?op=products-search$/);
  await expect(page.getByLabel(/^q/)).toBeVisible();
});

test("configure+send+inspect: GET list with options and inspect response", async ({
  page,
}) => {
  const seen = await openWorkbench(page);

  await page.getByRole("button", { name: "GET Get all products" }).click();
  // Pagination / select / sort / delay parameters (TASK-026..029).
  await page.getByLabel(/^limit/).fill("5");
  await page.getByLabel(/^skip/).fill("10");
  await page.getByLabel(/^select/).fill("title,price");
  await page.getByLabel(/^sortBy/).fill("title");
  await page.getByLabel(/^order/).selectOption("desc");
  await page.getByLabel(/^delay/).fill("100");

  await page.getByRole("button", { name: /^Send$/ }).click();

  const status = page.getByRole("status");
  await expect(status).toContainText("200");
  await expect(status).toContainText("OK");

  // The request actually sent the configured options.
  const sent = seen.find((r) => r.method === "GET" && r.url.includes("/products?"));
  expect(sent).toBeDefined();
  const url = new URL(sent!.url);
  expect(url.searchParams.get("limit")).toBe("5");
  expect(url.searchParams.get("skip")).toBe("10");
  expect(url.searchParams.get("select")).toBe("title,price");
  expect(url.searchParams.get("sortBy")).toBe("title");
  expect(url.searchParams.get("order")).toBe("desc");
  expect(url.searchParams.get("delay")).toBe("100");

  // Response body is inspectable in JSON tree and raw views.
  await expect(
    responsePanel(page).getByText("products:"),
  ).toBeVisible();
  await expect(responsePanel(page)).toContainText(`"Test Product"`);
  await page.getByRole("radio", { name: "Raw" }).click();
  await expect(responsePanel(page).locator("pre")).toContainText(
    '"title": "Test Product"',
  );

  // Headers tab renders the normalized headers.
  await page.getByRole("tab", { name: /^Headers/ }).click();
  await expect(responsePanel(page).getByText("content-type")).toBeVisible();
});

test("copy: cURL and fetch snippets render the exact target URL", async ({
  page,
}) => {
  await openWorkbench(page);
  await page.getByRole("button", { name: "GET Get all products" }).click();
  await page.getByLabel(/^limit/).fill("5");

  const curlBlock = page.locator("pre", { hasText: "curl --request GET" });
  await expect(curlBlock).toContainText("https://dummyjson.com/products?limit=5");

  const fetchBlock = page.locator("pre", { hasText: "fetch(" });
  await expect(fetchBlock).toContainText('method: "GET"');
  await expect(fetchBlock).toContainText('"https://dummyjson.com/products?limit=5"');
});

test("error: HTTP failure renders normalized status, headers and body", async ({
  page,
}) => {
  const seen = await openWorkbench(page);
  await page
    .getByRole("button", { name: "GET Mock / custom HTTP response" })
    .click();
  await page.getByLabel(/^status/).fill("404");
  await page.getByRole("button", { name: /^Send$/ }).click();

  await expect(page.getByRole("status")).toContainText("404");
  await page.getByRole("radio", { name: "Raw" }).click();
  await expect(responsePanel(page).locator("pre")).toContainText("Mocked HTTP 404");
  expect(
    seen.some((r) => r.method === "GET" && r.url.includes("/http/404")),
  ).toBe(true);
});

test("error: network failures render a normalized network error", async ({
  page,
}) => {
  // Simulate the transport being unreachable (offline / DNS / TLS failure).
  await page.route("https://dummyjson.com/**", (route) => route.abort("failed"));
  await page.goto("/");
  await page.getByRole("button", { name: "GET Get all products" }).click();
  await page.getByRole("button", { name: /^Send$/ }).click();

  // The response panel reports the normalized network error.
  await expect(
    responsePanel(page).getByText("network"),
  ).toBeVisible();
  // The message appears in the error heading (and may repeat as cause detail).
  await expect(
    responsePanel(page).getByRole("heading", { name: /failed/i }),
  ).toBeVisible();
});

test("error: malformed JSON bodies surface invalid-json errors with raw detail", async ({
  page,
}) => {
  await mockDummyJson(page, []);
  // A later-registered, more specific route wins over the generic mock.
  await page.route("https://dummyjson.com/products**", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"products": [1, 2',
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "GET Get all products" }).click();
  await page.getByRole("button", { name: /^Send$/ }).click();

  await expect(
    responsePanel(page).getByText("invalid-json"),
  ).toBeVisible();
  await expect(
    responsePanel(page).getByText("raw body (truncated)"),
  ).toBeVisible();
  await expect(
    responsePanel(page).getByText('"products": [1, 2'),
  ).toBeVisible();
});

test("change operation: switching resets values and response", async ({ page }) => {
  await openWorkbench(page);
  await page.getByRole("button", { name: "GET Get all products" }).click();
  await page.getByLabel(/^limit/).fill("7");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByRole("status")).toContainText("200");

  await page.getByRole("button", { name: "GET Search products" }).click();
  await expect(page).toHaveURL(/\?op=products-search$/);
  await expect(page.getByLabel(/^q/)).toBeVisible();
  // The previous limit value is not carried over.
  await expect(page.getByLabel(/^limit/)).toHaveValue("");
  // Response panel is back to idle state.
  await expect(
    page.getByText("Send the request to inspect the response."),
  ).toBeVisible();
});