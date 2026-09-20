import type { ApiGroup, ApiOperation, GroupId } from "./types";
import { authOperations } from "./operations/auth";
import { cartsOperations } from "./operations/carts";
import { commentsOperations } from "./operations/comments";
import { httpOperations } from "./operations/http";
import { imageOperations } from "./operations/image";
import { postsOperations } from "./operations/posts";
import { productsOperations } from "./operations/products";
import { quotesOperations } from "./operations/quotes";
import { recipesOperations } from "./operations/recipes";
import { todosOperations } from "./operations/todos";
import { toolsOperations } from "./operations/tools";
import { usersOperations } from "./operations/users";
import { utilityOperations } from "./operations/utility";

/**
 * Capability groups in the order they should be presented in navigation.
 * The registry is the single source of truth for navigation, operation
 * lookup, request forms, documentation metadata, and coverage tests.
 */
export const GROUPS: ApiGroup[] = [
  {
    id: "products",
    name: "Products",
    description: "E-commerce product catalog with categories, search, and CRUD.",
    docsUrl: "https://dummyjson.com/docs/products",
  },
  {
    id: "carts",
    name: "Carts",
    description: "Shopping carts tied to users with line items and CRUD.",
    docsUrl: "https://dummyjson.com/docs/carts",
  },
  {
    id: "recipes",
    name: "Recipes",
    description: "Recipes with tags, meal types, search, and CRUD.",
    docsUrl: "https://dummyjson.com/docs/recipes",
  },
  {
    id: "users",
    name: "Users",
    description: "User records with filtering, relationships, and CRUD.",
    docsUrl: "https://dummyjson.com/docs/users",
  },
  {
    id: "posts",
    name: "Posts",
    description: "Blog posts with tags, authors, comments, and CRUD.",
    docsUrl: "https://dummyjson.com/docs/posts",
  },
  {
    id: "comments",
    name: "Comments",
    description: "Comments attached to posts, with CRUD.",
    docsUrl: "https://dummyjson.com/docs/comments",
  },
  {
    id: "todos",
    name: "Todos",
    description: "Task list items per user, with CRUD.",
    docsUrl: "https://dummyjson.com/docs/todos",
  },
  {
    id: "quotes",
    name: "Quotes",
    description: "Quotes collection with random selection.",
    docsUrl: "https://dummyjson.com/docs/quotes",
  },
  {
    id: "auth",
    name: "Auth",
    description: "Login, token refresh, and authenticated user retrieval.",
    docsUrl: "https://dummyjson.com/docs/auth",
  },
  {
    id: "image",
    name: "Images",
    description: "Dynamic placeholder images, colors, text, formats, and identicons.",
    docsUrl: "https://dummyjson.com/docs/image",
  },
  {
    id: "http",
    name: "HTTP / Mocking",
    description: "Mock HTTP responses for any status code with custom messages.",
    docsUrl: "https://dummyjson.com/docs/http",
  },
  {
    id: "tools",
    name: "Tools",
    description: "TOTP generation, custom mock APIs, and webhook inspection.",
    docsUrl: "https://dummyjson.com/docs/tools",
  },
  {
    id: "utility",
    name: "Utility",
    description: "Vanity endpoints such as the test route and client IP lookup.",
    docsUrl: "https://dummyjson.com/docs",
  },
];

const OPERATION_MODULES: ApiOperation[][] = [
  productsOperations,
  cartsOperations,
  recipesOperations,
  usersOperations,
  postsOperations,
  commentsOperations,
  todosOperations,
  quotesOperations,
  authOperations,
  imageOperations,
  httpOperations,
  toolsOperations,
  utilityOperations,
];

/** Every registered operation, stable and ordered by group. */
export const OPERATIONS: ApiOperation[] = OPERATION_MODULES.flat();

/** Immutable lookup map keyed by operation id. */
const OPERATION_BY_ID = new Map(OPERATIONS.map((o) => [o.id, o]));

const GROUP_BY_ID = new Map(GROUPS.map((g) => [g.id, g]));

/** Returns an operation by its stable id, or `undefined`. */
export function getOperation(id: string): ApiOperation | undefined {
  return OPERATION_BY_ID.get(id);
}

/** Returns a group by its id, or `undefined`. */
export function getGroup(id: GroupId): ApiGroup | undefined {
  return GROUP_BY_ID.get(id);
}

/** Returns all operations belonging to a group, in registry order. */
export function getOperationsByGroup(group: GroupId): ApiOperation[] {
  return OPERATIONS.filter((o) => o.group === group);
}

/**
 * Full-text search across operation names, summaries, tags, methods, and
 * groups. Case-insensitive; every term must match somewhere.
 */
export function searchOperations(query: string): ApiOperation[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (terms.length === 0) return [];

  return OPERATIONS.filter((o) => {
    const group = GROUP_BY_ID.get(o.group)?.name.toLowerCase() ?? "";
    const haystack = [
      o.id,
      o.name,
      o.summary,
      o.method,
      o.path,
      group,
      ...(o.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

/** Returns the number of operations registered for a group (0 if unknown). */
export function countOperations(group: GroupId): number {
  return OPERATIONS.filter((o) => o.group === group).length;
}