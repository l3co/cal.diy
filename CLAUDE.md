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

- **pr-generator** (`.claude/skills/pr-generator/SKILL.md`): use ao abrir Pull Requests deste repositório no GitHub. Garante que a descrição do PR sempre traga: descrição clara, motivo da mudança, exemplos de como testar e impactos da mudança.
