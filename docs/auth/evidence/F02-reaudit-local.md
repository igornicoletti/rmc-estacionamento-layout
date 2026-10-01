# F02 — gate local após reauditoria crítica

## Manifesto

- `schemaVersion`: 1
- `contractVersion`: 1.0
- `phase`: F02
- `repositorySha`: `bc8ab3c968ecf0e91c90d4c21934a3f70500d647`
- `environment`: LOCAL
- `result`: passed; gate específico `verified-local`, **não** `PASS_LOCAL`, `PASS_TARGET` ou release.
- `requirementIds`: invariantes de persistência e parcelas bancárias T25/T26/T27/T28/T29; T24 autoritativo permanece F04/F10. Detalhamento e contraprovas em [reauditoria](../F02-critical-audit.md).
- `responsible`: execução automatizada pelo assistente; encerramento condicionado ao gate local autorizado pelo responsável nesta solicitação.
- `startedAt`: 2026-10-01T00:24:51.5682117-03:00
- `finishedAt`: 2026-10-01T00:33:12.1133916-03:00
- `exitCode`: 0 nos procedimentos automatizados abaixo.

Contrato anexado verificado por SHA-256: `74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148`.

## Versões e configuração não secreta

Node 24.18.1; npm 11.6.0; Supabase CLI 2.118.0; SDK 2.117.2; Docker 29.8.1; PostgreSQL efetivamente iniciado 17.6 (imagem 17.6.1.171); pgcrypto 1.3; pgTAP 1.3.3. A versão minor não foi inferida do changelog.

Projeto local `rmc-estacionamento-layout`, stack mínimo, API loopback porta 55321, PostgreSQL porta 55322; faixa 55320–55329 evita interferir no outro projeto local. Auth permanece `disabled`. Schemas `rmc_auth_private` e `rmc_auth_api`; nenhuma tabela Auth browser-facing. Dados exclusivamente sintéticos.

## Procedimentos e resultados

| Procedimento exato | Resultado | Exit |
| --- | --- | --- |
| `git diff --check origin/main...HEAD` | sem erro de whitespace | 0 |
| `npm run db:start` | stack local iniciado; wrapper não imprime chaves locais | 0 |
| `npm run db:reset` (duas execuções) | reconstrução limpa das cinco migrations em ambas | 0 |
| `npm run db:test` | 4 arquivos, 126 assertions pgTAP aprovadas | 0 |
| `npm run db:test:concurrency` (duas execuções sem reset entre elas) | CAS 50, claim 50, manager 50, sessão 50 e leases 2/5/10/50 em cada rodada; outcomes individuais verificados | 0 |
| `npm run db:lint` | nenhuma advertência | 0 |
| `npm run db:advisors` | nenhum achado no nível warn/error | 0 |
| `npx supabase db diff --local --schema rmc_auth_private,rmc_auth_api --use-pg-delta --strict-coverage` | diff vazio | 0 |
| `npm run lint` | aprovado | 0 |
| `npm run typecheck` | aprovado | 0 |
| `npm run unused:check` | Knip aprovado | 0 |
| `npm run audit:security` | zero vulnerabilidades reportadas | 0 |
| `npm run build` | build e orçamento de bundle aprovados | 0 |
| `npm run test:e2e:check` | Chromium serial: 19/19 | 0 |
| `npx vitest run --coverage --maxWorkers=1 --testTimeout=10000` | 54 arquivos, 227/227; statements 87.07%, branches 82.32%, functions 86.02%, lines 87.30% | 0 |

Banco: término 00:28:43.4409756-03:00. Checks da aplicação/build/E2E: término 00:27:27.9429807-03:00. Vitest serial: início 00:26:09.3394662-03:00, término 00:33:12.1133916-03:00. Execuções parcialmente paralelas, sem modificar código durante o gate. Cobertura V8 refere-se à aplicação TypeScript, não à cobertura de SQL.

### Contraprova HTTP local

Em 2026-10-01T00:30:37.3204486-03:00, PowerShell obteve `supabase status --output json` somente em memória e usou `Invoke-WebRequest` contra o endpoint loopback. Não registrou chaves nem headers sensíveis. Asserções: leitura de `identities` com profile privado e anon → 406; tabela no schema API com anon → 404; `consume_challenge` com anon → 401; mesma RPC com service role e UUID sintético inexistente → 200 e `false`. Procedimento terminou com exit 0. Isso testa exposição/roles, não autorização final de ator/capability.

As duas rodadas concorrentes usam conexões independentes e fixtures UUID por execução, sem TRUNCATE. Cleanup confirmado: zero identities, Units e commands sintéticos restantes. As 15 tabelas privadas possuem ENABLE/FORCE RLS; nenhuma função Auth SECURITY DEFINER. Service role possui BYPASSRLS: RLS não foi usada como alegação de contenção desse papel.

## Artefatos derivados

Snapshots sanitizados, sem dados/secrets, derivados das migrations e normalizados somente no EOF; não são uma segunda fonte editável:

- `F02-api-schema.sql`: SHA-256 `B390239361D8FEE724581470FD48D3D60181DE04904621F4D837219044C05562`.
- `F02-private-schema.sql`: SHA-256 `CBAD363B81B9E453F959AF528F53E4F1F9A7DB3BD027919CEAD52E0ACDE6FB44`.

O manifesto é adicionado em commit documental posterior ao SHA efetivamente testado; não transporta evidência para código diferente. A evidência inicial `F02-local.md` é histórica e supersedida.

## Limitações e gate seguinte

- GitHub Actions apresentou billing lock, com job não iniciado. CI hospedada não é verde; o waiver de integração é registrado explicitamente na PR, separado deste resultado local.
- Não houve `link`, `db push`, migrations remotas, deploy, SMS, secrets de ambiente externo ou dados reais.
- Constraints/envelope metadata não provam AES-GCM, IV, HMAC/keyring ou igualdade entre hashes de versões diferentes. Rotação requer backfill/claims antigos e estratégia fail-closed; prova dos adapters permanece F04/F12.
- Claim não autoriza ator/capability (F04/F10); consume não verifica OTP nem promove autoridade (F06/F07); lease não executa refresh externo/commit (F08). Testes completos T24–T29 não são declarados concluídos.
- ERP, domínio, provider, Queue, SMS, recuperação operacional e prova target continuam pendentes nas fases responsáveis. Dados sintéticos não habilitam capabilities unit-scoped.
- Encerramento e merge da F02 não autorizam F03. Nova fase requer validação explícita do responsável.
