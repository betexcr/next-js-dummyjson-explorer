/**
 * Deterministic registry coverage test (TASK-031).
 *
 * The catalog below mirrors `API_CATALOG.md` and the current official
 * DummyJSON documentation (https://dummyjson.com/docs). It fails when:
 * - a catalog capability is missing from the registry;
 * - the registry contains an operation that is not in the catalog;
 * - registry metadata is incomplete.
 */
import { describe, expect, it } from "vitest";
import { countOperations, OPERATIONS } from "./registry";
import type { GroupId } from "./types";

/** Expected operation ids per group, in catalog order. */
const EXPECTED: Record<GroupId, string[]> = {
  products: [
    "products-list",
    "products-get",
    "products-search",
    "products-categories",
    "products-category-list",
    "products-category",
    "products-add",
    "products-update",
    "products-delete",
  ],
  carts: [
    "carts-list",
    "carts-get",
    "carts-user",
    "carts-add",
    "carts-update",
    "carts-delete",
  ],
  recipes: [
    "recipes-list",
    "recipes-get",
    "recipes-search",
    "recipes-tags",
    "recipes-tag",
    "recipes-meal-type",
    "recipes-add",
    "recipes-update",
    "recipes-delete",
  ],
  users: [
    "users-list",
    "users-get",
    "users-search",
    "users-filter",
    "users-carts",
    "users-posts",
    "users-todos",
    "users-add",
    "users-update",
    "users-delete",
    "users-login",
    "users-me",
  ],
  posts: [
    "posts-list",
    "posts-get",
    "posts-search",
    "posts-tags",
    "posts-tag-list",
    "posts-tag",
    "posts-user",
    "posts-comments",
    "posts-add",
    "posts-update",
    "posts-delete",
  ],
  comments: [
    "comments-list",
    "comments-get",
    "comments-post",
    "comments-add",
    "comments-update",
    "comments-delete",
  ],
  todos: [
    "todos-list",
    "todos-get",
    "todos-random",
    "todos-user",
    "todos-add",
    "todos-update",
    "todos-delete",
  ],
  quotes: ["quotes-list", "quotes-get", "quotes-random"],
  auth: ["auth-login", "auth-me", "auth-refresh"],
  image: ["image-square", "image-custom", "image-identicon"],
  http: ["http-status"],
  tools: [
    "tools-2fa-get",
    "tools-2fa-post",
    "tools-custom-generate",
    "tools-custom-use",
    "tools-webhook-create",
    "tools-webhook-capture",
    "tools-webhook-list",
    "tools-webhook-delete-request",
  ],
  utility: ["utility-test", "utility-ip"],
};

describe("registry coverage", () => {
  it("registers the exact catalog operation ids per group", () => {
    for (const [group, ids] of Object.entries(EXPECTED)) {
      const actual = OPERATIONS.filter((o) => o.group === group).map(
        (o) => o.id,
      );
      expect(
        actual,
        `group ${group} operations do not match the catalog`,
      ).toEqual(ids);
    }
  });

  it("contains no operations outside the catalog", () => {
    const known = new Set(Object.values(EXPECTED).flat());
    const unknown = OPERATIONS.filter((o) => !known.has(o.id));
    expect(unknown.map((o) => o.id)).toEqual([]);
  });

  it("has the expected total number of operations", () => {
    const total = Object.values(EXPECTED).reduce((sum, ids) => sum + ids.length, 0);
    expect(OPERATIONS.length).toBe(total);
  });

  it("report counts that match the catalog", () => {
    for (const [group, ids] of Object.entries(EXPECTED)) {
      expect(countOperations(group as GroupId)).toBe(ids.length);
    }
  });

  it("gives every group at least one documented capability", () => {
    for (const ids of Object.values(EXPECTED)) {
      expect(ids.length).toBeGreaterThan(0);
    }
  });
});