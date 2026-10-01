# Evidência da manutenção pré-F03

**Natureza:** manifesto de manutenção, não nova fase. **Escopo:** tooling/dependências/docs.
**Status:** passed localmente; aguardando revisão/fechamento autorizado. **Revisão:** 01/10/2026.
**schemaVersion:** 1. **contractVersion:** 1.0. **phase:** pre-f03-maintenance.
**repositorySha:** `560936195ca68d44b8e4241f858cbf281289f0c6`. **environment:** LOCAL; checkout clean no gate.
**responsible:** execução automatizada pelo assistente; aceite pelo responsável do projeto.

## Sumário navegável

- [Escopo e configuração](#scope)
- [Resultados e procedimentos](#results)
- [Integridade](#integrity)
- [Tentativas preliminares e limitações](#limits)

<a id="scope"></a>

## Escopo e configuração

Branch chore/pre-f03-project-maintenance, originada de main
`6daa9bed8971928ed7b63749e9b493645de78025`. Nenhuma mudança em src, migrations,
testes SQL ou OpenAPI. Auth disabled; F03 não iniciada. Consolidação editorial segue
o [mapa](../../documentation-standard.md#migration); F00/F01 e snapshots íntegros.
Manifestos F02 receberam somente reparo do case do link da auditoria.

**requirementIds:** manutenção/pureza F01, regressão F00, parcelas bancárias T25–T29 já
existentes e contratos de UI/ERP/routing/cache. Não representa T01–T38 completos.

Node 24.18.1/npm 11.6.0 efetivos; Windows/local; CLI 2.119.0; PostgreSQL 17.11
consultado no servidor. Vite 8.3.1; Vitest/coverage 5.0.3; Playwright 1.63.0;
Knip 6.39.0; globals 17.13.0; typescript-eslint 8.71.0; Query/plugin 5.104.0;
Lucide 1.49.0; DayPicker 10.0.2; types Node 24.19.0. Retenções: TS6.0.3/cn0.3.3,
SDK2.117.2 e Zod4.6.5. Ferramentas documentais: markdownlint-cli2 0.23.3,
unified11.0.5/remark-parse11.0.0/github-slugger2.0.0/yaml2.9.1.
Demais versões estão no lockfile e no relatório integral, com checksums abaixo.
[Decisões de atualização/retenção](../../project/development.md#c2).

DB restrito ao projeto rmc-estacionamento-layout/portas55320–55329; fixtures sintéticas,
sem conexão remota. Outro stack rmc-estacionamento não foi parado. E2E usa preview
127.0.0.1:4173 e mocks/espelho ERP preexistentes, não consulta serviços reais.
Worker/provider/crypto/Queue/SMS e target permanecem não provados.

<a id="results"></a>

## Resultados e procedimentos

`npm ci --no-audit` concluiu com exit0, 748 pacotes; gate integral abaixo executado
depois da instalação reproduzível. `npm ls --depth=0` e `deps:status` concluíram
com exit0; somente retenções deliberadas types Node26/TS7/cn0.4 ficaram como latest divergente.

| Prova | Resultado |
| --- | --- |
| Diff, lint, typecheck, Knip, npm audit | Exit0; zero vulnerabilidades |
| docs:check | 30 Markdown/63 suítes catalogadas; links/anchors/inventário/checksums/workflow aprovados |
| Scripts Node | 12 testes; falha/timeout/cancelamento/overflow/redaction/lock/cleanup/diff/discovery/ESLint |
| Vitest serial + V8 | 54 arquivos, 227 testes aprovados; nenhuma suíte perdida |
| DataTable thresholds preservados | Statements96.8%; branches90.9%; functions97.95%; lines97.64% |
| Assets/budget | Build aprovado; sem novo threshold ou migration de componente |
| E2E Chromium | 19 aprovados, um worker |
| E2E Firefox/WebKit | 38 aprovados, zero skipped/unexpected/flaky/errors; retries0 |
| DB | Dois resets; quatro arquivos/126 assertions pgTAP |
| Concorrência | Duas rodadas: CAS/command/manager/session50; leases2/5/10/50; outcomes verificados |
| DB lint/advisors/diff | Zero achados; diff JSON validado e vazio |
| Cleanup | Fixtures removidas; stack próprio parado e lock liberado; outro projeto preservado |

**procedure:** `npm run check:full`. **startedAt:** 2026-10-01T05:31:59.718Z.
**finishedAt:** 2026-10-01T05:38:39.843Z. **exitCode:** 0. Relatório marcou dirty=false.

| Comando interno | Início UTC | Fim UTC | Exit |
| --- | --- | --- | --- |
| git diff --check | 2026-10-01T05:31:59.721Z | 2026-10-01T05:31:59.825Z | 0 |
| git diff --cached --check | 2026-10-01T05:31:59.825Z | 2026-10-01T05:31:59.936Z | 0 |
| npm run unused:check | 2026-10-01T05:31:59.936Z | 2026-10-01T05:32:03.906Z | 0 |
| npm run audit:security | 2026-10-01T05:32:03.906Z | 2026-10-01T05:32:06.579Z | 0 |
| npm run lint | 2026-10-01T05:32:06.579Z | 2026-10-01T05:32:35.042Z | 0 |
| npm run typecheck | 2026-10-01T05:32:35.042Z | 2026-10-01T05:32:47.536Z | 0 |
| npm run docs:check | 2026-10-01T05:32:47.536Z | 2026-10-01T05:32:51.051Z | 0 |
| npm run test:scripts | 2026-10-01T05:32:51.051Z | 2026-10-01T05:33:00.499Z | 0 |
| npm run test:coverage | 2026-10-01T05:33:00.499Z | 2026-10-01T05:35:43.862Z | 0 |
| npm run build:assets | 2026-10-01T05:35:43.862Z | 2026-10-01T05:35:49.356Z | 0 |
| npm run test:e2e:built | 2026-10-01T05:35:49.356Z | 2026-10-01T05:36:11.455Z | 0 |
| npm run db:start | 2026-10-01T05:36:12.687Z | 2026-10-01T05:36:41.041Z | 0 |
| npm run db:reset | 2026-10-01T05:36:41.041Z | 2026-10-01T05:37:09.515Z | 0 |
| npm run db:reset | 2026-10-01T05:37:09.515Z | 2026-10-01T05:37:35.897Z | 0 |
| npm run db:test | 2026-10-01T05:37:35.897Z | 2026-10-01T05:37:39.438Z | 0 |
| npm run db:test:concurrency | 2026-10-01T05:37:39.438Z | 2026-10-01T05:37:57.924Z | 0 |
| npm run db:test:concurrency | 2026-10-01T05:37:57.924Z | 2026-10-01T05:38:18.664Z | 0 |
| npm run db:lint | 2026-10-01T05:38:18.664Z | 2026-10-01T05:38:22.077Z | 0 |
| npm run db:advisors | 2026-10-01T05:38:22.077Z | 2026-10-01T05:38:24.042Z | 0 |
| supabase db diff --local --schema rmc_auth_private,rmc_auth_api --use-pg-delta --strict-coverage | 2026-10-01T05:38:24.230Z | 2026-10-01T05:38:34.864Z | 0 |
| npm run db:stop | 2026-10-01T05:38:35.059Z | 2026-10-01T05:38:39.514Z | 0 |

Prova adicional sobre o mesmo build/SHA, sem duplicar Chromium:
`node node_modules/@playwright/test/cli.js test --project=firefox --project=webkit --workers=1 '--reporter=line,json'`,
com PLAYWRIGHT_JSON_OUTPUT_NAME=validation-results/e2e-additional.json.
Início2026-10-01T05:39:26.142Z; duração69046.871ms; término2026-10-01T05:40:35.189Z; exit0.
Após esses testes, somente este manifesto e a precisão editorial do README Auth foram
alterados; não se atribui execução retroativa ao commit documental posterior.

<a id="integrity"></a>

## Integridade

Artefatos de execução são locais/ignorados; este manifesto preserva resultados e
checksums. Reproduzir pelo gate; não inferir aprovação de artefato ausente.

| Artefato | SHA-256 |
| --- | --- |
| Contrato v1.0 byte-for-byte | 74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148 |
| package-lock.json | 1CA391B17C11B16A9C801E3E831EE59DB5770609D2B64E3A1EF7BE1194A272AD |
| validation-results/full.json | 5E88741BCE91D56BCD914228880106BC104A7C04D175AE46E41DFFA13C40282B |
| validation-results/e2e-additional.json | 0E7F4CA1B2F1E43679754EA685161D084AF31239B2473EF6EA02E661BCDC69C1 |
| coverage/lcov.info | 4A98695E1BC864CB6A604406B214E8E3B4EE60F04F904312A599294DE49BECB4 |
| F02-api-schema.sql histórico | B390239361D8FEE724581470FD48D3D60181DE04904621F4D837219044C05562 |
| F02-private-schema.sql histórico | CBAD363B81B9E453F959AF528F53E4F1F9A7DB3BD027919CEAD52E0ACDE6FB44 |

<a id="limits"></a>

## Tentativas preliminares e limitações

- Tentativas dirty não são prova final: whitespace documental corrigido; CLI2.119
  retornava envelope JSON para diff vazio, agora validado estritamente com contraprovas.
- Cobertura preliminar sem progresso visível foi interrompida; suíte isolada e serial
  passaram, depois o gate integral passou. Nenhum timeout/retry/threshold foi aumentado.
- Diagnóstico de cobertura simultânea foi recusado pelo lock do Vitest; não é resultado
  de suíte. Argumento reporter não citado em PowerShell foi corrigido antes do E2E adicional.
- npm ci inicialmente falhou por EPERM no binding Rolldown mantido pelo Vite aberto;
  somente o servidor deste projeto foi encerrado, então instalação limpa passou.
- Após npm ci, npm ls exit0 marcou cinco dependências WASM opcionais como extraneous
  (@emnapi/core/runtime/wasi-threads, @napi-rs/wasm-runtime e @tybys/wasm-util).
  Todas constam no lockfile com optional=true; não houve missing/invalid ou conflito
  de peer. Registro de toolchain, sem inferir causa ou remover pacotes à força.
- Playwright apagava relatórios guardados em test-results; corrigido para validation-results
  com contraprova. Gate repetido no SHA final, sem reaproveitar relatório apagado.
- Erro sintético de ErrorBoundary e avisos FORCE_COLOR/NO_COLOR são diagnósticos esperados;
  não foram usados para ocultar falhas. Logs de startup/conexão sensíveis não são publicados.
- Sem link/db push/migration remota, secrets externos, deploy ou SMS. DB não usa dados
  reais de Auth; UI preserva demonstração/espelho ERP existente, sem certificar anonimização.
- Histórico não é prova atual. Billing não iniciado não é CI verde; waiver de PR anterior
  não vale nesta PR. A situação remota será reportada separadamente na entrega.
- Não é PASS_LOCAL global/PASS_TARGET/GO/release. Merge exige autorização de fechamento;
  esta manutenção não autoriza F03. Revisão final documental roda docs:check e diff check.
