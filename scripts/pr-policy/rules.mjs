// Pure rule functions for the PR approval policy (docs/pr-policy.md).
// Every check returns a list of violation strings; an empty list means the rule passed.

const COMMENT = /<!--[\s\S]*?-->/g;
const HEADING = /^##\s+(.+?)\s*$/;

export function parseSections(body) {
  const sections = new Map();
  let current = null;
  let inFence = false;
  for (const line of (body ?? "").replace(COMMENT, "").split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = !inFence && line.match(HEADING);
    if (heading) {
      current = heading[1];
      sections.set(current, []);
    } else if (current) {
      sections.get(current).push(line);
    }
  }
  return new Map([...sections].map(([name, lines]) => [name, lines.join("\n").trim()]));
}

function hasEvidence(content) {
  const hasCodeBlock = /```[\s\S]+?```/.test(content);
  const hasImage = /!\[[^\]]*\]\([^)]+\)|<img\s/i.test(content);
  return hasCodeBlock || hasImage;
}

export function checkDescription(body, { requiredSections, evidenceSection }) {
  const sections = parseSections(body);
  const violations = [];
  for (const name of requiredSections) {
    if (!sections.has(name)) violations.push(`Descrição sem a seção obrigatória "## ${name}".`);
    else if (!sections.get(name)) violations.push(`A seção "## ${name}" está vazia.`);
  }
  const evidence = sections.get(evidenceSection);
  if (evidence && !hasEvidence(evidence)) {
    violations.push(
      `A seção "## ${evidenceSection}" precisa de saída de comando (bloco de código) ou imagem — rode a skill pr-evidence.`
    );
  }
  return violations;
}

export function parseSubject(subject) {
  const match = subject.match(/^(\w+)(?:\(([^()]+)\))?(!)?: (.+)$/);
  if (!match) return null;
  const [, type, scope, , description] = match;
  return { type, scope, description };
}

function checkSubject(subject, label, { types, requireScope, maxSubjectLength }) {
  if (/^(fixup|squash|amend)! /.test(subject)) return [`${label}: commit "${subject}" deve ser absorvido via rebase.`];
  const parsed = parseSubject(subject);
  if (!parsed) return [`${label}: "${subject}" não segue "<type>(<scope>): <assunto>".`];
  const violations = [];
  if (!types.includes(parsed.type)) violations.push(`${label}: type "${parsed.type}" inválido (use ${types.join(", ")}).`);
  if (requireScope && !parsed.scope) violations.push(`${label}: "${subject}" sem scope.`);
  if (subject.length > maxSubjectLength) violations.push(`${label}: assunto com mais de ${maxSubjectLength} caracteres.`);
  return violations;
}

export function checkCommitMessages(commits, title, config) {
  const violations = [];
  if (title !== undefined) violations.push(...checkSubject(title, "Título do PR", config));
  for (const commit of commits) {
    const label = `Commit ${commit.sha.slice(0, 10)}`;
    if (commit.parents > 1) violations.push(`${label}: commits de merge não são aceitos — faça rebase.`);
    else violations.push(...checkSubject(commit.subject, label, config));
  }
  return violations;
}

export function checkSingleScope(commits, title) {
  const subjects = title === undefined ? [] : [title];
  subjects.push(...commits.filter((commit) => commit.parents <= 1).map((commit) => commit.subject));
  const scopes = new Set(subjects.map((subject) => parseSubject(subject)?.scope).filter(Boolean));
  if (scopes.size <= 1) return [];
  return [`Mais de um scope no PR (${[...scopes].join(", ")}) — um PR deve tratar um único contexto.`];
}

export function globToRegExp(glob) {
  const source = glob
    .split(/(\*\*\/|\*\*|\*|\?)/)
    .map((part) => {
      if (part === "**/") return "(?:.*/)?";
      if (part === "**") return ".*";
      if (part === "*") return "[^/]*";
      if (part === "?") return "[^/]";
      return part.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(`^${source}$`);
}

export function checkGranularity(commits, { maxFilesPerCommit, maxLinesPerCommit, ignore }) {
  const ignored = ignore.map(globToRegExp);
  const counted = (file) => !ignored.some((pattern) => pattern.test(file.path));
  const violations = [];
  for (const commit of commits) {
    const files = commit.files.filter(counted);
    const lines = files.reduce((total, file) => total + file.added + file.removed, 0);
    const label = `Commit ${commit.sha.slice(0, 10)} ("${commit.subject}")`;
    if (files.length > maxFilesPerCommit)
      violations.push(`${label}: ${files.length} arquivos (máx. ${maxFilesPerCommit}) — divida em commits menores.`);
    if (lines > maxLinesPerCommit)
      violations.push(`${label}: ${lines} linhas alteradas (máx. ${maxLinesPerCommit}) — divida em commits menores.`);
  }
  return violations;
}

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

function canonicalArea(name, aliases) {
  const normalized = normalize(name);
  for (const [canonical, members] of Object.entries(aliases)) {
    if (normalize(canonical) === normalized || members.some((member) => normalize(member) === normalized))
      return normalize(canonical);
  }
  return normalized;
}

export function classifyArea(path, { areas, aliases }) {
  for (const { pattern, area } of areas) {
    const match = path.match(new RegExp(pattern));
    if (match) return canonicalArea(area.replace(/\$(\d)/g, (_, index) => match[index] ?? ""), aliases);
  }
  return null;
}

export function checkSingleContext(paths, config) {
  const byArea = new Map();
  for (const path of paths) {
    const area = classifyArea(path, config);
    if (!area) continue;
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area).push(path);
  }
  if (byArea.size <= 1) return [];
  const detail = [...byArea].map(([area, files]) => `${area} (ex.: ${files[0]})`).join("; ");
  return [`O PR mistura ${byArea.size} áreas: ${detail}. Separe em PRs distintos.`];
}
