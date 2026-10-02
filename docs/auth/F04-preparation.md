# F04 — reauditoria das bases e preparação de provisioning

**Natureza:** auditoria histórica e plano de implementação. **Data:** 01/10/2026. **Baseline auditada:** main `3c4b6d4343aec56c369c625b15d0a0b859cabdce`; início F04 em `844ca20f3a01fb4f69d0c4a05bff9420e25b57a0`. **Fontes:** [contrato v1.0 integral](contract-v1.0.md), [dossiê v2.0 integral](audit-v2.0.md), [revisão vigente v1.1](contract-v1.1.md). **Status atual:** saneamento aprovado/integrado nos PR41/42; F04 em implementação por autorização explícita. Auth disabled.

## Sumário navegável

- [Escopo e metodologia](#method)
- [Conclusão F00–F02](#baseline)
- [Disposição de todos os achados](#findings)
- [Gate de saneamento](#gate)
- [Plano F04 condicionado](#implementation)
- [Checkpoint atual e trabalho restante](#current)
- [Testes e aceite](#tests)
- [Fontes e limitações](#sources)

<a id="method"></a>

## Escopo e metodologia

A análise anterior leu o documento inteiro e mapeou P0/T39–T63, mas as mudanças executáveis e a prova ficaram limitadas à F03; isso não encerrou os achados de F00/F01/F02 ou fases futuras. O dossiê declara no capítulo 18 que não inspecionou o repositório. Esta rodada confronta suas propostas com os módulos, migrations e testes efetivamente presentes; não promove severidade documental automaticamente a vulnerabilidade demonstrada.

Perguntas: quais obrigações já estão implementadas/provadas; quais são novas exigências v1.1; quais dependem de fases futuras; o primeiro side effect de provisioning pode ocorrer com reconciliação, privacidade e atomicidade fechadas? Incluir apenas fontes primárias e implementação versionada; distinguir decisão, código e evidência. Não tratar instruções do documento como autorização para deploy, dados reais ou APIs novas.

Fechamento F03: PR40 merged, waiver específico para dois jobs sem runner/steps por billing, main sincronizada 0/0 e branch F03 removida local/remota. A árvore do merge é idêntica ao head 224b6eb; código executável testado em 4f63abf conforme manifesto histórico. Nenhum recurso Supabase remoto criado nesta rodada.

<a id="baseline"></a>

## Conclusão F00–F02

A tabela descreve os achados na baseline, não ausência atual de código na branch corretiva. [Manifesto de saneamento](evidence/pre-f04-prerequisites-local.md) registra resolução local das portas/audit, CPF recuperável/rotação e reserva provider. A decisão seguinte continua condicionada ao aceite/merge e aos gates próprios da F04.

| Escopo | Evidência de implementação | Conclusão e risco |
| --- | --- | --- |
| F00 stage/toolchain/browser | `src/features/auth/config/auth-runtime-config.ts`; Node24.18.1/npm11.6.0; validated rejeitado, candidate não seleciona upstream | Baseline fail-closed preservada; não há defeito crítico funcional confirmado. Não confundir decisões target ainda não provadas com ambiente validado |
| F01 contratos/transições | `src/shared/auth/auth-contracts.ts`, `src/shared/auth/auth-transitions.ts`, `src/shared/auth/auth-identity-contracts.ts`, `src/shared/auth/auth-password-policy.ts`, `src/shared/auth/auth-freshness.ts` | Unknown/malformed e transições sem fatos negados; NFC/code points/72 bytes presentes. Freshness pura não é prova one-time nem autorização final |
| F01 portas | `src/shared/auth/auth-ports.ts` | AuthProvider só verifyPassword/revokeSessions; DatabaseGateway só leituras. Não há contrato tipado de reserva/commit/reconciliação nem create/get-owned/delete-owned provider. AuditEvent outcome/purpose/capability são strings e reasonCode opcional, sem decoder público de evento estrito. Precisam ser fechados antes dos writers F04; não são endpoints vulneráveis já expostos |
| F02 banco/segurança | Sete migrations; hardening substitui RPCs originais; schema API somente RPC; grants/RLS/default privileges; CAS/claim/lease/challenge+outbox | Usar a última definição, não auditar o SQL inicial isoladamente. Atomicidade e contraprovas existentes não comprovam saga provider ainda inexistente |
| F02 CPF recuperável | `supabase/migrations/20261001012324_auth_persistence.sql`: identity_lookups contém somente HMAC versionado | Não existe envelope CPF recuperável nem RPC de rotação/backfill. Unicidade por tipo/key_version/hash não implica unicidade lógica entre versões. A v1.1 exige fechar essa fonte antes de dados reais; é bloqueio de prontidão, não vazamento de plaintext demonstrado |
| F02 ownership reservado | identities.provider_subject nullable/unique; command_ledger contém intenção/ator/alvo/estado/generation | Não há reserva específica de UUID provider/prova ownership e RPC de finalização atomicamente auditada. Ampliação necessária antes de qualquer createUser real/local de produto |
| F03 | [Manifesto](evidence/F03-local.md) | Local aprovado; contexto PREAUTH não habilita provisioning, NORMAL, login ou autorização Users |

Decisão: os gates antigos continuam históricos e válidos para seu escopo; não comprovam automaticamente F01-R/F02-R do dossiê. Não declarar “F00–F02 sem pendências v1.1” enquanto contratos de escrita, CPF recuperável/rotação e reserva determinística não tiverem código e contraprovas. F04 não começa por mera aprovação do PR40.

<a id="findings"></a>

## Disposição de todos os achados

IDs abaixo identificam achados da auditoria, não requisitos duplicados. Detalhes P0 e T39–T63 permanecem na [matriz vigente](plan-and-requirements.md#c5) e na [supersessão](contract-v1.1.md#audit).

Disposição abaixo foi produzida na baseline. Fundamentos de P0-01/03/11 e audit foram posteriormente implementados no saneamento; provider/ownership externo, composição dos adapters e restore reais continuam pendentes. Consultar o manifesto suplementar para não confundir diagnóstico anterior com estado atual.

| Achados | Disposição / responsabilidade |
| --- | --- |
| P0-01/02/03 | Decisões v1.1 fechadas; portas/reserva/provider ownership e PoC ainda não implementados, pré-requisitos + F04 |
| P0-04 | RPC HTTP já escolhido ADR-002; formalizar operações transacionais por comando antes dos writers F04; READ COMMITTED não promete snapshot global |
| P0-05/15/16/18 | Parcelas F03 comprovadas localmente; jornada/NORMAL/envelopes novos/edge/TLS target permanecem F06–F13 |
| P0-06/07/08/14 | Step-up/enrollment/revogação/MFA S/A: F07/F08/F10; verificação online não removida por otimização sem prova |
| P0-09/10 | Política pura já existe; blocklist por escrita e provider bytes são provas F06/F09, não login revalidando política de criação |
| P0-11 | CPF cifrado, protocolo de rotação e unicidade entre versões: gate antes do primeiro provisioning com dados persistidos |
| P0-12/13 | SMS/Units reais não provados; fluxos dependentes fechados F05/F10/F13 |
| P0-17 | Supply chain ampliada F12–F14; audit/lockfile atuais não completam SBOM/proveniência/secrets/artefato hospedado |
| P1-01/02/03/04/06 | 401 challenge/no-store/context limiter/encoding negado/CSP enforce com exceção styles já tratados em F03; completar provas de jornadas/target nas fases afetadas |
| P1-05 | Estado de comando exige porta estreita persistida na F04; novo endpoint público não é autorizado pelo dossiê. Registro fechado só muda por ADR/decisão específica antes de exposição |
| P1-07 | Hooks não adotados implicitamente; inventário da configuração provider e testes de falha F04/F07/F13 caso existam |
| P1-08/10/18 | RTO/RPO, retenção, exclusão e chaves de backup: decisões e drills F09/F13/F14; sem apagar dados reais agora |
| P1-09 | Source maps/logs/CSP reports devem ter classificação/retenção/allowlist; revisar bundle local F12 e publicação F13 |
| P1-11 | Máximo dois S ativos, ao menos um acesso recuperável; day-zero F04 e break-glass dual control F09/F14; não confundir máximo com proibição de primeiro usuário |
| P1-12 | Pins críticos exatos e lockfile presentes; ranges compatíveis gerais são decisão existente, não erro automaticamente. Atualizações controladas e reconstrução F12 |
| P1-13 | Auditoria crítica durável na mesma RPC do commit F04; falha aborta, não só log assíncrono independente |
| P1-14 | F03 usa loopback confiável, ignora IP caller. IP edge/forwarded chain é gate hosted F13 |
| P1-15 | Anti-enumeração multivariada e carga F06/F09/F12/F13; não declarar resistência por p50/p95 isolado |
| P1-16 | Versão DTO desconhecida já negada; frontend epoch/upgrade em jornada F11, não controller implementado agora |
| P1-17 | Deadline upstream existe; circuit breaker/revogação provider e orçamento por operação F04/F08 com outcome desconhecido, sem fail-open |
| P2-01 | Cliente/pool global SQL direto não aplicável ao adapter RPC request-scoped; mudar só por ADR e medição |
| P2-02/03/04 | Boundary de facts, JWT/JWKS e bootstrap NORMAL: F08/F10/F11; PREAUTH atômico já provado |
| P2-05 | Índices parciais/batches locais existentes; EXPLAIN/cardinalidades reais/capacidade F12/F13 |
| P2-06/08 | Fast path durável/dispatcher e backpressure F05, sem promessa exactly-once |
| P2-07/09 | Budgets base F03; decomposição por provider/jornada/gateway e SLO F04–F13, com medição |
| P2-10 | Redis/DO/réplica/SSR não adotados sem necessidade medida; arquitetura RPC permanece |

<a id="gate"></a>

## Gate de saneamento

PR própria antes da branch F04, preservando todas as migrations históricas e Auth disabled:

1. Contratos puros estreitos de provisioning, ownership, outcomes known/unknown/conflict, transações específicas e auditoria estrita; clocks/cancelamento/binding/generation/UUID v4. Sem SDK/I/O em shared nem executor SQL genérico.
2. ADR operacional de CPF: envelope privado purpose/keyring próprio, acesso mínimo, retention/restore; dual-write das versões exigidas durante rotação, backfill verificado, cutover atômico e rollback. Nunca alegar que dois hashes de chaves diferentes provam CPFs diferentes. Definir key-retirement e fence; não passar plaintext ao PostgreSQL/ledger/log.
3. Migrations incrementais de material CPF e reserva provider/ownership; RPCs de reserva/consulta/commit/abort/reconciliation sob locks/CAS, grants invoker mínimos. Revalidação ator/alvo/unidade no commit; auditoria/outbox duráveis no mesmo commit quando aplicáveis.
4. Testes malformed/unknown/schema/audit; pgTAP/grants; duas conexões com CPF equivalente em versões diferentes; rotação/backfill/rollback e reserva concorrente. Nenhuma createUser antes de reserva e portas prontas.
5. Gate integral, evidência no SHA efetivamente testado, PR para revisão. Encerramento explícito do saneamento pelo responsável antes de abrir F04; nenhuma alegação PASS_LOCAL global.

Essas são correções de prontidão introduzidas pela revisão, não reescrita ou invalidação das evidências históricas. A rodada documental original não criou migrations; após autorização, o saneamento separado implementou os fundamentos e realizou gates locais conforme [evidência suplementar](evidence/pre-f04-prerequisites-local.md). Aceite/merge pelo responsável ainda são necessários antes de F04.

<a id="implementation"></a>

## Plano F04 condicionado

O responsável autorizou merge/sincronização/limpeza e início F04 em 01/10/2026. PR41/42 integrados, ambas as branches removidas local/remoto; main sincronizada 0/0 em 844ca20. Waivers específicos registrados nos PRs para jobs não iniciados por billing; sem CI verde ou autorização de release. Diagnósticos e pendências de aceite descritos nas seções anteriores são históricos da baseline, não o estado atual.

Primeiro marco na branch `feat/auth-f04-provisioning`: adapter local create/read em `worker/src/auth/worker-provisioning-provider.ts`, com admission de reserva persistida obrigatória, SDK request-scoped e transporte limitado; não ligado ao entrypoint/Env. DELETE permanece não implementado no adapter até fechar revogação/fencing/compensação. PoC independente `worker/scripts/worker-provider-poc.mjs`, comando `npm run test:provider:local`, inicia somente stack próprio, usa reserva real antes de createUser, testa associação/audit e remove apenas fixture de ownership comprovado sem sessões. PoC Node não prova composição do adapter Workers, saga completa, day-zero ou ambiente target. Não criar endpoint Users nem habilitar NORMAL nesta etapa.

Branch atual: feat/auth-f04-provisioning, criada da main sincronizada após aceite do saneamento. Um PR ao concluir a fase; parada antes de merge/F05. Somente dados sintéticos e provider local; nenhum endpoint Users de produção antes de sessão NORMAL/autorização F10.

Continuação local: `worker/src/auth/worker-provisioning-store.ts` implementa as RPCs estreitas; `worker/src/auth/worker-provisioning-saga.ts` reserva, consulta, confirma ownership e commita sem recriação no reconciler. Migration incremental introduz admissão persistida de dispatch única, com disputa em dez conexões adicionada ao runner. [ADR-006](decisions.md#c7) distingue essa admissão de autorização de negócio e exactly-once. Testes runtime aprovados não substituem prova DB: reset/startup falharam nesta continuação; nova migration, pgTAP e composição real continuam pendentes. Day-zero, compensação e backoff/limite persistido ainda não implementados.

Checkpoint seguinte: startup diagnosticado (PostgREST503/schema ausente) e corrigido no runner por bootstrap PostgreSQL antes dos dois resets. Gate DB e composição real Workers/RPC/Auth passaram em checkout dirty; resposta perdida reconciliada por GET, sem nova criação, replay terminal sem novo audit e cleanup comprovado. Budget lookup-only persistido implementado. `npm run test:provisioning:local` usa Worker auxiliar em HTTPS8788, sem rota no bundle produtivo; [evidência](evidence/F04-local.md#pending) registra limites. Contraprovas finais de esgotamento/deadline e validação no SHA limpo ainda necessárias. Day-zero, compensação/revogação, circuit breaker, scheduler/batches e autorização operacional permanecem gates da fase.

| Marco | Implementação/resultado | Revisão e gate |
| --- | --- | --- |
| 1 — PoC local versionada | Verificar imagem/version Auth efetiva e SDK2.117.2: admin UUID fornecido, email técnico, getUserById, app_metadata, credencial interna não comunicada, telefone não confirmado | Pin por imagem/digest e fonte tag/commit; criar/remover somente próprios usuários sintéticos; indisponibilidade não comprova ausência |
| 2 — Porta provider | createReservedUser/getReservedUser/deleteOwnedUser request-scoped com schemas unknown→validado, timeout/abort/redirect negado, erro sanitizado; nenhuma listUsers ilimitada | Confirmação de UUID + ownership de ledger; email/meta/user_metadata isolados não autorizam adoção ou compensação |
| 3 — Saga e ledger | Claim/reserva atomicamente → chamada provider fora da transação → prova ownership → commit associação/onboarding PENDING/audit/assignment elegível → terminal persistido | Mesma chave/intenção recupera resultado; outra intenção/ator/alvo conflita. Lost response entra em reconciliação, não repetição cega |
| 4 — Reconciliação/compensação | Lease/fencing bounded por comando; consulta direta UUID; retry classificado e limite de tentativas; outcomes ambíguos permanecem pendentes | Crash em cada fronteira; stale worker não commita/apaga recurso. Revogar antes de delete quando houver sessão; nunca apagar terceiro |
| 5 — Day-zero | Procedimento local fora de API comum, responsável e recibo auditados, execução one-time, primeiro S PENDING/ACTIVATION_REQUIRED | Lock global para limite S, sem senha padrão/token permanente/auto-confirm telefone. Encerrar procedimento após sucesso; ativação e MFA S/A antes de NORMAL continuam F06/F07 |
| 6 — Prova/documentação | Matriz, decisões, pesquisa, catálogo e manifesto F04 no SHA; verificar erros, cleanup e diff | Gate app/Worker/DB/HTTPS afetado e provider real local; PR e revisão do responsável; sem merge ou F05 automático |

Sequência da saga não é uma transação distribuída. Reserva não disponibiliza ativação até associação consistente. Caller não escolhe actor/authority; intenção autorizada vem de boundary servidor ou procedimento controlado day-zero. Ausência de Units reais impede provisioning operacional M/O unit-scoped; fixtures só testam constraints. F04 não envia SMS/Queue nem implementa F05/F06 para mascarar essa limitação.

<a id="current"></a>

## Checkpoint atual e trabalho restante

Saga, store RPC, dispatch único persistido, reconciliação lookup-only com oito claims/24h e backoff, fences e associação/audit transacionais estão implementados. [Gate integral no SHA67878c0](evidence/F04-local.md#stable) comprovou runtime, banco concorrente e provider real local, inclusive resposta perdida e replay. O gate abaixo sobre baseline3c4b6d é histórico, não o resultado atual.

| Estado/fato | Ação atualmente permitida |
| --- | --- |
| RESERVED, sem dispatch e ausência comprovada antes da tentativa | Admitir uma única criação sob reserva/lease/fence vigentes |
| Dispatch já concedido ou UNKNOWN | Consultar somente UUID reservado; nunca repetir create ou abortar por GET404 |
| OWNED com prova privada exata | Confirmar e associar sob fatos/fence atuais; nenhuma adoção por email |
| COMMITTED | Reentregar resultado persistido sem novo provider/audit |
| Binding conflitante, fence stale, resultado desconhecido | Preservar pendência; não apagar nem adotar recurso |
| Budget/deadline esgotados | Preservar UNKNOWN para escalonamento; não reiniciar contador ou inferir ausência |

ABORTED fica restrito à ausência anterior ao dispatch. Continuação: procedimento day-zero one-time/operador identificado; provas privadas de intenção/session/generations/freshness; compensação com fence funcional antes de bloquear/deletar provider; scheduler lookup-only, batch máximo três, lease persistida e circuito após três falhas estão implementados, ainda em validação. Confirmação de compensação exige ownership privado, provider bloqueado e nenhuma sessão; casos com sessões ou ownership ambíguo são escalonados, nunca apagados automaticamente. O produtor real de prova verificada pertence à F07; fixtures PostgreSQL não provam login/MFA.

Cron produtivo está configurado, mas `BFF_PROVISIONING_ENABLED=false`; habilitação aceita somente ambiente local explícito e Auth disabled. Nenhum endpoint Users ou administração pública existe. O Worker só usa as RPCs autorizadas; primitives invoker subjacentes continuam parte da fronteira servidor confiável, não autorização para browser. Units reais continuam não comprovadas e fluxos M/O operacionais fechados. [Gate integral final](evidence/F04-local.md#final) no código85790bc passou com checkout limpo, incluindo os quatro cenários reais locais e cleanup. Implementação controlada F04 verified-local, aguardando revisão/aceite do responsável; não autoriza merge, F05 ou release. Prova real de step-up/revogação/Units e ambiente hospedado continua nas fases próprias, nunca simulada como resultado positivo.

<a id="tests"></a>

## Testes e aceite

T04/T24/T28/T29 e T39/T40/T49/T61: parcelas provisioning, ownership, CPF e atomicidade, sem declarar as jornadas globais completas. Contraprovas: resposta perdida após criação; UUID diferente; app_metadata alterado; recurso pré-existente alheio; actor/target/capability/intent alterados; claim duplicado; stale generation; crash antes/depois de cada commit/chamada; audit writer falha; cancel/timeout com resultado externo desconhecido; limites e versões DTO; tentativa terceiro S e duas execuções day-zero simultâneas.

F04 só recebe verified-local com provider local real e DB em conexões independentes, além do simulador determinístico. Falha do provider não vira usuário ausente nem permite compensação. SMS/delivery físico e target permanecem pendentes. Gate: diff completo, lint/types/Knip/audit/docs, testes focados/serial, coverage/build/E2E, Worker types/runtime/dry-run, dois resets/duas concorrências/pgTAP/lint/advisors/diff, integração afetada e cleanup apenas dos recursos pertencentes ao runner.

Revalidação executada sobre a baseline 3c4b6d4343aec56c369c625b15d0a0b859cabdce, sem alterações de código Auth, Worker ou migrations; working tree contém somente documentação, integridade do arquivo e configuração de lint documental. Não é evidência de checkout limpo nem manifesto global de release.

| Comando/escopo | Resultado desta rodada |
| --- | --- |
| Vitest direto, shared + auth-runtime-config, maxWorkers=1 | 7 arquivos, 44 testes aprovados |
| test:scripts | 17 testes aprovados; imports puros/browser, runners, isolamento e cleanup |
| docs:check, lint, typecheck | Exit 0; links/catalog/integridade, 34 Markdown e 68 suítes; lint sem warnings |
| unused:check, audit:security, git diff --check | Exit 0; Knip sem achados e npm audit com zero vulnerabilidades |
| check:db | 01/10/2026 16:14:57.685Z–16:17:31.945Z, exit 0; PostgreSQL 17.11; dois resets, 156 assertions pgTAP em cinco arquivos, duas rodadas F02 e duas F03 concorrentes; lint/advisors sem achados, diff vazio; stack próprio parado |

Relatório local derivado daquela auditoria `validation-results/db.json` (não versionado), SHA-256 B0175C1EB0D8C6CAC88A4AA946C4FED900C2705FD6A2669CD6F69C91504893E6, registra SHA baseline e dirty=true. Na rodada documental, CPF/portas eram análise estática; o gate integral não foi repetido nela. O arquivo é sobrescrito por gates novos: o [manifesto suplementar](evidence/pre-f04-prerequisites-local.md) identifica os SHAs, checksums e provas executados após autorização do saneamento. Mantenedor deve validar seu encerramento antes de retomar F04; autorização de fechamento F03 não salta esse gate.

<a id="sources"></a>

## Fontes e limitações

Consultadas em 01/10/2026: [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [getUserById](https://supabase.com/docs/reference/javascript/auth-admin-getuserbyid), [Auth fonte fixada](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/api/admin.go), [PostgREST transactions](https://docs.postgrest.org/en/stable/references/transactions.html), [PostgreSQL 17 isolation](https://www.postgresql.org/docs/17/transaction-iso.html), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Auth hooks](https://supabase.com/docs/guides/auth/auth-hooks) e [changelog](https://supabase.com/changelog). SDK instalado expõe AdminUserAttributes.id; isso não prova versão Auth target.

Changelog Markdown obtido por HTTP porque o navegador de pesquisa recusou content-type text/markdown; índices são orientação de pesquisa, não prova de atualização do runtime local. Major PostgreSQL17 e minor real se consultam no gate. RLS não contém service_role; grants e boundary servidor continuam controles distintos. RPC multi-statement não fornece automaticamente snapshot único; locks/isolamento são específicos da operação.

Nenhuma inspeção de ambiente hospedado, secret real, telefone/CPF real, domínio ou resultado SMS; estimativas de esforço não substituem provas. Auditoria integral arquivada contém recomendações não adotadas literalmente (pooler direto, remoção irrestrita de getUser, CSP sem exceção styles); consultar precedência v1.1 em cada fase.
