---
name: pr-generator
description: Use this skill exclusively for the cal.diy project when opening a Pull Request on GitHub. It collects evidence via pr-evidence, drafts a PR that follows the PR approval policy (docs/pr-policy.md) — what was done, why, evidence, how to test and impact — validates it with the policy check, and opens the PR via gh only after user confirmation.
---

# PR Generator (cal.diy only)

This skill is scoped exclusively to the **cal.diy** repository. Do not reuse it for other projects.

## When to use

Whenever the user asks to open, create, or draft a Pull Request for changes in this repository (e.g. "abre um PR", "cria o PR dessa branch", "open a PR"), and at the end of the `implement` skill.

## Policy

Every PR must pass the PR approval policy in `docs/pr-policy.md`, enforced in CI by the `PR policy` check. In short:

1. The description explains what was done (required sections below).
2. It carries evidence of the implementation.
3. Commits are granular — at most 8 files / 300 changed lines each (`.github/pr-policy.json`).
4. Title and commits follow `<type>(<scope>): <subject>`, scope mandatory.
5. A single context: one scope for all commits and the title, and changed files in a single business area.

## Required PR structure

The body follows `.github/PULL_REQUEST_TEMPLATE.md`. These bilingual headings (keep them exactly as in the template), in this order, all filled in. Write the content in the language the user is using, or in English when the PR targets an English-speaking audience:

1. **`## O que foi feito / What was done`** — Clear and objective explanation of what the PR changes. State exactly what was added, fixed, or removed; include `Fixes #XXXX` when there is an issue.
2. **`## Por quê / Why`** — The motivation (bug fix, feature request, tech debt, incident follow-up...). Explain the "why", not just the "what".
3. **`## Evidências / Evidence`** — The content produced by the `pr-evidence` skill (`.evidence/<branch-slug>/evidence.md`), unedited.
4. **`## Como testar / How to test`** — Concrete, reproducible steps a reviewer can follow (copy-pasteable commands, pages/flows, edge cases).
5. **`## Impacto / Impact`** — Affected areas, risks, side effects, and what to watch after merge.

Keep the `## Checklist` from the template and tick only what is true.

## Workflow

1. Confirm the current branch is not `main` and has commits ahead of the base (`origin/main` unless the user says otherwise). Commit or ask about uncommitted changes first.
2. Inspect the changes: `git log` and `git diff` against the base, to understand everything included — not just the latest commit.
3. **Pre-check commits and context** before spending time on evidence:

   ```bash
   node scripts/pr-policy/check.mjs --base origin/main --title "<draft title>"
   ```

   If commit format, granularity or single-context rules fail, stop and explain the violations to the user. Mixed contexts must be split into separate branches/PRs; oversized or badly named commits must be split/reworded. Both need history rewriting (e.g. `git reset --soft` + recommit), which you only do with the user's explicit approval, and only on branches that are not shared yet.
4. Invoke the `Skill` tool with `skill: "pr-evidence"` to generate `.evidence/<branch-slug>/evidence.md`. Do not continue if evidence steps fail.
5. Draft the title — `<type>(<scope>): <subject>` using the same scope as the commits, imperative mood, at most 72 characters — and the body with the five required sections, written to `.evidence/<branch-slug>/pr-body.md`.
6. Validate the full draft:

   ```bash
   node scripts/pr-policy/check.mjs --base origin/main --title "<title>" --body-file .evidence/<branch-slug>/pr-body.md
   ```

   Fix any violation before continuing.
7. Show the title, body and the passing policy report to the user and ask for confirmation or edits. Never open the PR without explicit approval.
8. Once approved, push the branch if needed and run `gh pr create --base main --title "<title>" --body-file .evidence/<branch-slug>/pr-body.md`.
9. Return the PR URL and remind the user that the `PR policy` check will re-validate it in CI.

## Constraints

- Never skip any of the five required sections, and never open a PR whose local policy check fails.
- Never push branches or open PRs without explicit user confirmation.
- Never force-push or rewrite history without the user's explicit approval.
- Keep the tone factual and concise — no marketing language, no emojis unless the user asks.
