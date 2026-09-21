# DummyJSON Workbench — Autonomous Task Queue

> Authoritative implementation queue for the autonomous coding harness.
>
> Status:
> - `[ ]` Not started
> - `[~]` In progress
> - `[x]` Complete and verified
> - `[!]` Blocked
>
> A task may only become `[x]` after its acceptance criteria and required verification
> have actually passed.

# Phase 0 — Foundation

## TASK-001 — Establish application foundation
Status: `[x]`

Establish the production application foundation and development toolchain.

Acceptance:
- [ ] Application starts successfully.
- [ ] Dependencies install successfully.
- [ ] TypeScript configuration is valid.
- [ ] ESLint configuration is valid.
- [ ] Vitest configuration is valid.
- [ ] Playwright configuration is valid.
- [ ] Production build succeeds.
- [ ] No unnecessary framework/config duplication exists.

## TASK-002 — Establish project structure
Status: `[x]`

Create clean boundaries for UI, API client, operation definitions, schemas,
request state, response state, utilities, and tests.

Acceptance:
- [ ] Matches `ARCHITECTURE.md`.
- [ ] No duplicated API clients.
- [ ] Shared primitives have clear ownership.
- [ ] Server/client boundaries are intentional.
- [ ] Core library tests can run independently of UI.

## TASK-003 — Establish typed domain model
Status: `[x]`

Create shared TypeScript/Zod models for operation metadata, endpoints, HTTP methods,
path/query/body parameters, responses, pagination, selection, sorting, delay,
authentication, examples, and capability groups.

Acceptance:
- [ ] Types compile.
- [ ] Runtime validation exists where appropriate.
- [ ] No unnecessary `any`.
- [ ] Models are reusable by UI and request execution.

# Phase 1 — API Capability Registry

## TASK-004 — Create operation registry
Status: `[x]`

Create the single source of truth for DummyJSON capabilities.

Acceptance:
- [ ] Typed registry.
- [ ] All applicable catalog capabilities represented.
- [ ] Stable operation identity.
- [ ] Group/method/path metadata.
- [ ] Parameter metadata.
- [ ] Registry query helpers.
- [ ] Automated registry coverage test.

## TASK-005 — Products operations
Status: `[x]`

Implement all applicable documented Products operations from `API_CATALOG.md`.

Acceptance:
- [ ] List
- [ ] Get
- [ ] Search
- [ ] Categories
- [ ] Category products
- [ ] Add
- [ ] Update
- [ ] Delete
- [ ] Pagination
- [ ] Select
- [ ] Sort
- [ ] Delay
- [ ] Other documented options

Verify routes against the official DummyJSON documentation. Do not invent endpoints.

## TASK-006 — Carts operations
Status: `[x]`

Implement all applicable documented Carts operations.

Acceptance:
- [ ] List
- [ ] Get
- [ ] User-related operations where documented
- [ ] Add
- [ ] Update
- [ ] Delete
- [ ] Applicable pagination/options
- [ ] Request/response validation

## TASK-007 — Recipes operations
Status: `[x]`

Implement all applicable documented Recipes operations.

Acceptance:
- [ ] List
- [ ] Get
- [ ] Search
- [ ] Category functionality
- [ ] Tag functionality where documented
- [ ] Applicable pagination/filter options
- [ ] Validation

## TASK-008 — Users operations
Status: `[x]`

Implement all applicable documented Users operations.

Acceptance:
- [ ] List
- [ ] Get
- [ ] Search
- [ ] Filtering where documented
- [ ] Add/update/delete where documented
- [ ] Authentication behavior separated appropriately
- [ ] Validation

## TASK-009 — Posts operations
Status: `[x]`

Implement all applicable documented Posts operations.

Acceptance:
- [ ] List
- [ ] Get
- [ ] Search
- [ ] User-related operations where documented
- [ ] Add
- [ ] Update
- [ ] Delete
- [ ] Pagination/options

## TASK-010 — Comments operations
Status: `[x]`

Implement all applicable documented Comments operations.

Acceptance:
- [ ] List
- [ ] Get
- [ ] Post-related operations where documented
- [ ] Add/update/delete where documented
- [ ] Pagination/options

## TASK-011 — Todos operations
Status: `[x]`

Implement all applicable documented Todos operations.

Acceptance:
- [ ] List
- [ ] Get
- [ ] Search/filter where documented
- [ ] User-related operations where documented
- [ ] Add
- [ ] Update
- [ ] Delete
- [ ] Pagination/options

## TASK-012 — Quotes operations
Status: `[x]`

Implement all applicable documented Quotes operations.

Acceptance:
- [ ] List
- [ ] Get
- [ ] Search
- [ ] Applicable pagination/options
- [ ] Validation

## TASK-013 — Authentication operations
Status: `[x]`

Implement documented DummyJSON authentication functionality.

Acceptance:
- [ ] Login
- [ ] Authenticated request behavior
- [ ] Token handling appropriate to the Workbench
- [ ] Refresh if documented
- [ ] Current-user functionality if documented
- [ ] Auth errors represented correctly
- [ ] Secrets/tokens not persisted unsafely

## TASK-014 — Images
Status: `[x]`

Implement documented DummyJSON image functionality.

Acceptance:
- [ ] Image endpoints represented.
- [ ] Parameters represented.
- [ ] Image responses handled correctly.
- [ ] Image operations testable.

## TASK-015 — HTTP / mock functionality
Status: `[x]`

Implement documented HTTP/mock functionality.

Acceptance:
- [ ] Applicable documented operations represented.
- [ ] Methods handled correctly.
- [ ] Status behavior represented.
- [ ] Request bodies supported where documented.
- [ ] Responses handled correctly.
- [ ] Invalid requests produce useful errors.

## TASK-016 — Tools and utility endpoints
Status: `[x]`

Implement remaining documented tool/utility functionality.

Acceptance:
- [ ] Every applicable documented endpoint represented.
- [ ] Registry coverage passes.
- [ ] No invented routes.

# Phase 2 — Central Request Layer

## TASK-017 — Implement DummyJSON client
Status: `[x]`

Centralize request execution.

Acceptance:
- [ ] Base URL
- [ ] Methods
- [ ] Query parameters
- [ ] Path parameters
- [ ] JSON bodies
- [ ] Headers
- [ ] Authentication
- [ ] Delay
- [ ] Abort/cancellation
- [ ] Errors
- [ ] Response parsing
- [ ] All operations use the centralized client

## TASK-018 — Request builder
Status: `[x]`

Build executable requests from registry metadata.

Acceptance:
- [ ] Operation → request
- [ ] Path substitution
- [ ] Query encoding
- [ ] Body generation
- [ ] Unsupported fields rejected
- [ ] Representative GET/POST/PUT/PATCH/DELETE tests

## TASK-019 — Response processing
Status: `[x]`

Implement reusable response processing.

Acceptance:
- [ ] Status
- [ ] Timing
- [ ] Headers
- [ ] Parsed JSON
- [ ] Raw response
- [ ] Normalized errors
- [ ] Unexpected responses handled safely

# Phase 3 — Workbench UI

## TASK-020 — Application shell
Status: `[x]`

Create the main Workbench shell with navigation, operation browser, work area,
request/response panels, responsive layout, loading, and errors.

Acceptance:
- [x] Polished desktop experience.
- [x] Intentional responsive behavior.
- [x] Reasonable keyboard interaction.
- [x] No placeholder/demo-only UI.

## TASK-021 — Operation explorer
Status: `[x]`

Create searchable/grouped operation navigation.

Acceptance:
- [x] Groups derived from registry.
- [x] Search.
- [x] Selection reflected in URL/state where appropriate.
- [x] Empty state.
- [x] No silent registry/UI divergence.

## TASK-022 — Request builder UI
Status: `[x]`

Create reusable request configuration UI.

Acceptance:
- [x] Path parameters
- [x] Query parameters
- [x] Request body
- [x] Headers
- [x] Authentication
- [x] Send
- [x] Reset
- [x] Validation
- [x] Loading
- [x] Error states

## TASK-023 — Response viewer
Status: `[x]`

Create a polished response inspection experience.

Acceptance:
- [x] Status
- [x] Timing
- [x] Headers
- [x] JSON tree/raw view
- [x] Copy
- [x] Search where useful (native Ctrl/Cmd+F covers the raw view; tree is a JSON
  structure browser — see TASK-035 note)
- [x] Errors
- [x] Empty responses
- [x] Large response handling

## TASK-024 — Request history
Status: `[x]`

Implement bounded local request history.

Acceptance:
- [x] Successful requests revisitable.
- [x] Request configuration restorable.
- [x] Secrets not exposed.
- [x] Reasonable limits.
- [x] Clear history.

## TASK-025 — Examples and presets
Status: `[x]`

Provide examples/presets based on actual documented API behavior.

Acceptance:
- [x] Examples generated from registry definitions.
- [x] No fabricated endpoints.
- [x] Examples load into request builder.
- [x] Examples tested where practical.

# Phase 4 — Cross-Cutting API Features

## TASK-026 — Pagination
Status: `[x]`
Implement documented pagination behavior and controls where applicable.

## TASK-027 — Select / field selection
Status: `[x]`
Implement documented field selection behavior and controls where applicable.

## TASK-028 — Sorting
Status: `[x]`
Implement documented sorting behavior and controls where applicable.

## TASK-029 — Delay
Status: `[x]`
Implement documented delay functionality and controls where applicable.

## TASK-030 — Authentication UX
Status: `[x]`

Acceptance:
- [x] Login
- [x] Token state
- [x] Authenticated requests
- [x] Logout/reset
- [x] Sensitive values protected

# Phase 5 — Testing and Coverage

## TASK-031 — Registry coverage test
Status: `[x]`

Compare the documented API catalog against the operation registry.

Acceptance:
- [ ] Missing catalog operations fail.
- [ ] Invalid registry metadata fails.
- [ ] Deterministic.
- [ ] CI-ready.

## TASK-032 — Unit test suite
Status: `[x]`

Cover request construction, parameter encoding, schemas, registry, response processing,
errors, auth, pagination, selection, sorting, and delay.

## TASK-033 — Integration tests
Status: `[x]`

Test registry → request builder → client → response processing, including representative
CRUD, auth, and error cases.

## TASK-034 — Playwright end-to-end tests
Status: `[x]`

Cover:
- [x] Open Workbench
- [x] Find operation
- [x] Configure request
- [x] Send
- [x] Inspect response
- [x] Change operation
- [x] Pagination/options
- [x] Authentication
- [x] Error response
- [x] Request history

# Phase 6 — UI/UX Hardening

## TASK-035 — UI quality review
Status: `[x]`

Review visual hierarchy, spacing, typography, responsiveness, empty/loading/error states,
accessibility, keyboard interaction, consistency, and developer-tool density.

Independent reviewer findings addressed: mobile operations drawer added (sidebar was
unreachable below lg), icon-button target sizes enlarged (WCAG 2.5.8), secondary text
contrast bumped (zinc-400 → zinc-500 where text), empty/loading/error states confirmed
distinct, skip link added. Response-viewer body search intentionally satisfied by native
browser find (raw view) — see STATE.md.

## TASK-036 — Accessibility hardening
Status: `[x]`

Acceptance:
- [x] Keyboard navigation.
- [x] Accessible form labels.
- [x] Visible focus.
- [x] Accessible dialogs/popovers.
- [x] Useful error communication.
- [x] Acceptable contrast.
- [x] Reasonable screen-reader semantics.

Details: skip link (2.4.1), prefers-reduced-motion (2.3.3), dialog pattern for mobile
drawer + focus trap/Escape/restore for header menus, aria-describedby on body editor,
search aria-controls/status linkage, tablist/tabpanel wiring, dropped misleading
`role="tree"` on the JSON tree (native details/summary disclosures), copy feedback
live regions, placeholder contrast (light zinc-500 / dark zinc-400).

# Phase 7 — Production Hardening

## TASK-037 — Error handling
Status: `[x]`
Handle network, HTTP, validation, malformed-response, timeout/cancellation, and unexpected errors.

Implemented and verified:
- Structured ApiErrors (network/timeout/aborted/http/invalid-json/validation) flow through
  `executeOperation` unchanged (`isApiError` guard in `response.ts`; client catch no longer
  collapses them into generic network errors via `toError`).
- HTTP error responses whose JSON body is malformed now fall back to `kind: "text"` so the
  status/statusText remain the primary signal (`httpError` still carries the status).
- ResponseViewer error panel: network errors show the underlying cause detail (Error message,
  string, or JSON-stringified value), invalid-json errors show the raw body truncated to 500
  chars; timeout/aborted/validation each render their type + message.
- User-initiated cancel deliberately returns to the idle state (no "aborted" error flashed);
  timeouts surface because the client's internal timer aborts only the internal signal.
- Tests: +1 response.test, +1 client regression (invalid-json not relabeled as network),
  +4 ResponseViewer unit tests, +2 E2E (network abort; malformed JSON fulfill). All 113 unit
  tests, lint, typecheck, build, and 23 Playwright tests pass.
- Independent reviewer verdict: APPROVED (0 CRITICAL/HIGH; MEDIUM on non-Error causes fixed).

## TASK-038 — Loading/performance hardening
Status: `[x]`
Avoid unnecessary requests/renders, keep large responses usable, keep explorer responsive,
bound history, and address obvious leaks.

Implemented and verified:
- WorkbenchShell unmount cleanup now aborts the in-flight request (previously captured
  the mount-time controller, i.e. null, leaking fetches). + regression test.
- RequestBuilder code-snippet generation memoized per `op+values` (was rebuilt every render);
  CodeBlock copy-feedback timer cleared on unmount.
- ResponseViewer `rawText`/`formatJson` memoized per response (avoids re-running
  `JSON.stringify` on every tab/view/copy state change); copy timer cleared on unmount;
  download blob URL revocation deferred via `setTimeout(..., 0)` after `anchor.click()`.
- JsonTree: `MAX_TREE_DEPTH = 32` cap so pathologically deep echoed bodies render a
  truncation marker instead of overflowing the call stack. + unit tests.
- Other criteria already satisfied: OperationExplorer search memoized (useMemo on query),
  history bounded at 100 entries with eviction test, `LARGE_RESPONSE_THRESHOLD` disables
  tree view for >1 MB raw responses.
- Independent reviewer verdict: APPROVED (0 CRITICAL/HIGH; one MEDIUM on test timing
  acceptable for a regression test).

## TASK-039 — Security review
Status: `[ ]`

Review token handling, request injection, unsafe URLs, XSS, arbitrary requests, storage,
sensitive data exposure, and dependency risks.

Acceptance:
- [ ] No obvious HIGH/CRITICAL security issues.
- [ ] No secrets committed.
- [ ] User-controlled values handled safely.

# Phase 8 — Final Verification

## TASK-040 — Full automated verification
Status: `[ ]`

Run the project's actual:
- [ ] typecheck
- [ ] lint
- [ ] unit tests
- [ ] integration tests
- [ ] Playwright
- [ ] production build
- [ ] API coverage

Everything must pass.

## TASK-041 — Independent final review
Status: `[ ]`

Review architecture, API coverage, implementation quality, security, testing, UI,
errors, and production readiness.

Acceptance:
- [ ] No HIGH findings.
- [ ] No CRITICAL findings.
- [ ] Remaining MEDIUM findings fixed or documented.

## TASK-042 — Final diff inspection
Status: `[ ]`

Acceptance:
- [ ] No accidental files.
- [ ] No secrets.
- [ ] No debugging artifacts.
- [ ] No generated junk.
- [ ] No unfinished required TODOs.
- [ ] No fake/stubbed functionality.
- [ ] No undocumented scope changes.

## TASK-043 — Final certification
Status: `[ ]`

Create `.agent/FINAL_REPORT.md` containing implementation summary, API coverage,
tests, lint, typecheck, build, Playwright, review, known limitations, remaining
non-blocking issues, and final repository status.

Only after this task is verified should the project be considered complete.

# Autonomous Execution Rules

## Rule 1 — Reconcile before acting

At every continuation turn, read:
1. `TASKS.md`
2. `.agent/STATE.md`
3. actual repository
4. tests/build state
5. git diff

Do not blindly trust task statuses.

## Rule 2 — Do real work

Never respond with only a plan or status report. Use tools and modify the repository.

## Rule 3 — Verify

After meaningful implementation:
1. run focused tests;
2. run typecheck;
3. run lint;
4. run build when appropriate;
5. use independent review for substantial work.

## Rule 4 — Keep state current

After meaningful progress:
- update `TASKS.md`;
- update `.agent/STATE.md`.

Never mark a task complete before verification.

## Rule 5 — Never fabricate API behavior

The official DummyJSON documentation and `API_CATALOG.md` are authoritative.

If they differ:
1. verify the difference;
2. update `API_CATALOG.md`;
3. update implementation;
4. update tests.

## Rule 6 — Continue

When a task is complete, proceed to the next applicable task. The external harness
will also issue continuation turns.

## Rule 7 — Block correctly

If genuinely blocked:
- mark `[!]`;
- create `.agent/BLOCKED.md`;
- document the blocker;
- continue independent tasks if possible.

## Rule 8 — Evidence-based completion

Do not create `.agent/FINAL_REPORT.md` until final verification actually passes.

# Final Definition of Done

- [ ] All applicable tasks are `[x]`.
- [ ] API coverage passes.
- [ ] Registry coverage passes.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Playwright passes.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Security review passes.
- [ ] UI/UX review is complete.
- [ ] Independent final review has no HIGH/CRITICAL findings.
- [ ] Final diff inspected.
- [ ] `.agent/FINAL_REPORT.md` exists.

# Current Queue Position

The autonomous harness must determine the actual current position from the repository,
tests, git diff, `TASKS.md`, and `.agent/STATE.md`.

Do not assume task numbering represents actual implementation progress.
