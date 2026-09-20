# Architecture

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent accessible primitives
- TanStack Query where useful
- Zod
- Vitest
- Playwright

Use current stable compatible versions at project initialization.

## Layers

```text
Next.js routes/layout
        |
Workbench UI
        |
Feature/domain components
        |
Typed capability registry
        |
DummyJSON API client
        |
HTTP
        |
https://dummyjson.com
```

Supporting concerns:
- local request history
- favorites/collections
- auth/session
- settings
- request/response normalization

## Suggested source layout

```text
src/
  app/
  components/
    workbench/
    request-builder/
    response-viewer/
    json-viewer/
    navigation/
  features/
    api-explorer/
    history/
    favorites/
    auth/
    settings/
  lib/
    dummyjson/
      client.ts
      registry.ts
      operations/
      schemas/
      types.ts
    request/
    storage/
```

The exact structure can improve if justified.

## Capability registry

Use a typed declarative model such as:

```ts
type ApiOperation = {
  id: string
  group: string
  name: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  summary: string
  docsUrl: string
  auth?: "none" | "optional" | "required"
  parameters?: ParameterDefinition[]
  requestBody?: SchemaDefinition
  responseSchema?: unknown
  tags?: string[]
}
```

The registry is the single source for:
- navigation;
- operation lookup;
- request forms;
- documentation metadata;
- coverage tests.

## API client

Centralize:
- URL construction;
- query serialization;
- headers;
- auth;
- body encoding;
- cancellation;
- timeout;
- response normalization;
- error normalization.

Do not scatter raw fetch calls through UI components.

## Validation

Use Zod or equivalent runtime validation for important external responses.

## Authentication

Isolate auth from generic request state.

Support documented login/token/current-user/refresh behavior.

Never hard-code credentials or tokens.

## Error handling

Normalize:
- network errors;
- abort/timeout;
- non-2xx responses;
- invalid JSON;
- validation failures.

Preserve useful response details.

## Performance

- avoid unnecessary global state;
- lazy-load expensive modules;
- do not fetch every resource on initial load;
- virtualize large JSON when needed.

## Accessibility

Keyboard navigation, accessible names, focus management, and non-color-only status indicators are required.

## Security

- no committed secrets;
- never execute API response content;
- sanitize any rendered remote text;
- avoid unsafe HTML;
- document localStorage security limitations.
