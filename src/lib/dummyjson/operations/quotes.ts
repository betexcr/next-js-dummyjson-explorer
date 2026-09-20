import type { ApiOperation } from "../types";
import { delayParam, listParams, op, pathId } from "./helpers";

const DOCS = "https://dummyjson.com/docs/quotes";

export const quotesOperations: ApiOperation[] = [
  op(
    "quotes-list",
    "quotes",
    "Get all quotes",
    "GET",
    "/quotes",
    "Returns a paginated list of quotes. By default you get 30 items.",
    `${DOCS}#quotes-all`,
    {
      parameters: listParams({ sort: true }),
      tags: ["quotes", "list", "pagination"],
    },
  ),
  op(
    "quotes-get",
    "quotes",
    "Get a single quote",
    "GET",
    "/quotes/{id}",
    "Returns a single quote by id.",
    `${DOCS}#quotes-single`,
    {
      parameters: [pathId("id", "The quote id."), ...listParams()],
      responseKind: "json",
      tags: ["quotes", "by id"],
    },
  ),
  op(
    "quotes-random",
    "quotes",
    "Get a random quote",
    "GET",
    "/quotes/random",
    "Returns a random quote. Optionally pass `count` to get several random quotes.",
    `${DOCS}#quotes-random`,
    {
      parameters: [
        {
          name: "count",
          in: "query",
          type: "number",
          required: false,
          description: "Number of random quotes to return (max 10).",
          placeholder: "3",
        },
        delayParam(),
      ],
      responseKind: "json",
      tags: ["quotes", "random"],
    },
  ),
];