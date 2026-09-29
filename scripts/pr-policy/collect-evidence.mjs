#!/usr/bin/env node
// Runs lint, type-check and tests for the changes between --base and HEAD and writes the
// "## Evidências" section content to .evidence/<branch>/evidence.md (used by pr-generator).
//
// Usage: node scripts/pr-policy/collect-evidence.mjs [--base origin/main] [--tail 40]
// Exits with 1 when any step fails, so failures are never published as passing evidence.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const LINTABLE = /\.(c|m)?(j|t)sx?$|\.json$|\.css$/;

function evidenceDir(branch) {
  return join(".evidence", branch.replace(/[^\w.-]+/g, "-"));
}

function buildSteps(base, changedFiles) {
  const lintable = changedFiles.filter((file) => LINTABLE.test(file) && existsSync(file));
  return [
    {
      name: "Lint (Biome)",
      command: ["yarn", "biome", "check", "--no-errors-on-unmatched", "--files-ignore-unknown=true", ...lintable],
      skip: lintable.length === 0 && "nenhum arquivo lintável alterado",
    },
    {
      name: "Type-check (workspaces afetados)",
      command: ["yarn", "turbo", "run", "type-check", `--filter=...[${base}]`],
    },
    {
      name: "Testes (Vitest, relacionados às mudanças)",
      command: ["yarn", "vitest", "run", "--changed", base, "--passWithNoTests"],
      env: { TZ: "UTC" },
    },
  ];
}

function runStep(step, tail) {
  if (step.skip) return { ...step, status: "skipped", output: step.skip };
  const [bin, ...args] = step.command;
  console.error(`▶ ${step.name}: ${step.command.join(" ")}`);
  const result = spawnSync(bin, args, { encoding: "utf8", env: { ...process.env, ...step.env }, maxBuffer: 256 * 1024 * 1024 });
  const raw = result.error ? result.error.message : `${result.stdout}${result.stderr}`;
  const output = raw.trim().split("\n").slice(-tail).join("\n");
  return { ...step, status: result.status === 0 ? "passed" : "failed", output };
}

const ICON = { passed: "✅", failed: "❌", skipped: "⏭️" };

function renderEvidence(results, { base, head }) {
  const lines = [`Gerado por \`scripts/pr-policy/collect-evidence.mjs\` em \`${head}\` (base \`${base}\`).`, ""];
  for (const { name, command, status, output } of results) {
    lines.push(`### ${ICON[status]} ${name}`, "", "```console", `$ ${command.join(" ")}`, output, "```", "");
  }
  return lines.join("\n");
}

function main() {
  const { values } = parseArgs({
    options: { base: { type: "string", default: "origin/main" }, tail: { type: "string", default: "40" } },
  });
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const head = git("rev-parse", "--short", "HEAD");
  const changedFiles = git("diff", "--name-only", "--diff-filter=d", `${values.base}...HEAD`).split("\n").filter(Boolean);

  const results = buildSteps(values.base, changedFiles).map((step) => runStep(step, Number(values.tail)));
  const dir = evidenceDir(branch);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "evidence.md");
  writeFileSync(file, renderEvidence(results, { base: values.base, head }));

  for (const { name, status } of results) console.error(`${ICON[status]} ${name}`);
  console.error(`Evidências salvas em ${file}`);
  process.exit(results.some(({ status }) => status === "failed") ? 1 : 0);
}

main();
