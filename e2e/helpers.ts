/**
 * Shared E2E helpers (TASK-034).
 *
 * Every test mocks the DummyJSON transport with `page.route` so the suite is
 * deterministic and never depends on DummyJSON uptime (TESTING.md).
 */

import { type Page, type Route } from "@playwright/test";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

export const productsBody = {
  products: [{ id: 1, title: "Test Product", price: 9.99 }],
  total: 1,
  skip: 0,
  limit: 30,
};

export const searchBody = {
  products: [{ id: 5, title: "iPhone 9", price: 549 }],
  total: 1,
  skip: 0,
  limit: 30,
};

export const singleProductBody = {
  id: 1,
  title: "Test Product",
  description: "A single mocked product.",
  price: 9.99,
  category: "stationery",
  stock: 10,
};

export const createdProductBody = {
  id: 101,
  title: "BMW Pencil",
  description: "A premium wooden pencil.",
  price: 9.99,
  category: "stationery",
  stock: 10,
};

export const deletedProductBody = {
  id: 1,
  title: "Test Product",
  isDeleted: true,
  deletedOn: "2026-09-20T12:00:00.000Z",
};

export const loginBody = {
  accessToken: "access-token-123",
  refreshToken: "refresh-token-456",
  id: 1,
  username: "emilys",
  email: "emily@example.com",
  firstName: "Emily",
  lastName: "Johnson",
  gender: "female",
  image: "https://dummyjson.com/icon/emilys/128",
};

export const meBody = {
  id: 1,
  username: "emilys",
  email: "emily@example.com",
  firstName: "Emily",
  lastName: "Johnson",
};

export const SVG_IMAGE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="teal"/><text x="200" y="200" fill="white" text-anchor="middle">mock</text></svg>';

/** Shared mutable capture so tests can assert what the UI actually sent. */
export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData: string | null;
}

async function fulfillJson(
  route: Route,
  body: unknown,
  status = 200,
): Promise<void> {
  await route.fulfill({
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function fulfillSvg(route: Route, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: { ...CORS_HEADERS, "content-type": "image/svg+xml" },
    body: SVG_IMAGE,
  });
}

/**
 * Intercepts every `https://dummyjson.com/**` request and answers from canned
 * fixtures. `seen` captures the last request for assertions (auth headers,
 * POST bodies, method/path matching).
 */
export async function mockDummyJson(
  page: Page,
  seen: CapturedRequest[],
): Promise<void> {
  await page.route("https://dummyjson.com/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const headers = request.headers();
    const postData = request.postData();

    seen.push({ url: request.url(), method, headers, postData });

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    // Auth endpoints.
    if (url.pathname === "/auth/login" && method === "POST") {
      await fulfillJson(route, loginBody);
      return;
    }
    if (url.pathname === "/auth/me" && method === "GET") {
      await fulfillJson(route, meBody);
      return;
    }
    if (url.pathname === "/auth/refresh" && method === "POST") {
      await fulfillJson(route, {
        accessToken: "refreshed-access-token",
        refreshToken: "new-refresh-token",
        id: 1,
        username: "emilys",
        email: "emily@example.com",
        firstName: "Emily",
        lastName: "Johnson",
      });
      return;
    }

    // Products.
    if (url.pathname === "/products/search") {
      await fulfillJson(route, searchBody);
      return;
    }
    if (url.pathname === "/products/add" && method === "POST") {
      await fulfillJson(route, createdProductBody, 201);
      return;
    }
    if (url.pathname === "/products" && method === "GET") {
      await fulfillJson(route, productsBody);
      return;
    }
    const singleProduct = url.pathname.match(/^\/products\/(\d+)$/);
    if (singleProduct) {
      if (method === "GET") {
        await fulfillJson(route, singleProductBody);
      } else if (method === "PUT" || method === "PATCH") {
        await fulfillJson(route, { ...singleProductBody, id: Number(singleProduct[1]) });
      } else if (method === "DELETE") {
        await fulfillJson(route, deletedProductBody);
      } else {
        await fulfillJson(route, { message: "unsupported product method" }, 405);
      }
      return;
    }

    // HTTP / mocking: echo the requested status with a JSON body.
    const httpMatch = url.pathname.match(/^\/http\/(\d{3})(?:\/(.+))?$/);
    if (httpMatch) {
      const status = Number(httpMatch[1]);
      await fulfillJson(route, {
        message: httpMatch[2] ?? `Mocked HTTP ${status}`,
      }, status);
      return;
    }

    // Images: any /image or /icon route returns an SVG preview.
    if (url.pathname.startsWith("/image/") || url.pathname.startsWith("/icon/")) {
      await fulfillSvg(route);
      return;
    }

    // Fallback so no request ever hangs; tests assert on explicit fixtures.
    await fulfillJson(route, { ok: true, url: request.url() });
  });
}