import type { ApiOperation } from "../types";
import {
  body,
  delayParam,
  listParams,
  op,
  pathId,
} from "./helpers";

const DOCS = "https://dummyjson.com/docs/carts";

export const cartsOperations: ApiOperation[] = [
  op(
    "carts-list",
    "carts",
    "Get all carts",
    "GET",
    "/carts",
    "Returns a paginated list of carts. By default you get 30 items.",
    `${DOCS}#carts-all`,
    {
      parameters: listParams({ sort: true }),
      tags: ["carts", "list", "pagination"],
    },
  ),
  op(
    "carts-get",
    "carts",
    "Get a single cart",
    "GET",
    "/carts/{id}",
    "Returns a single cart by id.",
    `${DOCS}#carts-single`,
    {
      parameters: [pathId("id", "The cart id."), ...listParams()],
      responseKind: "json",
      tags: ["carts", "by id"],
    },
  ),
  op(
    "carts-user",
    "carts",
    "Get carts by user",
    "GET",
    "/carts/user/{userId}",
    "Returns all carts belonging to a user.",
    `${DOCS}#carts-user`,
    {
      parameters: [pathId("userId", "The user id."), ...listParams()],
      tags: ["carts", "relationship", "user"],
    },
  ),
  op(
    "carts-add",
    "carts",
    "Add a cart",
    "POST",
    "/carts/add",
    "Simulates creating a cart. Provide a `userId` and an array of products with `id` and `quantity`.",
    `${DOCS}#carts-add`,
    {
      parameters: [delayParam()],
      requestBody: body({
        userId: 1,
        products: [
          { id: 144, quantity: 4 },
          { id: 98, quantity: 1 },
        ],
      }),
      responseKind: "json",
      tags: ["carts", "crud", "create"],
    },
  ),
  op(
    "carts-update",
    "carts",
    "Update a cart",
    "PUT",
    "/carts/{id}",
    "Simulates updating a cart (PUT or PATCH). Pass `merge: true` to include existing products.",
    `${DOCS}#carts-update`,
    {
      parameters: [pathId("id", "The cart id."), ...listParams()],
      requestBody: body({
        merge: true,
        products: [{ id: 1, quantity: 1 }],
      }),
      responseKind: "json",
      tags: ["carts", "crud", "update"],
    },
  ),
  op(
    "carts-delete",
    "carts",
    "Delete a cart",
    "DELETE",
    "/carts/{id}",
    "Simulates deleting a cart. Returns the deleted cart with `isDeleted` and `deletedOn`.",
    `${DOCS}#carts-delete`,
    {
      parameters: [pathId("id", "The cart id."), ...listParams()],
      responseKind: "json",
      tags: ["carts", "crud", "delete"],
    },
  ),
];