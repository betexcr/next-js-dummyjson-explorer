import type { ApiOperation } from "../types";
import {
  body,
  delayParam,
  listParams,
  op,
  pathId,
} from "./helpers";

const DOCS = "https://dummyjson.com/docs/todos";

export const todosOperations: ApiOperation[] = [
  op(
    "todos-list",
    "todos",
    "Get all todos",
    "GET",
    "/todos",
    "Returns a paginated list of todos. By default you get 30 items.",
    `${DOCS}#todos-all`,
    {
      parameters: listParams({ sort: true }),
      tags: ["todos", "list", "pagination"],
    },
  ),
  op(
    "todos-get",
    "todos",
    "Get a single todo",
    "GET",
    "/todos/{id}",
    "Returns a single todo by id.",
    `${DOCS}#todos-single`,
    {
      parameters: [pathId("id", "The todo id."), ...listParams()],
      responseKind: "json",
      tags: ["todos", "by id"],
    },
  ),
  op(
    "todos-random",
    "todos",
    "Get a random todo",
    "GET",
    "/todos/random/{count}",
    "Returns one random todo, or up to 10 random todos when a count is provided.",
    `${DOCS}#todos-random`,
    {
      parameters: [
        {
          name: "count",
          in: "path",
          type: "number",
          required: false,
          optionalPathSegment: true,
          description: "Number of random todos to return (max 10). Omit for a single todo.",
          placeholder: "10",
        },
        delayParam(),
      ],
      responseKind: "json",
      tags: ["todos", "random"],
    },
  ),
  op(
    "todos-user",
    "todos",
    "Get todos by user",
    "GET",
    "/todos/user/{userId}",
    "Returns all todos belonging to a user id.",
    `${DOCS}#todos-user`,
    {
      parameters: [pathId("userId", "The user id."), ...listParams()],
      tags: ["todos", "relationship", "user"],
    },
  ),
  op(
    "todos-add",
    "todos",
    "Add a todo",
    "POST",
    "/todos/add",
    "Simulates creating a todo. Returns the created todo with a new id.",
    `${DOCS}#todos-add`,
    {
      parameters: [delayParam()],
      requestBody: body({
        todo: "Use DummyJSON in the project",
        completed: false,
        userId: 5,
      }),
      responseKind: "json",
      tags: ["todos", "crud", "create"],
    },
  ),
  op(
    "todos-update",
    "todos",
    "Update a todo",
    "PUT",
    "/todos/{id}",
    "Simulates updating a todo (PUT or PATCH). Returns the todo with modified data.",
    `${DOCS}#todos-update`,
    {
      parameters: [pathId("id", "The todo id."), ...listParams()],
      requestBody: body({ completed: false }),
      responseKind: "json",
      tags: ["todos", "crud", "update"],
    },
  ),
  op(
    "todos-delete",
    "todos",
    "Delete a todo",
    "DELETE",
    "/todos/{id}",
    "Simulates deleting a todo. Returns the deleted todo with `isDeleted` and `deletedOn`.",
    `${DOCS}#todos-delete`,
    {
      parameters: [pathId("id", "The todo id."), ...listParams()],
      responseKind: "json",
      tags: ["todos", "crud", "delete"],
    },
  ),
];