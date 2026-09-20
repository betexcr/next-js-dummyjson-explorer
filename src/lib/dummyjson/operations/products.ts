import type { ApiOperation } from "../types";
import {
  body,
  delayParam,
  listParams,
  op,
  pathId,
} from "./helpers";

const DOCS = "https://dummyjson.com/docs/products";

export const productsOperations: ApiOperation[] = [
  op(
    "products-list",
    "products",
    "Get all products",
    "GET",
    "/products",
    "Returns a paginated list of products. By default you get 30 items.",
    `${DOCS}#products-all`,
    {
      parameters: listParams({
        sort: true,
        extra: [
          {
            name: "modifiedAfter",
            in: "query",
            type: "string",
            required: false,
            description:
              "ISO 8601 date. Only return products whose `meta.updatedAt` falls after this time.",
            placeholder: "2026-06-01T00:00:00Z",
          },
          {
            name: "modifiedBefore",
            in: "query",
            type: "string",
            required: false,
            description:
              "ISO 8601 date. Only return products whose `meta.updatedAt` falls before this time.",
            placeholder: "2026-07-01T00:00:00Z",
          },
        ],
      }),
      tags: ["products", "list", "pagination"],
    },
  ),
  op(
    "products-get",
    "products",
    "Get a single product",
    "GET",
    "/products/{id}",
    "Returns a single product by id.",
    `${DOCS}#products-single`,
    {
      parameters: [pathId("id", "The product id."), ...listParams()],
      responseKind: "json",
      tags: ["products", "by id"],
    },
  ),
  op(
    "products-search",
    "products",
    "Search products",
    "GET",
    "/products/search",
    "Search for products by keyword (`q`). Results match title, description and more.",
    `${DOCS}#products-search`,
    {
      parameters: [
        {
          name: "q",
          in: "query",
          type: "string",
          required: true,
          description: "Search keyword.",
          placeholder: "phone",
        },
        ...listParams(),
      ],
      tags: ["products", "search"],
    },
  ),
  op(
    "products-categories",
    "products",
    "Get all product categories",
    "GET",
    "/products/categories",
    "Returns all product categories as objects with slug, name and url.",
    `${DOCS}#products-categories`,
    {
      parameters: [delayParam()],
      responseKind: "json",
      tags: ["products", "categories"],
    },
  ),
  op(
    "products-category-list",
    "products",
    "Get product category list",
    "GET",
    "/products/category-list",
    "Returns all product categories as a simple list of slug strings.",
    `${DOCS}#products-category_list`,
    {
      parameters: [delayParam()],
      responseKind: "json",
      tags: ["products", "categories"],
    },
  ),
  op(
    "products-category",
    "products",
    "Get products by category",
    "GET",
    "/products/category/{category}",
    "Returns products belonging to a category slug.",
    `${DOCS}#products-category`,
    {
      parameters: [
        {
          name: "category",
          in: "path",
          type: "string",
          required: true,
          description: "Category slug, e.g. `smartphones`.",
          placeholder: "smartphones",
        },
        ...listParams(),
      ],
      tags: ["products", "categories"],
    },
  ),
  op(
    "products-add",
    "products",
    "Add a product",
    "POST",
    "/products/add",
    "Simulates adding a new product. Returns the created product with a new id.",
    `${DOCS}#products-add`,
    {
      parameters: [delayParam()],
      requestBody: body(
        {
          title: "BMW Pencil",
          description: "A premium wooden pencil.",
          price: 9.99,
          category: "stationery",
          stock: 10,
        },
        {
          description:
            "The product object. Only `title` is strictly needed to simulate a create.",
        },
      ),
      responseKind: "json",
      tags: ["products", "crud", "create"],
    },
  ),
  op(
    "products-update",
    "products",
    "Update a product",
    "PUT",
    "/products/{id}",
    "Simulates updating a product (PUT or PATCH). Returns the product with modified data.",
    `${DOCS}#products-update`,
    {
      parameters: [pathId("id", "The product id."), ...listParams()],
      requestBody: body({ title: "iPhone Galaxy +1" }),
      responseKind: "json",
      tags: ["products", "crud", "update"],
    },
  ),
  op(
    "products-delete",
    "products",
    "Delete a product",
    "DELETE",
    "/products/{id}",
    "Simulates deleting a product. Returns the deleted product with `isDeleted` and `deletedOn`.",
    `${DOCS}#products-delete`,
    {
      parameters: [pathId("id", "The product id."), ...listParams()],
      responseKind: "json",
      tags: ["products", "crud", "delete"],
    },
  ),
];