# DummyJSON Workbench — Product Specification

## Product

A polished developer-facing API workbench for exploring, learning, testing, and exercising the DummyJSON REST API.

It should feel like a lightweight API client, not a collection of CRUD demo pages.

## Core experience

Users can:
- browse every supported API capability;
- select an operation;
- read its documentation;
- fill path/query/body/header parameters;
- execute requests;
- inspect status, headers, timing, and response body;
- copy cURL and fetch examples;
- replay requests from history;
- favorite useful operations;
- configure API settings;
- authenticate against DummyJSON;
- exercise authenticated requests;
- exercise image endpoints;
- exercise HTTP/mock endpoints;
- discover resource relationships.

## UI

Desktop-first and responsive.

Developer-tool visual language:
- compact navigation;
- method badges;
- readable monospace JSON;
- request/response split workspace;
- command palette;
- useful empty/loading/error states;
- keyboard-friendly interactions;
- accessible controls.

Do not create one-off screens for every endpoint. Build reusable workbench primitives.

## Resource areas

Expose all capabilities documented by the official DummyJSON docs, including applicable:
- Products
- Carts
- Recipes
- Users
- Posts
- Comments
- Todos
- Quotes
- Auth
- Images
- HTTP / mocking
- utility/tool endpoints
- cross-resource relationships

## Request builder

Support where applicable:
- HTTP method
- path parameters
- query parameters
- headers
- JSON request body
- bearer authentication
- request execution
- cancellation when practical
- request timing

## Response viewer

Support:
- formatted JSON
- raw response
- headers
- HTTP status
- duration
- copy
- download when useful
- search within response

## History and collections

Persist recent requests locally.
Allow favorites/saved operations.
Allow replay.
Never persist secrets unnecessarily.

## Documentation

Each operation should expose:
- method
- path
- summary
- parameters
- body schema where applicable
- response information where available
- official documentation link

## Quality bar

The final product should be portfolio-quality and useful as:
- a DummyJSON reference;
- an API playground;
- an API testing workbench;
- a demonstration of declarative API tooling.
