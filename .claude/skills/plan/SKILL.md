---
name: plan
description: Use this skill exclusively in the cal.diy project to turn a research brief (from the `research` skill) into a concrete, phased implementation plan written in Markdown. After user approval, it triggers the `implement` skill.
---

# Plan (cal.diy only)

This skill is scoped exclusively to the **cal.diy** repository. Do not reuse it for other projects.

## When to use

Right after the `research` skill hands off a research brief, or whenever the user explicitly asks to plan a feature that already has clear requirements. If invoked directly without a research brief in context, recommend running `research` first; proceed only if the user insists and requirements are already unambiguous.

## Output format

The plan is written as Markdown under `docs/plans/<feature-slug>/plan.md` (kebab-case slug derived from the feature name). The plan MUST be divided into clearly numbered **parts** — small, sequential, independently testable increments — never one monolithic block of work.

Structure of `plan.md`:

```markdown
# <Feature name>

## Overview
<what/why, summarized from the research brief>

## Goals / Non-goals
- Goals: ...
- Non-goals (explicitly out of scope): ...

## Part 1 — <short name>
- Objective:
- Technical approach:
- Affected files/packages:
- Acceptance criteria:
- Testing strategy:
- Risks / open questions:

## Part 2 — <short name>
...

## Impact
<what areas of the product/codebase this touches, risks, rollout considerations>
```

Only split into multiple files (`part-1-<name>.md`, `part-2-<name>.md`, ...) inside the same `docs/plans/<feature-slug>/` folder when the plan is unusually large (roughly more than 5 parts); otherwise keep a single `plan.md` with parts as sections.

## Workflow

1. Take the research brief (from `research`, or from the current conversation) as the source of truth for requirements — do not re-litigate scope decisions already made there.
2. Break the feature into parts following the structure above. Ground the technical approach and affected files/packages by inspecting the actual codebase (existing patterns, relevant `apps/`/`packages/` boundaries, Prisma schema, tRPC routers, etc.) — do not guess file locations.
3. Write the plan to `docs/plans/<feature-slug>/plan.md`.
4. Show the drafted plan to the user and explicitly ask for approval or changes. Never proceed to implementation without explicit approval.
5. Once approved, invoke the `Skill` tool with `skill: "implement"`, passing the path to `plan.md` (and any approved edits) as `args`.

## Constraints

- Plans are Markdown only — pseudocode is fine, real code is not.
- Never skip the approval step before triggering `implement`.
- Never invent requirements not present in the research brief; if something is missing, ask the user rather than assuming.
- Keep each plan within a single business context (one PR scope, one area in `.github/pr-policy.json`) — the PR approval policy (`docs/pr-policy.md`) rejects PRs that mix contexts. If the feature spans unrelated areas, split it into separate plans/PRs and tell the user.
- Respect this project's existing conventions and prior decisions (e.g. timezone/business-hours rules documented in the root `CLAUDE.md`) when shaping the technical approach.
