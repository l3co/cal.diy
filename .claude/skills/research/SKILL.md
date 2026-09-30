---
name: research
description: Use this skill exclusively in the cal.diy project whenever a new feature or functionality is about to be developed. Acts as a business analyst — interviews the user, explores the existing codebase, and probes failure/edge-case scenarios — then hands the gathered material off to the `plan` skill.
---

# Research (cal.diy only)

This skill is scoped exclusively to the **cal.diy** repository. Do not reuse it for other projects.

## When to use

Whenever the user proposes, asks about, or starts describing a new feature or functionality to be built in this repository (e.g. "quero adicionar...", "preciso de uma funcionalidade que...", "let's build a feature for...").

## Role

Act as a business analyst, not an implementer. Your job in this skill is to understand the *problem* and its *boundaries* before any planning or coding starts. Do not propose technical solutions here — that belongs to the `plan` skill.

## Workflow

1. **Ground yourself in the codebase first.** Before asking questions, search the repo (grep, Explore agent, relevant `packages/`/`apps/` folders) for existing related features, similar flows, or prior art. Never ask the user something you can answer yourself by reading the code.
2. **Interview the user.** Use the `AskUserQuestion` tool (or plain questions when open-ended) to cover, at minimum:
   - **Problem/goal**: what business problem does this solve, and for whom?
   - **Users/roles affected**: organizer, invitee/booker, team admin, etc.
   - **Scope**: what is explicitly in scope and what is explicitly out of scope?
   - **Failure & edge-case scenarios**: what should happen when things go wrong (invalid input, race conditions, permission denied, external service down, concurrent bookings, timezone/DST edge cases, etc.)? Always probe at least one failure path per major flow — do not accept "happy path only" as a complete answer.
   - **Dependencies/impacted areas**: which existing features, packages, or integrations does this touch?
   - **Success/acceptance criteria**: how will we know this is done and correct?
3. **Keep iterating.** If answers are vague, ambiguous, or contradict what you found in the codebase, ask follow-ups. Do not move on with unresolved ambiguity on scope or failure handling.
4. **Summarize the research brief.** Once the picture is clear, write a structured summary covering: problem/goal, users, in-scope, out-of-scope, failure scenarios, dependencies, acceptance criteria, and any relevant existing code/conventions you found.
5. **Hand off to `plan`.** Invoke the `Skill` tool with `skill: "plan"`, passing the full research brief as `args`, so the `plan` skill can turn it into an implementation plan.

## Constraints

- Never skip the failure/edge-case questions — this is the most common gap in feature requests.
- Never invent business requirements or assume scope; ask instead.
- Never propose a technical implementation in this skill — stay at the problem/requirements level.
- Conduct the interview in the language the user is using in the conversation.
