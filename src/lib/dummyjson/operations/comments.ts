import type { ApiOperation } from "../types";
import {
  body,
  delayParam,
  listParams,
  op,
  pathId,
} from "./helpers";

const DOCS = "https://dummyjson.com/docs/comments";

export const commentsOperations: ApiOperation[] = [
  op(
    "comments-list",
    "comments",
    "Get all comments",
    "GET",
    "/comments",
    "Returns a paginated list of comments. By default you get 30 items.",
    `${DOCS}#comments-all`,
    {
      parameters: listParams({ sort: true }),
      tags: ["comments", "list", "pagination"],
    },
  ),
  op(
    "comments-get",
    "comments",
    "Get a single comment",
    "GET",
    "/comments/{id}",
    "Returns a single comment by id.",
    `${DOCS}#comments-single`,
    {
      parameters: [pathId("id", "The comment id."), ...listParams()],
      responseKind: "json",
      tags: ["comments", "by id"],
    },
  ),
  op(
    "comments-post",
    "comments",
    "Get comments by post",
    "GET",
    "/comments/post/{postId}",
    "Returns all comments for a post id.",
    `${DOCS}#comments-post`,
    {
      parameters: [pathId("postId", "The post id."), ...listParams()],
      tags: ["comments", "relationship", "post"],
    },
  ),
  op(
    "comments-add",
    "comments",
    "Add a comment",
    "POST",
    "/comments/add",
    "Simulates creating a comment. Returns the created comment with a new id.",
    `${DOCS}#comments-add`,
    {
      parameters: [delayParam()],
      requestBody: body({
        body: "This makes all sense to me!",
        postId: 3,
        userId: 5,
      }),
      responseKind: "json",
      tags: ["comments", "crud", "create"],
    },
  ),
  op(
    "comments-update",
    "comments",
    "Update a comment",
    "PUT",
    "/comments/{id}",
    "Simulates updating a comment (PUT or PATCH). Returns the comment with modified data.",
    `${DOCS}#comments-update`,
    {
      parameters: [pathId("id", "The comment id."), ...listParams()],
      requestBody: body({ body: "I think I should shift to the moon" }),
      responseKind: "json",
      tags: ["comments", "crud", "update"],
    },
  ),
  op(
    "comments-delete",
    "comments",
    "Delete a comment",
    "DELETE",
    "/comments/{id}",
    "Simulates deleting a comment. Returns the deleted comment with `isDeleted` and `deletedOn`.",
    `${DOCS}#comments-delete`,
    {
      parameters: [pathId("id", "The comment id."), ...listParams()],
      responseKind: "json",
      tags: ["comments", "crud", "delete"],
    },
  ),
];