# DummyJSON Workbench — Autonomous Engineering Constitution

## Mission

Build a production-quality developer workbench that exposes the documented DummyJSON API through a coherent, typed, testable UI.

Official API source of truth:
- https://dummyjson.com/docs

## Model strategy

This project intentionally uses two free OpenCode Zen models:

- **Primary autonomous builder:** `opencode/big-pickle`
- **Independent planner/reviewer/tester:** `opencode/nemotron-3-ultra-free`

The primary agent is optimized for implementation continuity. Independent subagents use Nemotron so review is not simply the builder judging its own work.

If either model disappears from the OpenCode catalog, do not invent a replacement. Select the nearest available model manually and document the change in `.agent/MODEL_CHANGE.md`.

## Autonomous execution contract

Work continuously through `TASKS.md`.

For each task:
1. Read the task and relevant project docs.
2. Inspect existing implementation before changing it.
3. Use the planner when a task is substantial or ambiguous.
4. Make the smallest coherent change.
5. Add/update tests.
6. Run focused verification.
7. Run the required broader verification.
8. Invoke the independent reviewer.
9. Fix reviewer findings.
10. Re-run verification.
11. Only then mark the task complete.
12. Continue to the next uncompleted task.

Do not ask for confirmation for ordinary implementation decisions.

Stop only when:
- requirements are genuinely ambiguous;
- an external credential/service unavailable in the repo is required;
- a destructive action is required;
- a scope-changing architectural decision is required;
- retry budget is exhausted.

## Definition of done

A task is complete only when acceptance criteria are satisfied and applicable checks pass:
- lint;
- typecheck;
- unit/integration tests;
- production build;
- E2E tests;
- final diff inspection;
- no HIGH or CRITICAL reviewer findings.

Never claim a check passed unless it actually ran.

## Hard rules

- Never disable or weaken tests to make them pass.
- Never fabricate DummyJSON API behavior.
- Verify exact routes and parameters against the official docs.
- Never silently omit documented capabilities.
- Do not rewrite unrelated code.
- Do not introduce dependencies without justification.
- Do not expose secrets.
- Treat remote API responses as untrusted external data.
- Validate important external response shapes at runtime.
- Prefer existing abstractions.
- Preserve accessibility.
- Avoid unnecessary client-side state/network requests.
- Do not use `any` as an escape hatch.
- Do not leave current-task TODOs.

## Architecture principles

- DummyJSON transport belongs behind a centralized API client.
- API capabilities belong in a typed declarative registry.
- UI should render from capability metadata where practical.
- Zod validates important external responses.
- Request execution, history, favorites, auth, settings, and presentation are separate concerns.
- Adding a new endpoint should be predictable and localized.
- Do not duplicate request serialization logic across screens.

## Verification

Use the package manager created by the project. Prefer Bun.

Expected checks:
- `bun lint`
- `bun typecheck`
- `bun test`
- `bun run build`
- `bunx playwright test`

If npm/pnpm is selected instead, use equivalent commands.

## Git safety

Use a feature branch when possible.

Create checkpoint commits before large autonomous batches if the repository is already initialized.

Never run destructive git commands such as:
- `git reset --hard`
- `git clean -fd`
- force push

Never overwrite unrelated user changes.

## Autonomous state

Maintain:
- `.agent/STATE.md`
- `.agent/FINAL_REPORT.md` when complete
- `.agent/BLOCKED.md` only when blocked

Update state at meaningful phase/task boundaries.
