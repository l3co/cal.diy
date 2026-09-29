# Horário Comercial e Fusos Horários

Diretrizes definidas pelo usuário (entrevista em 2026-09-01) sobre como este projeto deve tratar fuso horário e horário comercial:

- **Fuso padrão/referência**: não há um fuso fixo global — usar o fuso do usuário logado como referência (cada usuário tem o seu).
- **Definição de horário comercial**: configurado por usuário/organizador (cada organizador define seus próprios dias e horários de trabalho), não é global nem por equipe/organização.
- **Conversão para o convidado (invitee/booker)**: quando o fuso do convidado difere do organizador, detectar automaticamente o fuso do navegador do convidado e converter/exibir os horários já nesse fuso.
- **Horário de verão (DST) e mudanças de fuso**: tratar usando biblioteca de timezone com base IANA tz database (ex: Luxon, date-fns-tz, dayjs com plugin de timezone) — não assumir offset fixo.

## Validação contra o código atual (2026-09-01)

- **Horário comercial**: ✅ alinhado. Configurado por usuário via `Schedule`/`Availability` (`packages/prisma/schema.prisma`), com override por `EventType` e por `Host` em eventos de time (`packages/features/availability/lib/detectEventTypeScheduleForUser.ts`). Fallback hardcoded de 9h–17h quando nenhum schedule existe.
- **Fuso do convidado**: ✅ alinhado. Detecção automática via `dayjs.tz.guess()` (`packages/lib/timezoneConstants.ts`) e ainda oferece seletor manual (`TimezoneSelectComponent`) na tela de booking — cobre o caso de detecção automática exigido e vai além.
- **DST**: ✅ alinhado. Usa `dayjs` com plugins `utc`/`timezone` (baseados em `Intl`/IANA tzdb), com `date-fns-tz` em pontos pontuais. Sem moment/luxon no projeto.
- **Fuso padrão/referência**: ⚠️ divergência conhecida. O código usa o timezone do usuário como referência (`User.timeZone`), mas esse campo tem um **default global hardcoded `"Europe/London"`** (`packages/prisma/schema.prisma:412`, repetido em `Team.timeZone:594` e no fallback do front `packages/lib/timezoneConstants.ts:4`) — ou seja, existe sim um fuso global fixo, usado como fallback. Isso contraria a diretriz de "sem fuso global fixo" e deve ser tratado como débito técnico/decisão a revisitar caso o comportamento correto seja outro (ex: detectar automaticamente o fuso do navegador do usuário no primeiro cadastro, em vez de cair em Londres).

# Skills do projeto

Skills abaixo são específicas do cal.diy (vivem em `.claude/skills/`, versionadas junto com o repositório). `research`, `plan` e `implement` formam um pipeline encadeado para desenvolvimento de novas funcionalidades:

1. **research** (`.claude/skills/research/SKILL.md`) — acionada ao propor uma nova funcionalidade. Age como analista de negócio: explora o código existente e entrevista o usuário (objetivo, escopo, cenários de falha/edge cases, critérios de aceite). Ao final, aciona automaticamente a skill `plan`.
2. **plan** (`.claude/skills/plan/SKILL.md`) — recebe o material do `research` e produz um plano de implementação em Markdown, dividido em partes, salvo em `docs/plans/<feature>/plan.md`. Pede aprovação do usuário antes de acionar automaticamente a skill `implement`.
3. **implement** (`.claude/skills/implement/SKILL.md`) — executa o plano aprovado parte por parte, seguindo o stack e as convenções do cal.diy (TypeScript/Next.js/tRPC/Prisma, métodos curtos e coesos, SOLID, funções puras em áreas de JS leve). Roda lint/type-check/testes a cada parte e, ao final, aciona automaticamente a skill `pr-generator`.
4. **pr-generator** (`.claude/skills/pr-generator/SKILL.md`) — usada ao abrir Pull Requests deste repositório no GitHub. Valida a política de aprovação de PR, aciona `pr-evidence` e monta a descrição com: o que foi feito, por quê, evidências, como testar e impacto.
5. **pr-evidence** (`.claude/skills/pr-evidence/SKILL.md`) — executa e coleta as evidências da implementação (lint, type-check, testes e screenshots/GIF quando há UI) para a seção `## Evidências` do PR.

# Política de aprovação de PR

Todo PR segue `docs/pr-policy.md`, verificado localmente por `node scripts/pr-policy/check.mjs` e no CI pelo check `PR policy` (limites em `.github/pr-policy.json`):

- Descrição com as seções bilíngues do template (`O que foi feito / What was done`, `Por quê / Why`, `Evidências / Evidence`, `Como testar / How to test`, `Impacto / Impact`); vale título em PT, EN ou ambos.
- Evidência real da execução (saída de lint/type-check/testes; screenshots/GIF para UI, publicados na branch órfã `evidence`).
- Commits granulares: no máximo 8 arquivos / 300 linhas por commit.
- Commits e título no padrão `<type>(<scope>): <assunto>`, scope obrigatório e igual em todo o PR.
- Um único contexto de negócio por PR (ex.: correção de login não inclui arquivos de checkout).
- Exceções: a label `policy-override` (aplicada por mantenedor) libera commits/granularidade/contexto, nunca descrição e evidência.
