# Política de aprovação de Pull Requests

Todo PR deste repositório precisa cumprir as regras abaixo para ser aprovado. Elas são verificadas em dois momentos:

- **Localmente**, pela skill `pr-generator` antes de abrir o PR (`node scripts/pr-policy/check.mjs`).
- **No CI**, pelo workflow `.github/workflows/pr-policy.yml`, que falha o check `PR policy` e comenta no PR o que precisa ser ajustado.

Limites, seções obrigatórias e áreas ficam em `.github/pr-policy.json` — altere lá, não no script.

## Regras

### 1. O PR deve informar o que foi feito

A descrição deve conter as seções abaixo (títulos `##` com o nome em português, em inglês ou ambos, como no template), cada uma com conteúdo real — comentários `<!-- -->` e placeholders não contam:

| Seção | Conteúdo esperado |
| --- | --- |
| `## O que foi feito / What was done` | O que mudou, de forma objetiva. |
| `## Por quê / Why` | Motivo da mudança (bug, feature, débito técnico...). |
| `## Evidências / Evidence` | Resultado da execução (ver regra 2). |
| `## Como testar / How to test` | Passos reproduzíveis para o revisor. |
| `## Impacto / Impact` | Áreas afetadas, riscos, efeitos colaterais. |

### 2. Deve constar a evidência da implementação

A seção `## Evidências / Evidence` precisa trazer pelo menos um bloco de saída de comando (bloco de código) ou uma imagem. A skill `pr-evidence` gera essa seção automaticamente com:

- **Lint** (Biome) dos arquivos alterados;
- **Type-check** dos workspaces afetados;
- **Testes** (Vitest) relacionados aos arquivos alterados;
- **Screenshots/GIF** quando o PR altera UI — publicados na branch órfã `evidence` e linkados no PR, para não entrarem no diff.

### 3. Commits granulares

Cada commit pode ter no máximo **8 arquivos** e **300 linhas alteradas** (adições + remoções). Lockfiles, arquivos gerados e snapshots não entram na conta (lista em `granularity.ignore`). Um PR com um único commit gigante falha; divida por passo lógico (ex.: tipo/schema → lógica → UI → testes).

### 4. Padrão de commits claro

Todo commit segue [Conventional Commits](https://www.conventionalcommits.org/) **com scope obrigatório**:

```
<type>(<scope>): <assunto no imperativo, até 72 caracteres>
```

- `type` ∈ `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`, `style`, `revert`.
- O título do PR segue o mesmo formato.
- Commits de merge e `fixup!`/`squash!` não são aceitos — faça rebase antes de pedir revisão.

### 5. Um único contexto por PR

- **Scope único**: todos os commits e o título do PR usam o mesmo `scope`.
- **Área única**: cada arquivo alterado é classificado em uma área de negócio pelas regras de `context.areas` (ex.: `packages/features/auth/**`, `apps/web/modules/auth/**` e `packages/trpc/server/routers/viewer/auth/**` → área `auth`). Se os arquivos caírem em mais de uma área, o PR falha.
- Arquivos que não se encaixam em nenhuma área (ex.: `packages/lib/**`, traduções, lockfile) são tratados como compartilhados e não contam para essa regra.
- Áreas relacionadas podem ser agrupadas em `context.aliases` (ex.: `payments` e `stripe`).

Exemplo: um PR `fix(auth): ...` que também altera `packages/app-store/stripepayment/**` falha, porque mistura as áreas `auth` e `stripepayment`.

## Exceções

Não há override automático. Se um PR realmente precisa quebrar uma regra (ex.: migração em massa gerada por codemod), explique na seção `## Impacto` e peça a um mantenedor para aprovar manualmente; ajustes recorrentes devem virar mudança em `.github/pr-policy.json`.
