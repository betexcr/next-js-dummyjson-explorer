# Autonomous Coding Harness

## Purpose

This repository uses OpenCode as an autonomous coding agent with an external
continuation loop.

The OpenCode agent performs implementation work.

The PowerShell orchestrator repeatedly continues the OpenCode session until:

- FINAL_REPORT.md exists;
- BLOCKED.md exists;
- the maximum turn budget is reached;
- or the harness detects repeated lack of repository progress.

## Architecture

```text
PowerShell Orchestrator
        |
        v
OpenCode Session
        |
        v
Autonomous / Big Pickle
        |
        +--> Planner / Nemotron
        |
        +--> Reviewer / Nemotron
        |
        +--> Tester / Nemotron
        |
        v
Repository changes
        |
        v
TASKS.md + STATE.md
        |
        v
PowerShell continuation
        |
        +--------------------+
        |                    |
        v                    |
OpenCode --continue --------+
