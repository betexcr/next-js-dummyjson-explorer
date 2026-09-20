# DummyJSON Workbench Autonomous Harness

## Model decision

Primary:
`opencode/big-pickle` — Big Pickle

Independent subagents:
`opencode/nemotron-3-ultra-free` — Nemotron 3 Ultra Free

OpenCode supports assigning a model per agent in Markdown frontmatter, so the model separation is encoded directly in `.opencode/agents/*.md`.

## Start

From the project root:

```bash
opencode
```

Then run:

```text
/autonomous
```

Or send:

```text
Read AGENTS.md and start the autonomous implementation loop.
```

The primary agent will:
1. plan when needed;
2. implement;
3. test;
4. invoke independent Nemotron review;
5. fix findings;
6. verify;
7. advance TASKS.md;
8. continue until completion or a genuine blocker.

## Safety

The harness allows normal editing and shell work but explicitly blocks:
- hard git resets;
- git clean;
- force pushes;
- editing `.env*`.

Reviewers cannot edit.
Planners cannot edit or execute shell commands.
The tester can execute verification commands but cannot edit.

## If a free model becomes unavailable

Do not invent a model ID.

Select an available replacement through OpenCode's `/models` picker and document it in:

```text
.agent/MODEL_CHANGE.md
```

## Completion

The autonomous run creates:

```text
.agent/STATE.md
.agent/FINAL_REPORT.md
```

or, if blocked:

```text
.agent/BLOCKED.md
```
