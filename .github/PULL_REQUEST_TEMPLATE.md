<!--
PT: Este PR é validado pelo check "PR policy" (docs/pr-policy.md):
- título e commits no formato <type>(<scope>): <assunto>, todos com o MESMO scope;
- no máximo 8 arquivos / 300 linhas por commit;
- um único contexto de negócio por PR;
- todas as seções abaixo preenchidas (comentários não contam). Pode escrever em português ou inglês.
Exceções: um mantenedor pode aplicar a label "policy-override"; justifique em "Impacto / Impact".

EN: This PR is validated by the "PR policy" check (docs/pr-policy.md):
- title and commits as <type>(<scope>): <subject>, all with the SAME scope;
- at most 8 files / 300 lines per commit;
- a single business context per PR;
- every section below filled in (comments don't count). Portuguese or English is fine.
Exceptions: a maintainer may apply the "policy-override" label; justify it under "Impacto / Impact".

With Claude Code, the pr-generator skill fills this template and pr-evidence generates the evidence.

Note: Cal.diy is a community-maintained open-source project. Contributions here do NOT flow to Cal.com's production service.
-->

## O que foi feito / What was done

<!-- O que mudou, de forma objetiva. / What changed, objectively. Fixes #XXXX -->

## Por quê / Why

<!-- Motivo da mudança: bug, feature, débito técnico... / Reason: bug, feature, tech debt... -->

## Evidências / Evidence

<!--
Obrigatório / Required: saída de lint, type-check e testes em bloco de código /
lint, type-check and test output in a code block;
screenshots/GIF (antes/depois · before/after) quando houver UI / when UI changes.
-->

## Como testar / How to test

<!-- Passos reproduzíveis, variáveis de ambiente, dados mínimos, saída esperada. /
Reproducible steps, env vars, minimal data, expected output. -->

## Impacto / Impact

<!-- Áreas afetadas, riscos, o que observar após o merge. / Affected areas, risks, what to watch after merge. -->

## Checklist

- [ ] Fiz self-review do código. / I have self-reviewed the code.
- [ ] Atualizei a documentação quando necessário (ou N/A). / I updated the docs where needed (or N/A).
- [ ] Há testes automatizados provando a mudança. / Automated tests prove the change.
