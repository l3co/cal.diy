---
name: pr-evidence
description: Use this skill exclusively in the cal.diy project to execute and collect the implementation evidence required by the PR approval policy (docs/pr-policy.md) — lint, type-check and test output for the changed code, plus screenshots/GIFs when the change touches UI. Produces the content of the PR's "## Evidências" section. Triggered by pr-generator before opening a PR, or when the user asks for evidence of a change.
---

# PR Evidence (cal.diy only)

This skill is scoped exclusively to the **cal.diy** repository. Do not reuse it for other projects.

## When to use

- Automatically, from `pr-generator`, before drafting a PR description.
- Whenever the user asks to "gerar evidências", "rodar as evidências", prove a change works, or refresh evidence after new commits.

## Output

`.evidence/<branch-slug>/evidence.md` (git-ignored) — the full body of the `## Evidências` section, which `pr-generator` pastes into the PR. The policy check requires this section to contain at least one code block or image.

## Workflow

1. **Preconditions.** Confirm the branch is not `main`, has commits ahead of the base (default `origin/main`; use the PR's base when it is different) and the working tree is clean — evidence must describe committed code. Make sure dependencies are installed (`node_modules` exists); if not, ask the user before running `yarn install`, since it is slow.

2. **Run the automated evidence.**

   ```bash
   node scripts/pr-policy/collect-evidence.mjs --base origin/main
   ```

   It runs, for the changes between the base and `HEAD`:
   - **Lint** — `yarn biome check` on the changed files;
   - **Type-check** — `yarn turbo run type-check --filter=...[<base>]` (changed workspaces and their dependents);
   - **Tests** — `TZ=UTC yarn vitest run --changed <base>`.

   If a step fails, **stop**: show the failure to the user and fix it (or ask how to proceed). Never publish failing evidence as if it passed, and never edit the generated file to hide a failure.

3. **Decide whether UI evidence is needed.** It is required when the diff touches rendered UI — `.tsx`/`.css` files under `apps/web/`, `packages/ui/`, `packages/features/**/components/`, `packages/app-store/**/components/`, or translation strings shown on screen. Skip it for backend-only, tooling or docs changes and say so in the evidence file.

4. **Capture UI evidence** (only when step 3 says so). Ask the user for the URL/flow to demonstrate if it is not obvious from the diff and the plan. With the app running (`yarn dev`, seeded DB — ask the user to start it if it is not up):
   - **Static screens**: `yarn playwright screenshot --full-page <url> .evidence/<branch-slug>/<name>.png`.
   - **Interactions/flows**: load the `claude-in-chrome` skill and record the flow with `gif_creator` (name the file after the flow, e.g. `booking-reschedule.gif`), then move the downloaded GIF into `.evidence/<branch-slug>/`.
   - For visual **bug fixes**, also capture the "antes" state from the base branch (e.g. a `git worktree` of the base) so the reviewer sees before/after.
   - Never capture screens containing real personal data or secrets; use seeded test users.

5. **Publish images.** Show the user the list of images and ask for confirmation (this pushes to the remote), then:

   ```bash
   scripts/pr-policy/publish-evidence.sh .evidence/<branch-slug>/*.png .evidence/<branch-slug>/*.gif
   ```

   It pushes to the orphan `evidence` branch (never to the PR branch) and prints markdown image links. Append them to `evidence.md` under a `### Screenshots` heading, labelling each as "antes"/"depois" when applicable.

6. **Report.** Show the user the final `evidence.md` summary (step status + image links) and hand it back to `pr-generator` when invoked from it.

## Constraints

- Evidence comes from real executions of the committed code — never invent, summarize away or reuse output from an older commit. Re-run after new commits.
- Never commit `.evidence/` or evidence images to the PR branch; images go only to the `evidence` branch.
- Do not run Playwright e2e suites (`yarn test-e2e`) as evidence unless the plan or the user asks for them.
