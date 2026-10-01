# F03 — fronteira BFF e revisão v1.1

**Natureza:** manifesto de execução local, schemaVersion 1. **Fase:** F03. **Contrato:** 1.1, revisão incremental da v1.0. **Resultado:** passed no escopo abaixo, não PASS_LOCAL global/PASS_TARGET/GO. **Responsável:** Codex; aceite do mantenedor e merge pendentes.

## Sumário navegável

- [Identificação e configuração](#identity)
- [Procedimentos e resultados](#procedures)
- [Requisitos e limites](#coverage)
- [Checksums e histórico](#integrity)

<a id="identity"></a>

## Identificação e configuração

SHA de código efetivamente testado: `4f63abfe6fb7b7c9457dbb96e2c9b74dd1d16365`, branch feat/auth-f03-bff-boundary; checkout limpo, dirty=false no relatório. Baseline main `74c7b24e647691e28df7935871c1b9afb6e34826`. Execução integral: `2026-10-01T15:38:51.134Z` → `2026-10-01T15:48:26.175Z`, exitCode 0.

Ambiente LOCAL Windows; integração LOCAL_PRODUCTION_LIKE em `https://localhost:8787`, listener loopback, Supabase API `http://127.0.0.1:55321`, projeto exclusivo rmc-estacionamento-layout. Auth_STAGE=disabled; BFF_CONTEXT_ENABLED=true somente na integração. Hosted/default mantém false. Chaves sintéticas efêmeras, certificado aceito somente pelo runner/Chromium, sem alteração da confiança do sistema.

| Versão efetiva | Valor |
| --- | --- |
| Node / npm | 24.18.1 / 11.6.0 |
| TypeScript / ESLint / Knip | 6.0.3 / 10.11.0 / 6.39.0 |
| Vite / Vitest aplicação / cobertura | 8.3.1 / 5.0.3 / 5.0.3 |
| Vitest Worker / plugin Workers | 4.1.11 / 1.3.4, workspace isolado |
| Wrangler / workerd dos tipos | 4.145.0 / 1.20260930.2 |
| SDK Supabase / CLI / PostgreSQL consultado | 2.117.2 / 2.119.0 / 17.11 |
| Zod / Playwright | 4.6.5 / 1.63.0 |
| React / React Router / Base UI | 19.3.0 / 8.4.0 / 1.8.0 |

compatibility_date=2026-10-01, nodejs_compat; ASSETS SPA com Worker-first para /api e /api/*. Limites: body 8.192 bytes, URL 2.048, Cookie 4.096, resposta Auth 16 KiB/RPC 64 KiB. Budget Worker 12 s/upstream 5 s/browser 15 s por tentativa e 30 s total. PREAUTH 30 min; rates locais 60 criações/min por chave loopback HMAC e 600/min global; não capacidade target validada.

<a id="procedures"></a>

## Procedimentos e resultados

Procedimento principal: `npm run check:full`. Todos os intervalos abaixo são UTC de 01/10/2026; todos tiveram exitCode 0.

| Etapa/comando | Início → fim | Resultado observado |
| --- | --- | --- |
| git diff --check; git diff --cached --check | 15:38:51.139 → 15:38:51.493 | Sem erro no checkout |
| npm run unused:check | 15:38:51.493 → 15:38:59.621 | Knip aprovado |
| npm run audit:security | 15:38:59.621 → 15:39:07.344 | Zero vulnerabilidades reportadas |
| npm run lint | 15:39:07.344 → 15:39:38.727 | Sem warnings/errors |
| npm run typecheck | 15:39:38.727 → 15:39:56.248 | Aplicação aprovada |
| npm run docs:check | 15:39:56.248 → 15:40:00.306 | 31 Markdown/68 suítes; links, anchors, inventário, integridade e workflow |
| npm run test:scripts | 15:40:00.306 → 15:40:19.635 | 17 testes; isolamento, descoberta, timeout/cancelamento/cleanup e sanitização |
| npm run test:coverage | 15:40:19.635 → 15:44:05.146 | 55 arquivos/246 testes; 87.06% statements, 81.98% branches, 85.82% functions, 88.01% lines |
| npm run build:assets | 15:44:05.146 → 15:44:11.255 | Build/budget e fronteira browser-servidor aprovados |
| npm run test:e2e:built | 15:44:11.255 → 15:44:39.027 | 19 Chromium, serial, sem retry local |
| npm run types:check -w worker | 15:44:39.028 → 15:44:42.683 | Output nativo Wrangler atualizado |
| npm run typecheck -w worker | 15:44:42.684 → 15:44:46.405 | Workspace isolado aprovado |
| npm test -w worker | 15:44:46.405 → 15:44:59.389 | 2 arquivos/19 testes runtime |
| npm run dry-run -w worker | 15:44:59.389 → 15:45:03.874 | Bundle gerado; nenhuma publicação |
| npm run db:start | 15:45:08.041 → 15:45:42.640 | Stack exclusivo iniciado; saída de chaves suprimida |
| npm run db:reset, primeira rodada | 15:45:42.640 → 15:46:18.191 | Rebuild limpo, sete migrations aplicadas |
| npm run db:reset, segunda rodada | 15:46:18.191 → 15:46:50.434 | Rebuild reproduzido |
| npm run db:test | 15:46:50.434 → 15:46:54.480 | 5 arquivos/156 assertions pgTAP |
| npm run db:test:concurrency, rodada 1 | 15:46:54.480 → 15:47:19.324 | CAS/command/manager/session=50; leases 2/5/10/50 |
| npm run db:test:concurrency, rodada 2 | 15:47:19.324 → 15:47:48.242 | Mesmos cenários repetidos, outcomes verificados |
| node scripts/auth-db/auth-db-context-concurrency.mjs, rodada 1 | 15:47:48.242 → 15:47:52.276 | 10 criações atômicas, 10 leituras estáveis, 10 invalidações com um vencedor |
| mesmo comando, rodada 2 | 15:47:52.276 → 15:47:55.980 | Cenários repetidos em conexões independentes |
| npm run db:lint | 15:47:55.980 → 15:47:58.252 | Sem erros de schema |
| npm run db:advisors | 15:47:58.252 → 15:48:00.559 | Sem achados no escopo local disponível |
| supabase db diff --local --schema rmc_auth_private,rmc_auth_api --use-pg-delta --strict-coverage | 15:48:00.732 → 15:48:10.181 | Diff vazio, envelope validado |
| integração scripts/worker/worker-integration.mjs pelo mesmo gate | 15:48:10.415 → 15:48:20.419 | HTTPS/SPA/API, contexto PostgreSQL real, 10 abas, Host/subresources negados e cookie Chromium HttpOnly |
| npm run db:stop | 15:48:21.285 → 15:48:25.820 | Stack pertencente ao gate encerrado; fixtures limpas |

Complemento sobre o mesmo build/SHA: `node node_modules/@playwright/test/cli.js test --project=firefox --project=webkit --workers=1`, `2026-10-01T15:44:58.3429750Z` → `2026-10-01T15:46:38.2224068Z`, 38 passed; wrapper exit 0. Não repetiu build/reset; preview usou porta distinta do BFF. Total de regressão browser: 19 por navegador, 57; integração HTTPS é prova adicional, não cenário contado novamente como E2E da SPA.

Consulta não mutante confirmou default audit `'1.1'::text` e constraint que aceita somente 1.0/1.1. Após o gate, docker ps confirmou ausência dos containers deste projeto e preservação do stack rmc-estacionamento. Diff integral contra origin/main revisado: espaços finais emitidos pelo gerador workerd ficam sob exceção restrita em .gitattributes; nenhum arquivo manual é dispensado. `types:check`, diff integral e docs foram repetidos após esse ajuste editorial/metadado, sem mudança no código executável testado.

<a id="coverage"></a>

## Requisitos e limites

Cobertura local: T02/T03/T21 e parcelas F03 de T06/T07/T18/T27/T35/T37/T38; propostas T41/T47/T48/T51/T58/T60/T62 somente nas partes descritas na [matriz](../plan-and-requirements.md#c5). O [catálogo](../../project/validation.md#catalog) lista arquivos/cenários. Contraprova de mutation é Worker auxiliar exclusivo dos testes, com contador de efeitos; nenhum endpoint futuro foi habilitado nem auxiliar incluído no bundle produtivo.

Runtime prova 8.192/8.193 bytes sem length, multibyte, MIME/encoding/JSON, stream lento/deadline, cookies conflitantes/duplicados, Origin/Host/Fetch Metadata, 401 challenge, token estável e mismatch/stale antes de efeito; adapter prova redirects/upstream inválido/indisponível e leitura bounded. AES-GCM tem vetor independente fixo, binding/purpose/key/codec/algorithm adulterados negados. Banco prova vínculo exclusivo, generation/expiry/invalidation/grants e codec explícito.

Ainda não implementados/provados: login, sessão NORMAL, provider Auth real, MFA, refresh, logout/promoção, recovery, step-up, CPF recuperável/rotação, SMS/Queue/DLQ, ERP autoritativo, controller/rotas privadas, staging, domínio, HSTS, capacidade/restore e gates F12–F14. T39–T63 não são declarados completos. PREAUTH local não habilita Auth funcional. Audit sem findings não certifica ausência de vulnerabilidades; dry-run não é deploy.

Billing é limitação de CI histórica, não resultado local. Estado deste PR deve ser consultado no GitHub; waiver anterior não autoriza seu merge. Aceite do mantenedor, fechamento da branch e F04 continuam dependentes de autorização expressa.

<a id="integrity"></a>

## Checksums e histórico

| Artefato | SHA-256 |
| --- | --- |
| Contrato v1.0 imutável | 74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148 |
| Contrato v1.1 testado | E147C46E87267A3CB5F93232AE8787025C0FCE7D58567F0A511088C7C51327D0 |
| package-lock.json | 5877A949780541D1BEEFEF298A0BF8F285C5A369E1BE9BEEC52316767F3EDBF6 |
| worker/worker-env.d.ts | 23F20498EED629AF94B5C80370352134FC417256434491021ECE9A540E623B1C |
| validation-results/full.json sanitizado, artefato local não versionado | 8B42595030B32FA8AE3EA95F071F2DD7C706F17367DC656DF805BF1BD5693B3F |

Snapshots F02 preservados com os checksums do [manifesto histórico](F02-reaudit-local.md); não representam schema F03. Dossiê usado e sua proveniência estão no [contrato revisado](../contract-v1.1.md#precedence).

Histórico: gate 0ae8ca382fb54be46916fb5923ad7614fef3ca68 passou em 01/10/2026 antes da revisão, não é prova v1.1. Primeira tentativa v1.1 no ed10a56892d183e1200e6ae3a32958e7018250ae, 15:33:34 → 15:38:17 UTC, exit 1: aplicação/Chromium passaram, typecheck Worker detectou fixture HeadersInit inferido com undefined; DB/HTTPS não iniciaram nessa tentativa. Correção exclusivamente de tipo no 4f63abf, seguida pelo gate integral acima; nenhum threshold, retry ou timeout foi relaxado.
