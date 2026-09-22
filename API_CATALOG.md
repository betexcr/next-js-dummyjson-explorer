# DummyJSON API Capability Catalog

This is an implementation checklist. The official docs remain authoritative.

Official source:
https://dummyjson.com/docs

Before implementing a capability, verify the exact current route, method, parameters, request body, and response against the official docs.

## Global capabilities

- [x] pagination: limit
- [x] pagination: skip
- [x] select fields
- [x] sorting
- [x] filtering
- [x] artificial delay
- [x] bearer authorization
- [x] resource search
- [x] related-resource routes
- [x] documented test endpoint
- [x] documented IP endpoint
- [x] all other currently documented utility endpoints

## Products

Verify all current documented operations:
- [x] list
- [x] get by id
- [x] search
- [x] categories/list/category
- [x] add
- [x] update
- [x] delete
- [x] pagination
- [x] select
- [x] sort
- [x] delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/products

## Carts

- [x] list
- [x] get by id
- [x] carts by user
- [x] add
- [x] update
- [x] delete
- [x] pagination/select/delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/carts

## Recipes

- [x] list
- [x] get by id
- [x] search
- [x] meal types
- [x] cuisine list
- [x] by meal type
- [x] by cuisine
- [x] tags
- [x] by tag
- [x] pagination/select/delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/recipes

## Users

- [x] list
- [x] get by id
- [x] search
- [x] filtering
- [x] sorting
- [x] user carts
- [x] user posts
- [x] user todos
- [x] add
- [x] update
- [x] delete
- [x] pagination/select/delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/users

## Posts

- [x] list
- [x] get by id
- [x] search
- [x] posts by user
- [x] comments for post
- [x] add
- [x] update
- [x] delete
- [x] pagination/select/delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/posts

## Comments

Verify every currently documented operation:
- [x] list
- [x] get by id
- [x] search/filter operations
- [x] comments by post
- [x] comments by user if documented
- [x] add
- [x] update
- [x] delete
- [x] pagination/select/delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/comments

## Todos

- [x] list
- [x] get by id
- [x] todos by user
- [x] add
- [x] update
- [x] delete
- [x] pagination/select/delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/todos

## Quotes

- [x] list
- [x] get by id
- [x] random quote
- [x] pagination/select/delay
- [x] authenticated behavior where documented

Docs: https://dummyjson.com/docs/quotes

## Auth

- [x] login
- [x] token handling
- [x] refresh if documented
- [x] current authenticated user
- [x] authenticated requests
- [x] documented demo credentials flow

Docs: https://dummyjson.com/docs/auth

## Images

Verify every current documented image feature:
- [x] basic image generation
- [x] dimensions
- [x] text
- [x] background color
- [x] text color
- [x] font family
- [x] font size
- [x] output format
- [x] identicon if documented
- [x] image/SVG response handling

Docs: https://dummyjson.com/docs

## HTTP / mocking / tools

Verify and expose every currently documented capability in the official docs, including:
- [x] HTTP status behavior
- [x] custom HTTP response
- [x] custom response if currently documented
- [x] webhook/tool capability if currently documented
- [x] other utility endpoints

## Coverage rule

Final completion requires:
1. every currently supported documented operation represented in the registry;
2. every registry operation has required metadata;
3. automated coverage test passes;
4. representative E2E smoke tests exist for every major module;
5. the final agent verifies the catalog against the live official docs before certification.
