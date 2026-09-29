#!/usr/bin/env node
// Validates a branch against the PR approval policy (docs/pr-policy.md).
//
// Usage:
//   node scripts/pr-policy/check.mjs --base origin/main [--head HEAD]
//     [--title "fix(auth): ..."] [--body-file pr-body.md] [--report report.md]
//
// Without --body-file the description rules are skipped (useful before the PR body exists).
// Exits with 1 when any rule is violated.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  checkCommitMessages,
  checkDescription,
  checkGranularity,
  checkSingleContext,
  checkSingleScope,
} from "./rules.mjs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();

function parseNumstat(output) {
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [added, removed, path] = line.split("\t");
      return { path, added: Number(added) || 0, removed: Number(removed) || 0 };
    });
}

function readCommits(base, head) {
  const revisions = git("rev-list", "--reverse", "--parents", `${base}..${head}`);
  return revisions
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, ...parents] = line.split(" ");
      return {
        sha,
        parents: parents.length,
        subject: git("log", "-1", "--format=%s", sha),
        files: parseNumstat(git("show", "--numstat", "--no-renames", "--format=", sha)),
      };
    });
}

function evaluate({ commits, paths, title, body, config }) {
  return [
    { rule: "O que foi feito + evidências", violations: body === undefined ? null : checkDescription(body, config.description) },
    { rule: "Padrão de commits", violations: checkCommitMessages(commits, title, config.commits) },
    { rule: "Commits granulares", violations: checkGranularity(commits, config.granularity) },
    {
      rule: "Contexto único",
      violations: [...checkSingleScope(commits, title), ...checkSingleContext(paths, config.context)],
    },
  ];
}

function renderReport(results) {
  const lines = ["## PR policy", ""];
  for (const { rule, violations } of results) {
    if (violations === null) lines.push(`- ⏭️ **${rule}** — não verificado (sem descrição)`);
    else if (violations.length === 0) lines.push(`- ✅ **${rule}**`);
    else lines.push(`- ❌ **${rule}**`, ...violations.map((violation) => `  - ${violation}`));
  }
  lines.push("", "Regras completas em `docs/pr-policy.md`.");
  return lines.join("\n");
}

function main() {
  const { values } = parseArgs({
    options: {
      base: { type: "string", default: "origin/main" },
      head: { type: "string", default: "HEAD" },
      title: { type: "string" },
      "body-file": { type: "string" },
      report: { type: "string" },
      config: { type: "string", default: ".github/pr-policy.json" },
    },
  });
  const config = JSON.parse(readFileSync(values.config, "utf8"));
  const commits = readCommits(values.base, values.head);
  const paths = git("diff", "--name-only", "--no-renames", `${values.base}...${values.head}`).split("\n").filter(Boolean);
  const body = values["body-file"] ? readFileSync(values["body-file"], "utf8") : undefined;

  const results = evaluate({ commits, paths, title: values.title, body, config });
  const report = renderReport(results);
  if (values.report) writeFileSync(values.report, `${report}\n`);
  console.log(report);

  const failed = results.some(({ violations }) => violations?.length);
  process.exit(failed ? 1 : 0);
}

main();
