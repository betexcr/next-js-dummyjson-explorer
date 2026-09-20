# DummyJSON API Capability Catalog

This is an implementation checklist. The official docs remain authoritative.

Official source:
https://dummyjson.com/docs

Before implementing a capability, verify the exact current route, method, parameters, request body, and response against the official docs.

## Global capabilities

- [ ] pagination: limit
- [ ] pagination: skip
- [ ] select fields
- [ ] sorting
- [ ] filtering
- [ ] artificial delay
- [ ] bearer authorization
- [ ] resource search
- [ ] related-resource routes
- [ ] documented test endpoint
- [ ] documented IP endpoint
- [ ] all other currently documented utility endpoints

## Products

Verify all current documented operations:
- [ ] list
- [ ] get by id
- [ ] search
- [ ] categories/list/category
- [ ] add
- [ ] update
- [ ] delete
- [ ] pagination
- [ ] select
- [ ] sort
- [ ] delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/products

## Carts

- [ ] list
- [ ] get by id
- [ ] carts by user
- [ ] add
- [ ] update
- [ ] delete
- [ ] pagination/select/delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/carts

## Recipes

- [ ] list
- [ ] get by id
- [ ] search
- [ ] meal types
- [ ] cuisine list
- [ ] by meal type
- [ ] by cuisine
- [ ] tags
- [ ] by tag
- [ ] pagination/select/delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/recipes

## Users

- [ ] list
- [ ] get by id
- [ ] search
- [ ] filtering
- [ ] sorting
- [ ] user carts
- [ ] user posts
- [ ] user todos
- [ ] add
- [ ] update
- [ ] delete
- [ ] pagination/select/delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/users

## Posts

- [ ] list
- [ ] get by id
- [ ] search
- [ ] posts by user
- [ ] comments for post
- [ ] add
- [ ] update
- [ ] delete
- [ ] pagination/select/delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/posts

## Comments

Verify every currently documented operation:
- [ ] list
- [ ] get by id
- [ ] search/filter operations
- [ ] comments by post
- [ ] comments by user if documented
- [ ] add
- [ ] update
- [ ] delete
- [ ] pagination/select/delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/comments

## Todos

- [ ] list
- [ ] get by id
- [ ] todos by user
- [ ] add
- [ ] update
- [ ] delete
- [ ] pagination/select/delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/todos

## Quotes

- [ ] list
- [ ] get by id
- [ ] random quote
- [ ] pagination/select/delay
- [ ] authenticated behavior where documented

Docs: https://dummyjson.com/docs/quotes

## Auth

- [ ] login
- [ ] token handling
- [ ] refresh if documented
- [ ] current authenticated user
- [ ] authenticated requests
- [ ] documented demo credentials flow

Docs: https://dummyjson.com/docs/auth

## Images

Verify every current documented image feature:
- [ ] basic image generation
- [ ] dimensions
- [ ] text
- [ ] background color
- [ ] text color
- [ ] font family
- [ ] font size
- [ ] output format
- [ ] identicon if documented
- [ ] image/SVG response handling

Docs: https://dummyjson.com/docs

## HTTP / mocking / tools

Verify and expose every currently documented capability in the official docs, including:
- [ ] HTTP status behavior
- [ ] custom HTTP response
- [ ] custom response if currently documented
- [ ] webhook/tool capability if currently documented
- [ ] other utility endpoints

## Coverage rule

Final completion requires:
1. every currently supported documented operation represented in the registry;
2. every registry operation has required metadata;
3. automated coverage test passes;
4. representative E2E smoke tests exist for every major module;
5. the final agent verifies the catalog against the live official docs before certification.
