# F04 — evidências dos marcos e gate integral local

**Natureza:** manifesto local com checkpoints históricos; não release. **Revisão:** 02/10/2026 UTC (01/10 local). **Contrato:** v1.1 sobre v1.0 imutável. **Ambiente:** LOCAL sintético, Auth disabled. **Baseline:** main `844ca20f3a01fb4f69d0c4a05bff9420e25b57a0`. **SHA final testado:** `44614a9291aa9e9199449aca2003e303fc2b9cea`. **Status:** verified-local controlado; correções e fechamento autorizados pelo responsável no PR44, com waiver específico de billing. Não PASS_LOCAL/PASS_TARGET/GO. SHAs anteriores e seus resultados permanecem históricos nas respectivas seções.

## Sumário navegável

- [Escopo e implementação](#scope)
- [Comandos e resultados](#validation)
- [Integridade e cleanup](#integrity)
- [Tentativas e limitações](#limitations)
- [Pendências da fase](#pending)
- [Checkpoint saga e diagnóstico resolvido](#saga)
- [Gate integral no SHA estável](#stable)
- [Continuação dos controles F04](#controlled)
- [Gate integral final e limites de aceite](#final)
- [Correções da revisão e gate de fechamento](#review-closure)

<a id="scope"></a>

## Escopo e implementação

Esta seção e seus resultados descrevem o primeiro marco histórico. A composição real Worker/RPC/provider e a revalidação posterior estão registradas em [gate integral](#stable), sem reatribuir provas históricas ao novo SHA.

[Plano F04](../F04-preparation.md#implementation), [pesquisa oficial](../research.md#c7) e [matriz](../plan-and-requirements.md#c5). PR41/42 integrados por autorização expressa; branches antigas removidas local/remoto, main 0/0. Waivers de billing específicos registrados nos dois PRs; não houve CI verde nem recursos remotos.

- Adapter Workers create/read request-scoped: local API fixa, admission obrigatória de reserva/lease/fence pela futura composição persistida, DTO/prova validados, app_metadata privada, UUID reservado e seletor sintético. Credencial interna aleatória não devolvida/persistida/comunicada. Timeout/abort/body limitado/redirect negado; falha de create é UNKNOWN, sem retry. Sem DELETE, entrypoint ou Env novos.
- PoC independente Node com SDK2.117.2 e Auth v2.197.0 real local. Reserva DB antecede criação; leitura direta prova UUID/ownership; confirmação e commit usam RPCs existentes, mantendo lifecycle PENDING/onboarding ACTIVATION_REQUIRED e um audit durável. CPF sintético passa ao banco somente como envelope AES-GCM/lookup HMAC; não há senha/OTP/token/CPF plaintext em SQL.
- Cleanup reconsulta ownership e exige zero sessões antes de remover somente o provider sintético. Confirma 404/user_not_found, limpa IDs DB exatos e verifica zero resíduos. Cancelamento preserva cleanup bounded e remove listeners; stack preexistente é recusado.

Parcelas T39/T40/T61 e fronteira provisioning de T24/T28/T49; não são os testes globais completos. PoC Node não comprova composição do adapter Workers com DB/provider real ou saga distribuída.

<a id="validation"></a>

## Comandos e resultados

| Comando | SHA / resultado |
| --- | --- |
| `npm run check` | 27f9639c28a8bdefc81a5b9cc21db74a98ecb271; dirty=false; 19:14:15.202Z–19:16:27.287Z; exit0; diff/lint/types/docs, 19 scripts, 56 arquivos/250 testes aplicação |
| `npm run check:worker` | Mesmo SHA27f9639; exit0; generated types atuais, typecheck, quatro arquivos/29 runtime tests e deploy dry-run sem publicação |
| `npm run lint`, `docs:check`, `test:scripts`, `unused:check`, `audit:security` | SHAa824b898; exit0; 20 testes scripts, inventário73 suítes, sem warnings/unused/vulnerabilidades. Repetição proporcional após alteração exclusiva de runner/cancelamento/teste e catálogo |
| `npm run test:provider:local` | SHAa824b898; dirty=false; 19:20:19.029Z–19:23:20.199Z; exit0; dois resets, seis arquivos/214 pgTAP, duas rodadas F02/F03/pré-F04 concorrentes cada; lint/advisors sem achados e diff schema vazio; PoC provider+commit/audit+cleanup reais |

Entre SHA27f9639 e SHAa824b898, src/Worker runtime/tests runtime permaneceram idênticos; só runner Node, teste de cancelamento e catálogo mudaram. Não reatribuir os 250 testes ou check:worker ao SHA posterior. Horários individuais dos checks avulsos/Worker não foram capturados em manifesto; checkpoint parcial, coleta integral obrigatória ao encerrar F04. Não repetidos coverage/build/E2E/HTTPS após início desta fase; gates integrais anteriores permanecem históricos.

Versões: Node24.18.1/npm11.6.0, Supabase CLI2.119.0, SDK2.117.2, PostgreSQL17.11, Wrangler4.145.0, Workers plugin1.3.4/Vitest4.1.11, appVitest5.0.3. Sem atualização de dependências/lockfile, migration ou regra normativa nesta rodada.

<a id="integrity"></a>

## Integridade e cleanup

- Auth image fixada e conferida: public.ecr.aws/supabase/gotrue:v2.197.0, digest `sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b`; fonte tag em commit `4eee58f296d9698a1c2c0ae14d7a0b379c7622d3`.
- Relatório derivado não versionado `validation-results/provider-poc.json`: SHA-256 `173CFA963EFFEF642B6DEE3CCEA44FDD6ED3C37BB6AE870B6B7FA6FD44B81811`. Registra SHA, dirty, horários, etapas, exits, runtime e cleanupConfirmed.
- Relatório quick histórico desta rodada `validation-results/quick.json`: SHA-256 `35A8759CFCFA67D2767DB55911F03BC808410F3C0DE69EEAD838EF749CEB450B`. Os runners podem sobrescrever esses artefatos; este manifesto preserva sua identificação.
- Hashes v1.0 `74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148` e dossiê v2.0 `C1204398809DC124314A07434A82DA532E237B359B8AA79A273303D0B4D3EA39` novamente conferidos, sem alteração.
- Provider sintético comprovadamente ausente; fixtures exatas removidas; nenhum container do projeto permaneceu ativo. Outros stacks não foram encerrados. Nada foi implantado ou alterado remotamente; nenhum dado de usuário, SMS/Queue/domínio/secrets real foi usado.

<a id="limitations"></a>

## Tentativas e limitações

Tentativas diagnósticas em checkout dirty não são aprovação: flag Auth --version não suportada (subcomando version correto); chamada commit no runner sem requestId/ambiente exigidos pela RPC. Corrigidos runner/contraprovas, não migration histórica ou critérios. Todos os stacks próprios foram parados; usuários sintéticos criados nas tentativas foram removidos apenas após comprovação de ownership e ausência de sessões.

Teste inicial de ausência mostrou que SDK interpreta code conforme X-Supabase-Api-Version; transporte agora preserva esse header e nega ausência sem prova exata. Testes de runner respeitam retorno de erro do SDK, não presumem throw. Sem aumento de timeouts/retries ou enfraquecimento de thresholds.

Auth permanece disabled; domínio auth.rmc.invalid é somente fixture. Email técnico confirmado não confirma telefone e não autoriza NORMAL. Ausência de sessão é provada somente para os recursos desta PoC; não existe revogação operacional implementada. Teste de cancelamento é contraprova determinística do runner, não fault injection target nem garantia de cleanup após SIGKILL/falha do host.

<a id="pending"></a>

## Pendências da fase

Continuação após SHA0bf36d715998c251e013f7b7771ff76faeabdeac, checkout dirty: saga controlada e store RPC implementados, sem entrypoint/Env produtivos. Dispatch único persistido por comando via migration incremental; autorização de reserva não substitui capability/scope/AAL. GET404 após outcome desconhecido não aborta nem permite repetição cega. Transporte RPC compartilhado com contexto F03, allowlists separadas. [ADR-006](../decisions.md#c7).

Diagnóstico parcial: seis arquivos/41 testes Worker passaram incluindo contraprova de owner; lint, tipos Worker, Knip e docs (76 suítes) passaram. Não são evidência vinculada a novo SHA limpo. Gate DB falhou no reset; repetição falhou em startup, classificado como timeout pela inspeção capturada, sem imprimir secrets. Cleanup do runner confirmou stop do projeto local; outro stack rmc-estacionamento não foi alterado. Nova migration/pgTAP e disputa de dispatch ainda não comprovados; não declarar 226 assertions aprovadas por inferência.

Integração real Workers/RPC/provider, reconciliação persistida com retries/backoff bounded, compensação/revogação segura e day-zero controlado continuam pendentes. Faltam crash/perda de resposta em cada fronteira, autorização ator/alvo/scope no commit e gate integral no SHA final da fase. Units reais não comprovadas mantêm provisioning M/O fechado. PR de aceite F04 somente ao concluir esses marcos; merge/F05 exigem nova autorização do responsável.

Regressão desta continuação: `npm run check` terminou exit1 por dois timeouts de 5 s em testes existentes de Clients/Data Table (248/250 passaram). Repetição `npm run test:serial`, sem alterar timeout/assertions, terminou exit0: 56 arquivos/250 testes. Serial não transforma a tentativa quick em aprovação; cobertura/build/E2E/HTTPS e novo gate completo da fase ainda pendentes. Gate DB repetido por solicitação do responsável após relato de perda de conexão; causa do timeout anterior não comprovada.

Nova repetição de `npm run check:db` também terminou exit1 em `db:start`, antes de resets/pgTAP/concorrências. `db:stop` terminou exit0 e consulta Docker confirmou ausência de containers do projeto layout. Portanto, conexão perdida não foi comprovada como causa exclusiva; novo SQL permanece não validado, sem ajuste de timeout ou interferência no outro stack.

<a id="saga"></a>

## Checkpoint saga e diagnóstico resolvido

Continuação em 01/10/2026, após diagnóstico capturado/sanitizado: PostgREST503 e SQLSTATE3F000, schema rmc_auth_api ausente no volume restaurado. Bootstrap PostgreSQL → dois resets → stop com backup → stack completo elimina dependência circular de health/schema. Sem ignore-health-check, aumento de timeout, schema ad hoc ou remoção de volumes/outro projeto. [Decisão](../decisions.md#c7).

Resultados preliminares em checkout dirty sobre HEAD0bf36d7 (não prova do SHA limpo):

| Comando | Resultado |
| --- | --- |
| `check:db` | 23:08:00.665Z–23:11:20.329Z; exit0; oito arquivos/236 pgTAP, dois resets e duas rodadas concorrentes por escopo; lint/advisors/diff/cleanup aprovados |
| `test:provisioning:local` | 23:14:15.931Z–23:17:27.607Z; exit0; mesmo gate DB compartilhado e Worker auxiliar HTTPS8788 real com store/provider/saga; criação normal, perda de resposta após efeito real, lookup-only/replay e audit único; cleanup confirmado |
| lint, tipos app/Worker, Knip, audit e docs | Exit0; zero vulnerabilidades; catálogo78 suítes. Scripts21 e runtime Worker41 aprovados antes das contraprovas finais descritas abaixo |

SQL posterior acrescentou contraprovas de esgotamento/deadline e validação do estado do ledger no claim: repetir gate antes de atribuir nova contagem. Cleanup do runner também passou a reter ledger quando create inconclusivo é seguido de404, sem apagar histórico de ownership por inferência. Prova Node do helper não é teste de crash do host. Cobertura/build/E2E/HTTPS F03 e vínculo ao SHA final ainda em validação.

Auth disabled e nenhuma rota produtiva de provisioning. Budget persistido lookup-only implementado; day-zero, compensação/revogação, circuit breaker, scheduler/batches e autorização operacional continuam pendentes. Isso não encerra F04, não autoriza PR de aceite/merge/F05 e não é PASS_LOCAL global.

<a id="stable"></a>

## Gate integral no SHA estável

`npm run check:full`, SHA completo `67878c0a62fef22ae99c44d9b2a92b015886dc55`, checkout limpo e sem commits/edições durante execução: **23:33:38.191Z–23:45:03.250Z, exit0** em 01/10/2026. Relatório ignorado `validation-results/full.json`, SHA-256 `2058A7D4140EA7A9C12CB135C1638BA97AAC7DBA81D3ED7CCC6F46F076724B76`. Uma execução preliminar passou, mas atravessou commit; não é a prova estável usada aqui.

| Camada | Resultado comprovado |
| --- | --- |
| Qualidade | Diff, lint, tipos, Knip, audit sem vulnerabilidades e docs aprovados; catálogo78 suítes; 21 testes de scripts |
| Aplicação | 56 arquivos/250 testes com cobertura e thresholds preservados; build e 19 testes Chromium |
| Worker | Tipos gerados atuais, typecheck, seis arquivos/41 testes runtime, deploy dry-run sem publicar |
| Banco | PostgreSQL17.11; dois resets; oito arquivos/241 assertions pgTAP; duas rodadas de concorrência F02, contexto F03 e provisioning; lint/advisors sem achados, diff vazio |
| F03 real | HTTPS local, API/SPA/headers, PREAUTH persistido, dez abas concorrentes e cookies Chromium |
| F04 real | 23:44:34.039Z–23:44:58.153Z; Worker auxiliar HTTPS/RPC/provider real; normal e resposta perdida após criação; reconciliação lookup-only, replay sem novo create e associação/audit únicos |
| Cleanup | Fixtures sintéticas próprias removidas após ownership/ausência de sessões; ausência confirmada; processos próprios encerrados; db:stop exit0; nenhum container do projeto ativo |

Toolchain/pins iguais aos registrados no primeiro marco: Node24.18.1/npm11.6.0, CLI2.119.0, SDK2.117.2, Wrangler4.145.0, plugin1.3.4/Vitest Worker4.1.11, Vitest app5.0.3, Zod4.6.5. Contrato/dossiê mantêm os checksums anteriores. IP/URLs e credenciais dos testes são exclusivamente locais; nenhuma integração target ou segredo real.

Escopo implementado naquele SHA: RPCs estreitas, admissão persistida de create, fences/generation, budget de oito claims em24h com backoff, associação transacional e audit. ABORTED após dispatch é negado também no banco; GET404 não prova ausência de efeito em voo. Limite de tentativas não transforma UNKNOWN em falha definitiva. Naquele checkpoint não havia rota produtiva de provisioning, DELETE/revogação operacional, cron ou autorização administrativa completa. Este gate comprova os arquivos presentes, não encerra F04 nem substitui F12/F13. CI hospedado não foi executado; billing histórico não é aprovação ou waiver deste trabalho.

<a id="controlled"></a>

## Continuação dos controles F04

Rodada sobre HEAD e5ebe6afbf4c5022472b675a6800c744a5ed6b1d, checkout dirty, 02/10/2026 UTC (01/10 local): day-zero, provas imutáveis de intenção, compensação operator-only e reconciler scheduled implementados. Nenhum resultado desta seção é prova do SHA limpo final.

| Comando | Resultado efetivamente observado |
| --- | --- |
| check:app | 02:18:57.347Z–02:26:45.324Z, exit0; 57 arquivos/253 testes com cobertura; scripts21; lint/tipos/Knip/audit/docs/build e Chromium19 |
| check:worker | Exit0; tipos gerados, typecheck, sete arquivos/45 testes e deploy dry-run; nenhuma publicação |
| test:provisioning:local | 02:22:01.071Z–02:27:09.152Z, exit0; dois resets; dez arquivos/280 assertions; duas concorrências por escopo, incluindo10 disputas day-zero e batch; lint/advisors/diff; provider real normal, resposta perdida/scheduled, day-zero e compensação sem sessões; cleanup confirmado |

Tentativas anteriores falharam por fixture temporária sem grant e por allowlist SQL de reasons não alinhada ao schema TypeScript. Correções preservaram grants produtivos e rejeição de unknown. Startup diagnóstico passou; interrupção/timeout anterior não comprova internet como causa. Gates inválidos não foram promovidos. Todos os stacks próprios das tentativas foram parados, sem remover outros stacks/volumes.

Depois dessa prova, staging operator-only de PHONE e precondição de fonte para toda intenção administrativa foram acrescentados; requerem nova validação. Producer real de prova de step-up permanece F07; fixtures não autenticam. M/O fechados até ERP/F10. Compensação com sessões existentes é escalonada, não usa ban como revogação JWT. Cron hospedado disabled; sem endpoint Users, SMS, Queue ou recursos remotos. Gate integral/revisão no SHA final ainda pendentes.

<a id="final"></a>

## Gate integral final e limites de aceite

`npm run check:full` sobre **85790bc84f1697ef2fe28c9108eb9f422288d782**, checkout **limpo**, sem commits/edições durante execução: **02/10/2026 02:45:22.657Z–02:56:30.119Z, exit0** (01/10,23:45–23:56 local). Relatório derivado/ignorado `validation-results/full.json`, SHA-256 **8C226A13B52CE7EDDBCDBA883FD8417346918E29163C6ED6669418059E4A5561**. Commit posterior somente documental registra este resultado; não reatribui o SHA testado. Gate anterior no código8e87b5b também passou, mas o último corrige o binding puro de ator/onboarding.

| Camada / comandos do gate | Resultado comprovado |
| --- | --- |
| Diff/qualidade | diff e staged diff sem erros; lint/typecheck/Knip; npm audit zero vulnerabilidades; docs82 suítes; scripts21 aprovados |
| Aplicação | coverage serial:57 arquivos/253 testes; statements87.24%,branches82.43%,functions85.86%,lines88.15%; thresholds preservados; build/budget e Chromium19 aprovados |
| Worker | wrangler types --check, tsc, sete arquivos/45 testes e deploy dry-run aprovados; sem publicação |
| Banco | PostgreSQL17.11; dois resets limpos; dez arquivos/283 assertions; duas rodadas independentes F02/F03/provisioning; lint/advisors sem achados e diff vazio |
| HTTPS F03 | 02:55:36.984Z–02:55:47.371Z,exit0; API/SPA/headers, PREAUTH persistido, dez abas concorrentes e cookies Chromium |
| F04 real local | 02:55:48.315Z–02:56:23.950Z,exit0; normal, perda de resposta com scheduled lookup-only/replay, day-zero primeiro S PENDING e compensação owned sem sessões, com fence/bloqueio/ausência/audit |
| Cleanup | ownership/ausência externa confirmados, fixtures exatas removidas; processos próprios encerrados; db:stop exit0; nenhum container layout ativo. Stack rmc-estacionamento preservado |

Versões: Node24.18.1/npm11.6.0, CLI2.119.0, SDK2.117.2, PostgreSQL17.11, Auth v2.197.0/digest1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b; Wrangler4.145.0, Workers plugin1.3.4/Vitest4.1.11, app Vitest5.0.3/Zod4.6.5. Configuração: LOCAL_PRODUCTION_LIKE/Auth disabled; APIs loopback55321, Worker auxiliar HTTPS8788; flags hosted BFF_CONTEXT_ENABLED/BFF_PROVISIONING_ENABLED false. Chaves sintéticas/efêmeras não registradas. Avisos de secrets ausentes no dry-run não são prova de configuração target.

Contraprovas presentes: malformed/unknown/ownership alheio; ausência explícita versus timeout; intenção/ator/session/generation/onboarding; consumo único; revogação permite somente lookup vinculado, nunca create/commit; CPF rotação/dual-write/rollback; fence stale; dez concorrentes first-S/batch/dispatch; budget/deadline/circuit; audit failure desfaz associação/ledger; resposta de create perdida, replay sem duplicação; cancelamento/deadline/transportes bounded e cleanup. São provas locais das parcelas T04/T24/T28/T29/T39/T40/T49/T61, não conclusão global dessas jornadas nem fault injection de SIGKILL/falha do host/target.

Escopo F04 controlado concluído para revisão: saga/provider/RPC, day-zero, fontes CPF/PHONE privadas, intenção autorizada persistida, reconciliação agendada/bounded, compensação sem sessões e auditoria durável. Não existe endpoint Users ou Auth operacional. BFF não fabrica prova verificada; produtor real é F07. M/O negados até ERP/F10; ban não revoga JWT, sessões existentes/ownership ambíguo exigem escalonamento e protocolo F08. Codec/decrypt/entrega SMS permanecem F05; domínio/secrets/cron hospedado/capacidade/restore e provider target são F13. Nenhuma dependência futura foi simulada como sucesso ou abriu fluxo restrito.

Contrato/dossiê mantêm os checksums registrados acima; migrations antigas preservadas, sem dados reais, migration remota, deploy ou SMS/Queue. CI hospedado não integra essa prova local; billing histórico não é resultado positivo nem waiver para este PR. Merge, sincronização/limpeza e F05 dependem de autorização expressa após revisão. Ausência de pendência crítica no escopo local não é aprovação de produção.

<a id="review-closure"></a>

## Correções da revisão e gate de fechamento

Esta rodada supersede o gate anterior como prova corrente, preservando seus resultados históricos. O responsável autorizou expressamente correções, merge, sincronização e limpeza, dispensando CI bloqueada por billing **neste PR44**. Isso não autoriza F05, deploy ou release.

| Achado confirmado | Correção e contraprova |
| --- | --- |
| Ciclos vazios zeravam o circuito durante backoff | healthy=NULL libera lease sem apagar failures/open_until. Duas pausas vazias intercaladas entre três falhas provam abertura; assertion Worker verifica NULL no RPC |
| Ownership conflitante só retornava CONFLICT | Escalonamento OWNERSHIP_CONFLICT e audit/outbox atômicos antes do retorno, com owner/fence/binding/lease; replay único, exclusão do batch e rollback por falha audit. Persistência negada/indisponível retorna PENDING, sem efeito provider |
| Nomes legados expostos contornavam fresh proof | Primitives movidas para schema privado; nomes antigos delegam wrappers autorizados. Contraprovas service_role negam dispatch/commit sem prova, sem associação. Testes de mecanismo usam explicitamente schema privado, não simulam autorização |

Migration incremental `20261002032330_auth_f04_review_hardening.sql`; nenhuma migration histórica ou contrato integral alterado. Skills Supabase/Postgres/Workers orientaram grants mínimos, locks ordenados e isolamento de runtime; referências oficiais registradas na pesquisa. Nenhum grant de leitura ampliado para fixtures.

Validação focada: três arquivos Worker/18 testes, typecheck e SQL afetado. A nova contraprova inicialmente tentou inspecionar audit_outbox sob service_role sem SELECT; corrigida somente a inspeção da fixture como postgres. Primeira tentativa integral parou no lint das assertions novas, antes das suítes; mocks tipados corrigidos, lint/typecheck focados aprovados. Não houve relaxamento de timeout, retries, thresholds ou grants produtivos.

Gate de fechamento: `npm run check:full`, **44614a9291aa9e9199449aca2003e303fc2b9cea**, checkout **limpo**, sem edições/commits durante execução, **2026-10-02T03:40:39.394Z–03:52:40.047Z, exit0**. Relatório derivado ignorado `validation-results/full.json`, SHA-256 **216F56CA6903D29DB91581CE127B5466199E3030A8F3252B9F0C153C6BBA132A**. Commit posterior exclusivamente documental não muda o SHA testado.

| Parcela | Resultado efetivamente comprovado |
| --- | --- |
| Qualidade | diff/cached diff, lint, tipos, Knip, audit zero vulnerabilidades, docs83 suítes e scripts21: exit0 |
| Aplicação | 57 arquivos/253 testes serial com cobertura87.24/82.43/85.86/88.15%; thresholds preservados; build/budget e Chromium19 aprovados |
| Worker | tipos gerados, tsc, sete arquivos/47 testes, dry-run: exit0, sem publicação |
| Banco | PostgreSQL17.11; dois resets; 11 arquivos/306 assertions; duas rodadas por escopo F02/F03/provisioning; lint/advisors sem achados e diff vazio |
| HTTPS F03 | 03:51:47.054Z–03:51:56.220Z, exit0; API/SPA, contexto persistido, dez abas e cookies reais Chromium |
| F04 real local | 03:51:57.390Z–03:52:34.930Z, exit0; normal, resposta perdida/scheduled lookup-only, day-zero e compensação owned sem sessões; replay/audit/ownership/ausência confirmados |
| Cleanup | fixtures e provider sintéticos exatos removidos; processos próprios encerrados; db:stop exit0, nenhum container layout ativo; stack rmc-estacionamento preservado |

Versões/configuração permanecem as do gate anterior, reconferidas pelo relatório/runtime: Node24.18.1/npm11.6.0, CLI2.119.0/SDK2.117.2, Authv2.197.0 com mesmo digest, Wrangler4.145.0/plugin1.3.4/WorkerVitest4.1.11/appVitest5.0.3/Zod4.6.5. LOCAL_PRODUCTION_LIKE explícito, URLs loopback, Auth disabled, flags hosted false e chaves efêmeras não registradas. Contrato/dossiê preservam checksums. Limitações F07/F08/F10/F13 anteriores permanecem; não é prova global T01–T61, PASS_LOCAL ou capacidade target.

CI PR44 antes desta rodada: run36958263205, jobs110686001925/110686001817 falharam **sem steps** por bloqueio de billing; Supabase Preview skipped. O waiver atual é explícito e específico, não CI verde nem waiver transferível. PRs Dependabot36/37/38/39/43 são encerrados sem incorporar atualizações nesta limpeza; versões/pins não mudam. Seus históricos continuam recuperáveis pelo GitHub/Git. F05 permanece fechada.
