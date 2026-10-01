# Desenvolvimento

**Natureza:** referência vigente. **Escopo:** ambiente local e manutenção de dependências.
**Revisão:** 01/10/2026. **Baseline:** `74c7b24e647691e28df7935871c1b9afb6e34826` + F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Ambiente e loop](#c1)
- [Dependências e política](#c2)
- [Editor e segurança](#c3)
- [Banco local e limites](#c4)
- [Fontes](#c5)

<a id="c1"></a>

## Ambiente e loop

Node 24.18.1 (.node-version); npm 11.6.0 via packageManager/devEngines. `npm ci` respeita lock e falha em divergência; não atualiza pacotes. `npm run dev` inicia Vite; `npm run build` faz tipos + assets/budget; preview serve dist. Docker é necessário somente ao banco.

`npm run check` é o loop sem Docker; `check:app` prepara dist e Chromium; `check:db` reconstrói somente o projeto local; `check:full` integra ambos. [Comandos e catálogo](validation.md). Instale Chromium ou três browsers via Playwright; Linux requer dependências do sistema.

<a id="c2"></a>

## Dependências e política

| Grupo | Antes → versão aprovada | Decisão |
| --- | --- | --- |
| Build/teste | Vite 8.3.0 → 8.3.1; Vitest/coverage 5.0.1 → 5.0.3 | Peers e engines compatíveis; atualizar Vitest/coverage juntos |
| Qualidade | Knip 6.37.0 → 6.39.0; globals 17.12.0 → 17.13.0; typescript-eslint 8.70.1 → 8.71.0 | Sem migration incompatível |
| Query | React Query/plugin 5.103.2 → 5.104.0 | Query mantém pin exato; grupo revisado junto |
| UI | Lucide 1.47.0 → 1.49.0; DayPicker 10.0.1 → 10.0.2 | Sem alteração de componentes copiados |
| Supabase | CLI 2.118.0 → 2.119.0; SDK 2.117.2 mantido | CLI exata; SDK reservado BFF, sem import browser |
| Tipos Node | 22.20.4 → 24.19.0 | Alinhamento ao runtime major 24, não latest 26 |
| Retidos | TypeScript 6.0.3; cn 0.3.3; Zod 4.6.5; Node/npm | TS7 não cabe no peer <6.1; cn0.4 é migração distinta; Zod pin contratual |
| Docs/tooling novos | markdownlint-cli2 0.23.3; unified 11.0.5; remark-parse 11.0.0; github-slugger 2.0.0; yaml 2.9.1 | Pins exatos, parser AST; YAML 2.8.1 rejeitado por advisory e substituído sem force |

Lockfile é verdade das versões resolvidas; tabela registra esta rodada. `deps:status` informa current/wanted/latest, não valida atualização. Dependabot semanal, cooldown 3 dias, sem auto-merge; Vitest/Query/React agrupados por compatibilidade, majors separados. Não aumentar versão crítica sem novo gate. [Pesquisa](../auth/research.md).

<a id="c3"></a>

## Editor e segurança

VS Code compartilha js/ts.tsdk.path, tasks npm e recomendações ESLint/Markdownlint; não exige extensão para CLI. .gitignore permite apenas esses arquivos compartilhados.

Secrets não entram em VITE_*, logs, fixtures ou docs. .env.example contém apenas stage público; não consultar/registrar .env.local como evidência. Fixtures ERP locais reais em public/mock-data são ignoradas, nunca anexadas. Não usar link/db push/deploy/secret remoto nesta rodada.

<a id="c4"></a>

## Banco local e limites

Gate destrutivo de teste, projeto fixo rmc-estacionamento-layout/portas 55320–55329. Recusa DB já iniciado; se estiver trabalhando nele, finalize explicitamente antes do gate. Inicia stack mínimo, reset duas vezes, provas, cleanup e stop preservando backup; não afeta outro projeto.

O gate começa com `db:bootstrap` (somente PostgreSQL), faz os dois resets e só então inicia a API com health checks ativos. Volume restaurado sem `rmc_auth_api` não bloqueia a reconstrução. Sem `--ignore-health-check`, `--no-backup`, SQL de reparo ad hoc ou reset remoto.

Minor PostgreSQL é consultada, não inferida de db.major_version=17 ou CLI. A evidência pré-F03 registra 17.11; uma execução preliminar F03 observou 17.6. O gate integral de 01/10/2026 sobre 0ae8ca3 consultou 17.11; esses resultados são históricos, não prova target. Aviso PG17.11/pgcrypto/ltree/btree_gist/operators exige análise; ausência dessas APIs nas migrations Auth não certifica todo engine. Auth segue disabled e prova target pendente.

F03 usa workspace worker privado, lockfile único; SDK servidor2.117.2, Wrangler4.145.0, plugin1.3.4/Vitest4.1.11, appVitest5.0.3. `npm run test:worker:integration` é autossuficiente: build, dois resets, testes de banco e HTTPS loopback 8787. Recusa stack preexistente/porta ocupada. Chaves efêmeras só no ambiente do processo filho, saída startup suprimida; nenhum secret precisa ser criado manualmente. Não iniciar serviços remotos.

<a id="c5"></a>

## Fontes

[npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/), [Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference), [Supabase CLI release](https://github.com/supabase/cli/releases/tag/v2.119.0), [VS Code TypeScript](https://code.visualstudio.com/docs/typescript/typescript-transpiling).
