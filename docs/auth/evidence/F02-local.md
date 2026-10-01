# Evidência local F02 — persistência

> **Evidência histórica supersedida:** esta execução corresponde a `5add9fb1aca5279407ee9018ee719c78f837eeb6`. A reauditoria encontrou lacunas nas RPCs, grants e testes; consulte `../f02-critical-audit.md` e o manifesto `F02-reaudit-local.md`. Os totais abaixo são históricos e não comprovam a implementação corrigida, rotação completa de CPF ou T24–T29 completos. Não representa `PASS_LOCAL`, `PASS_TARGET`, `GO` ou autorização de release.

## Manifesto

| Campo | Valor |
| --- | --- |
| `schemaVersion` | `1` |
| `contractVersion` | `1.0` |
| `phase` | `F02` |
| `requirementIds` | parcelas exclusivamente bancárias de T24–T29; constraints, grants/RLS, RPCs, CAS, idempotência e leases |
| `repositorySha` | `5add9fb1aca5279407ee9018ee719c78f837eeb6` |
| `environment` | `LOCAL` isolado; Docker Desktop; sem link com projeto Supabase remoto |
| `versions` | Node `24.18.1`; npm `11.6.0`; Supabase CLI `2.118.0`; `@supabase/supabase-js` `2.117.2`; Docker Engine `29.8.1`; PostgreSQL `17.6` (imagem `17.6.1.171`); pgcrypto `1.3`; pgTAP `1.3.3` |
| `configuration` | Data API somente `rmc_auth_api`; dados em `rmc_auth_private`; autoexposição desabilitada; portas locais `55320`–`55329`; Auth da aplicação permanece `disabled` |
| `startedAt` | `2026-09-30T23:03:32.7271486-03:00` |
| `finishedAt` | `2026-09-30T23:15:56.9085410-03:00` |
| `responsible` | Codex, execução local solicitada e supervisionada pelo responsável do repositório |

## Procedimento e resultado

| Procedimento | Exit | Resultado |
| --- | ---: | --- |
| toolchain efetiva (`node`, `npm`, `supabase`, `docker`) | 0 | versões do manifesto confirmadas |
| `npm run db:reset` duas vezes, sem seed | 0 / 0 | banco vazio reconstruído duas vezes pelas quatro migrations |
| `npm run db:test` | 0 | 3 arquivos, 63 assertions pgTAP; objetos, constraints, cardinalidade, grants, RLS, invoker, CAS, idempotência, leases e regressão de generation |
| `npm run db:test:concurrency` | 0 | conexões independentes: challenge CAS 50; command ledger 50; manager 50; sessão NORMAL 50; leases 2/5/10/50; exatamente um vencedor onde aplicável |
| `npm run db:lint` | 0 | nenhum warning ou erro nos schemas Auth |
| `npx supabase db diff --local --schema rmc_auth_private,rmc_auth_api --use-pg-delta --strict-coverage` | 0 | `No schema changes found` |
| contraprovas SQL de advisors locais | 0 | 0 FKs sem índice; 0 funções `SECURITY DEFINER`; 0 tabelas no schema API |
| `git diff --check` | 0 | sem erro de whitespace no SHA testado |
| `npm run unused:check` | 0 | sem achados; SDK Supabase está allowlisted temporariamente até o adapter BFF porque o pin exato pertence à F02 |
| `npm run audit:security` | 0 | 0 vulnerabilidades reportadas |
| `npm run lint` | 0 | sem warnings |
| `npm run typecheck` | 0 | TypeScript aprovado |
| `npm test` | 0 | 54 arquivos, 227 testes |
| `npx vitest run --maxWorkers=1` | 0 | repetição serial: 54 arquivos, 227 testes |
| `npm run test:coverage` | 0 | 87,07% statements; 82,32% branches; 86,02% functions; 87,30% lines |
| `npm run build` | 0 | TypeScript, Vite e budget de bundle aprovados |
| `npm run test:e2e:check` | 0 | Chromium, 19/19 testes |

## Artefatos derivados sanitizados

| Arquivo | SHA-256 |
| --- | --- |
| `docs/auth/evidence/F02-api-schema.sql` | `F60213CDF78672F9ED01F8DBBC8B90BDEDEE177FE8B385527FE00D451986F08B` |
| `docs/auth/evidence/F02-private-schema.sql` | `4FC896CE8C133067EBE757C50DA37BC0607530FA917B40F9879DFE69C2BF60F0` |

Esses dumps são fotografia derivada e não substituem as migrations. A inspeção não encontrou keys, tokens, URLs privilegiadas ou dados pessoais; ocorrências textuais de `PASSWORD_REQUIRED` e `fencing_token` são nomes de domínio, não segredos.

## Limitações

- Nenhum `supabase link`, `db push`, migration remota, secret, SMS, Queue ou dado real foi usado.
- PostgreSQL `17.6` é prova do stack local, não do target; o changelog hosted já registra `17.11` e essa diferença deve ser reavaliada em F13.
- Advisors hospedados, restore remoto, quotas e configuração do projeto Supabase permanecem sem prova.
- As fixtures de unidade são sintéticas; capabilities unit-scoped continuam fechadas até a identidade ERP ser comprovada em F10.
- T24–T29 foram cobertos somente nas parcelas persistentes. Queue, SMS, crash externo e delivery real pertencem a F05 e não estão declarados completos.
- O SDK Supabase está pinado, mas não possui adapter nem import no browser; integração request-scoped pertence às fases BFF/provider.
- GitHub Actions continua impedido por billing. Job não iniciado não foi convertido em CI verde.

## Conclusão do gate

Não foi encontrada pendência crítica da F00/F01 nem defeito crítico da implementação F02 no escopo local executado. A F02 pode ser submetida a PR para revisão, mas deve parar antes do merge. A F03 exige nova validação explícita do responsável após integração e sincronização da F02.
