import { describe, expect, it } from "vitest";
import config from "../../.github/pr-policy.json" with { type: "json" };
import {
  checkCommitMessages,
  checkDescription,
  checkGranularity,
  checkSingleContext,
  checkSingleScope,
  classifyArea,
  globToRegExp,
  parseSections,
} from "./rules.mjs";

const commit = (subject, overrides = {}) => ({ sha: "abcdef1234567", subject, parents: 1, files: [], ...overrides });
const file = (path, added = 10, removed = 0) => ({ path, added, removed });

const validBody = `
## O que foi feito
Corrige o login.
## Por quê
Usuários não conseguiam entrar.
## Evidências
\`\`\`
✓ 12 tests passed
\`\`\`
## Como testar
yarn test packages/features/auth
## Impacto
Somente auth.
`;

describe("parseSections", () => {
  it("ignores HTML comments and trims content", () => {
    const sections = parseSections("## A\n<!-- hint -->\n\n## B\n text \n");
    expect(sections.get("A")).toBe("");
    expect(sections.get("B")).toBe("text");
  });

  it("does not treat headings inside code blocks as sections", () => {
    const sections = parseSections("## A\n```\n## not a section\n```\n");
    expect([...sections.keys()]).toEqual(["A"]);
    expect(sections.get("A")).toContain("## not a section");
  });
});

describe("checkDescription", () => {
  it("accepts a body with every section and evidence", () => {
    expect(checkDescription(validBody, config.description)).toEqual([]);
  });

  it("reports missing and empty sections", () => {
    const violations = checkDescription("## O que foi feito\n<!-- todo -->", config.description);
    expect(violations).toContain('A seção "## O que foi feito / What was done" está vazia.');
    expect(violations).toContain('Descrição sem a seção obrigatória "## Impacto / Impact".');
  });

  it("accepts English-only and bilingual headings", () => {
    const english = validBody
      .replace("## O que foi feito", "## What was done")
      .replace("## Por quê", "## Why")
      .replace("## Evidências", "## Evidence")
      .replace("## Como testar", "## How to test")
      .replace("## Impacto", "## Impact");
    expect(checkDescription(english, config.description)).toEqual([]);
    const bilingual = validBody.replace("## Evidências", "## Evidências / Evidence");
    expect(checkDescription(bilingual, config.description)).toEqual([]);
  });

  it("requires a code block or image as evidence", () => {
    const body = validBody.replace(/```[\s\S]+?```/, "testes passaram");
    expect(checkDescription(body, config.description)).toHaveLength(1);
    expect(checkDescription(body.replace("testes passaram", "![login](https://x/y.png)"), config.description)).toEqual([]);
  });
});

describe("checkCommitMessages", () => {
  it("accepts conventional commits with scope", () => {
    expect(checkCommitMessages([commit("fix(auth): handle expired session")], "fix(auth): x", config.commits)).toEqual([]);
  });

  it("rejects missing scope, unknown type, fixups and merges", () => {
    const violations = checkCommitMessages(
      [
        commit("fix: no scope"),
        commit("wip(auth): stuff"),
        commit("fixup! fix(auth): x"),
        commit("Merge branch main", { parents: 2 }),
      ],
      undefined,
      config.commits
    );
    expect(violations).toHaveLength(4);
  });
});

describe("checkSingleScope", () => {
  it("fails when commits and title use different scopes", () => {
    expect(checkSingleScope([commit("fix(auth): a")], "fix(auth): b")).toEqual([]);
    expect(checkSingleScope([commit("fix(auth): a"), commit("feat(checkout): b")], "fix(auth): c")).toHaveLength(1);
  });
});

describe("globToRegExp", () => {
  it("matches nested and root paths", () => {
    expect(globToRegExp("**/*.snap").test("a/b/c.snap")).toBe(true);
    expect(globToRegExp("**/*.snap").test("c.snap")).toBe(true);
    expect(globToRegExp("yarn.lock").test("sub/yarn.lock")).toBe(false);
  });
});

describe("checkGranularity", () => {
  it("fails commits over the file or line limit", () => {
    const tooManyFiles = commit("feat(auth): a", { files: Array.from({ length: 9 }, (_, i) => file(`f${i}.ts`)) });
    const tooManyLines = commit("feat(auth): b", { files: [file("a.ts", 200, 101)] });
    expect(checkGranularity([tooManyFiles, tooManyLines], config.granularity)).toHaveLength(2);
  });

  it("does not count ignored files", () => {
    const withLockfile = commit("chore(auth): deps", { files: [file("yarn.lock", 5000), file("a.ts")] });
    expect(checkGranularity([withLockfile], config.granularity)).toEqual([]);
  });
});

describe("classifyArea / checkSingleContext", () => {
  it("maps the same domain across apps and packages to one area", () => {
    const paths = [
      "packages/features/auth/lib/login.ts",
      "apps/web/modules/auth/login-view.tsx",
      "packages/trpc/server/routers/viewer/auth/_router.ts",
      "packages/lib/dates.ts",
    ];
    expect(checkSingleContext(paths, config.context)).toEqual([]);
  });

  it("normalizes plural and case differences", () => {
    expect(classifyArea("packages/features/eventtypes/x.ts", config.context)).toBe(
      classifyArea("packages/trpc/server/routers/viewer/eventTypes/x.ts", config.context)
    );
  });

  it("groups aliases into one area", () => {
    expect(classifyArea("packages/app-store/stripepayment/x.ts", config.context)).toBe("payment");
  });

  it("fails a login fix that touches checkout code", () => {
    const paths = ["packages/features/auth/lib/login.ts", "packages/app-store/stripepayment/lib/checkout.ts"];
    expect(checkSingleContext(paths, config.context)).toHaveLength(1);
  });
});
