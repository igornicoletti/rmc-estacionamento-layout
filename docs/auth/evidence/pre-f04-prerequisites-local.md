# Saneamento pré-F04 — evidência local

**Natureza:** manifesto suplementar F01/F02, schemaVersion 1. **Contrato:** v1.1 sobre v1.0 e dossiê v2.0 íntegros. **Data:** 01/10/2026. **Ambiente:** LOCAL/LOCAL_PRODUCTION_LIKE. **Status:** fundamentos verified-local; aceite/merge pendentes, F04 não iniciada. **Responsável pela execução:** Codex; aceite operacional pelo mantenedor.

## Sumário navegável

- [Proveniência e comandos](#provenance)
- [Resultados por requisito](#results)
- [Revisão, pesquisa e limites](#limits)

<a id="provenance"></a>

## Proveniência e comandos

Branch fix/auth-pre-f04-prerequisites deriva da revisão documental 78dc6a090e2596319bd5e37079afacb0819995f9 sobre main 3c4b6d4343aec56c369c625b15d0a0b859cabdce. Dois SHAs de código foram testados com checkout limpo; resultados não são transportados como gate integral de outro SHA:

| SHA completo / procedimento | Horários UTC, saída e artefato |
| --- | --- |
| 53e974b73fb68877a77e7404c6f37acd4c2f50e9 — npm run check:full | 2026-10-01T16:58:59.238Z–17:06:50.509Z; exit0, dirty=false; `validation-results/full.json`, SHA-256 AE7792A2AABEFC54D52FCEA5E0D29458B3128AE68F972A0A2882F7355CE14870 |
| 9c53c345431720a17fa717cf80c0ae29bf79a082 — npm run check:db | 2026-10-01T17:07:49.462Z–17:10:39.974Z; exit0, dirty=false; `validation-results/db.json`, SHA-256 BD1C549CD19B97F59F44BF1D2247E2759779047EAB736F44DEB127631C217C3C |

O segundo commit altera somente a migration nova e sua suíte pgTAP para preservar recuperabilidade após mudança de generation da identidade. Diff de src/worker/scripts/package/lock entre esses SHAs vazio, exit0. A revalidação proporcional repetiu todo o gate de banco: não se afirma que check:full foi repetido em 9c53c34. Documentação/evidência posterior não altera código executável; repetir docs:check e diff check após sua edição.

Toolchain efetiva: Node24.18.1/npm11.6.0, Supabase CLI2.119.0, PostgreSQL17.11 consultado no runtime, SDK servidor2.117.2, Zod4.6.5, Wrangler4.145.0, pluginWorkers1.3.4, Vitest app5.0.3/Worker4.1.11. Configuração: projeto local rmc-estacionamento-layout, banco loopback55322/Data API55321, HTTPS Worker localhost8787 e compatibility_date2026-10-01. Auth disabled; somente contexto PREAUTH no ambiente local explícito. Nenhuma chave real ou configuração target utilizada.

Relatórios JSON são artefatos locais derivados não versionados; checksums fixam a execução acima, não o próximo arquivo sobrescrito pelo runner. Bytes do contrato/dossiê e snapshots F02 mantidos; não reformatar ou substituir evidências históricas.

<a id="results"></a>

## Resultados por requisito

| Parcela / prova | Resultado e limite |
| --- | --- |
| F01/T03/T21: audit e provisioning estritos | 56 arquivos/250 testes app, incluindo quatro casos novos de portas/unknown/extra/outcome/fence/codec; lint/types/Knip/docs e 17 tooling aprovados. Audit sem mensagem SDK, body livre ou segredo |
| P0-11/T59 e DB-01–05: CPF privado | Envelope CPF e HMAC versionado; CAS/source guard; dual-write exigido; backfill antes de cutover; rollback monotônico sem apagar aliases; retired não revive; lookup legado incompatível negado. Banco recebe ciphertext/hashes, não CPF plaintext |
| P0-15/codec CPF | 23 testes Worker em três arquivos: codec isolado purpose CPF, 39 bytes, AES-GCM/HMAC com vetor Node independente, nonce aleatório, binding/tag/version/key separation, retenção/retirada de chave e cancelamento. Nenhuma Env/rota nova conecta esse adapter |
| PRV-02/04 parciais e T40/T49/T61 parciais | Reserva UUID/binding por comando; intenção do ledger imutável; lease/fence; unknown separado de absent; associação PENDING e audit/outbox no mesmo commit; audit falha desfaz associação; replay não duplica evento; ausência confirmada permite nova reserva preservando histórico |
| Banco no SHA final de código | 6 arquivos/210 assertions pgTAP; dois resets; duas rodadas F02 (50 conexões CAS/command/manager/session e leases2/5/10/50), duas F03 (10 create/read/invalidate) e duas pré-F04 (duas conexões CPF; dez reserva e dez reconciliation). Perdedor CPF exige SQLSTATE23505, versão inválida22023; timeout/infra não contam como conflito |
| Recuperabilidade após generation | Leitura exige generation atual da identidade; envelope retorna seu binding histórico para decrypt/reseal controlados. Fence antigo não lê; generation alterada não permite commit provider stale |
| Regressão e integração | Coverage e thresholds existentes aprovados; build aprovado; 19 Chromium no gate integral. Worker types --check/typecheck/runtime/dry-run, HTTPS+PostgreSQL real+dez abas aprovados. 19 Firefox+19 WebKit adicionais aprovados no SHA2e6ff458048cae5574154d46ec48c5ce76f8bf42; app/bundle não foram alterados pelos commits seguintes, mas estes resultados continuam associados a esse SHA |
| Segurança operacional local | npm audit zero vulnerabilidades; lint DB/advisors sem achados; schema diff vazio; cleanup de fixtures e stack próprio confirmado. CI hosted não é prova local |

Fixture SQL de CPF usa bytes sintéticos para constraints/concorrência; criptografia real é provada separadamente no runtime Worker com CPF sintético e vetor independente. Não existe ainda adapter de provisioning que componha provider real, esses codecs e RPCs; integração de negócio será F04. Não declarar T39/T40/T49/T59/T61 completos por estas parcelas.

<a id="limits"></a>

## Revisão, pesquisa e limites

Revisão corrigiu: distinção staged/retired no lookup, grant somente audit_events.id para RETURNING, variável PL/pgSQL redundante, purpose CPF literal v1.1, classification SQLSTATE versus infraestrutura, reserva corrente parcial com histórico ABORTED, decryption recuperável após generation. A tentativa integral anterior em 2e6ff45 terminou exit1 no lint DB e realizou cleanup; não é resultado positivo nem foi mascarada por relaxar lint, timeout ou retries.

[ADR-005](../decisions.md#c6) define codec, locks, precedência, keyring e limites. Fontes consultadas em 01/10/2026: [locks PostgreSQL17](https://www.postgresql.org/docs/17/explicit-locking.html), [funções Supabase](https://supabase.com/docs/guides/database/functions), [Web Crypto Workers](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) e [breaking changes PG17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). Schema Auth não usa ltree, btree_gist float/custom operators ou PGP legado; crypto ocorre no Worker, sem chave de decrypt no PostgreSQL. Nenhuma conclusão sobre schemas de outros projetos ou ambiente hosted.

Service_role BYPASSRLS não é contido por FORCE RLS. RPCs invoker têm grants mínimos e tabelas privadas; controle administrativo de rotação não é executável por service_role. Gate futura F04 exige adapter/PoC provider versionados, boundary de autorização, day-zero, reconciliação e compensação ownership; F10 mantém scope/Units/step-up fechados. Retenção/restore/key retirement reais são gates operacionais futuros, não realizados aqui.

Sem provider users criados, SMS, Queue, deploy, migration remota, link/db push, secret ou dado real. Default Auth disabled e endpoints futuros404 preservados. Sem PASS_LOCAL global, PASS_TARGET ou release. Billing anterior e waiver PR40 não autorizam merge desta rodada. Aceite e fechamento deste saneamento pelo mantenedor precedem F04.
