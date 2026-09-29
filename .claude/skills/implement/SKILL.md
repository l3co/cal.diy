---
name: implement
description: Use this skill exclusively in the cal.diy project to execute an approved implementation plan (from the `plan` skill), part by part, following this repo's stack and conventions. Verifies each part with lint/type-check/tests, then triggers `pr-generator` to open the PR.
---

# Implement (cal.diy only)

This skill is scoped exclusively to the **cal.diy** repository. Do not reuse it for other projects.

## When to use

Right after the `plan` skill hands off an approved `plan.md`, or whenever the user explicitly asks to implement a plan that already exists under `docs/plans/`.

## Tech stack & conventions (cal.diy)

This is a Turborepo/Yarn monorepo (`apps/*`, `packages/*`) built on TypeScript, Next.js, tRPC, and Prisma. Always use the technologies and patterns already established in this codebase — do not introduce new libraries, frameworks, or patterns when an existing equivalent is already in use nearby:

- **TypeScript** everywhere; no `any` unless the surrounding code already does it for a documented reason.
- **tRPC** for API procedures, **Prisma** for schema/data access — follow existing router/procedure patterns in `packages/trpc` and `packages/prisma`.
- **UI**: reuse components from `packages/ui` and existing app components before creating new ones.
- **i18n**: user-facing strings go through the existing `next-i18next` translation keys, never hardcoded strings.
- **Formatting/linting**: Biome (`yarn format`) and `yarn lint` / `yarn lint:fix`; **type-check** via `yarn type-check`.
- **Tests**: unit tests with Vitest (`yarn test`); Playwright e2e (`yarn test-e2e`) only when the plan explicitly calls for e2e coverage (it's expensive — don't run it speculatively).
- Respect existing project decisions already documented in the root `CLAUDE.md` (e.g. timezone/business-hours handling) when the feature touches that area.

## Code style rules (mandatory)

- **Short, cohesive methods**: each function does one thing; if a function needs "and" to describe it, split it.
- **Clear, intention-revealing names** for functions, variables, and files — consistent with existing naming in the touched package.
- **SOLID principles**: single responsibility per module/class/function, depend on existing abstractions/interfaces in the codebase rather than concrete details, avoid god-objects and god-functions.
- **Pure functions for lightweight JS/TS logic** (utilities, helpers, formatters, calculations): no side effects, no hidden mutation of inputs, same input → same output. Push side effects (I/O, DB, network) to the edges (tRPC procedures, route handlers), keep the logic in between pure and unit-testable.

## Workflow

1. Read `plan.md` (and any split part files) in full before starting.
2. Implement one part at a time, in order. For each part:
   - Search the codebase for existing similar implementations and follow their conventions before writing new code.
   - Write the code following the style rules above.
   - Run `yarn lint`, `yarn type-check`, and relevant `yarn test` for the touched packages; fix failures before moving on.
   - Mark the part as done in `plan.md` (e.g. append `✅ Done` to the part's heading) so the plan doubles as a progress tracker.
   - Commit the part's changes following the PR approval policy (`docs/pr-policy.md`): `<type>(<scope>): <subject>` with the **same scope for every commit of the feature**, and at most 8 files / 300 changed lines per commit — split a part into several commits (e.g. schema → logic → UI → tests) when it is bigger than that.
   - Before moving on, run `node scripts/pr-policy/check.mjs --base origin/main` and fix commit-format, granularity or mixed-context violations while they are still cheap to fix.
3. If a part turns out ambiguous or contradicts what was approved in the plan, stop and ask the user rather than guessing — do not silently deviate from the approved plan.
4. Once all parts are implemented and verified, give the user a short summary of what was built and confirm anything worth flagging (deviations, follow-ups, known limitations).
5. Invoke the `Skill` tool with `skill: "pr-generator"` to open the PR for the completed feature, passing a short description of the implemented feature as `args`.

## Constraints

- Never implement business logic that isn't covered by the approved plan — flag gaps to the user instead of inventing behavior.
- Never skip lint/type-check/test verification for a part before moving to the next one.
- Never force-push or rewrite history.
- Never skip triggering `pr-generator` at the end unless the user explicitly says not to open a PR yet.
