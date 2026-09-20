# Testing Strategy

## Unit

Test:
- operation registry;
- coverage completeness;
- URL/path/query serialization;
- request body serialization;
- auth headers;
- response normalization;
- error normalization;
- Zod schemas;
- local persistence;
- request history.

## Integration

Test:
- API client with mocked HTTP;
- request builder -> API client;
- response viewer;
- auth state transitions.

## E2E

Use Playwright.

Minimum:
1. open app;
2. navigate to operation;
3. fill parameters;
4. execute GET;
5. inspect response;
6. copy request;
7. replay history;
8. favorite/save operation;
9. login;
10. execute authenticated request;
11. execute POST/PATCH/DELETE;
12. exercise image capability;
13. exercise HTTP/mock capability.

## Live API

The default suite must not depend on DummyJSON uptime.

Use mocked HTTP for deterministic tests.

An opt-in live smoke mode may exist:
`LIVE_API_TESTS=1 bun test`

## Coverage

The coverage test fails when:
- a catalog capability is missing from the registry;
- registry metadata is incomplete;
- a major module lacks E2E smoke coverage.

## Visual/accessibility QA

Playwright should verify:
- no uncaught console errors;
- navigation works;
- request form renders;
- response viewer renders;
- no catastrophic mobile overflow;
- keyboard navigation reaches important controls.

## Failure discipline

Do not alter tests just because implementation fails.
Fix the implementation or explicitly document an external/environmental failure.
