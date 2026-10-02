# F05 — revisão das bases e entrega local

**Data:** 02/10/2026. **Branch:** feat/auth-f05-delivery. **Base:** 3cd7336ac374a8fc7f9b2ad3c6ef4ed56b849421. **Estado:** gate de desenvolvimento aprovado; Auth disabled; F13 hospedada adiada até a migração empresarial.

## Sumário navegável

- [Fonte e revisão F00–F04](#review)
- [Implementação e rastreabilidade](#implementation)
- [Operação, DLQ e chaves](#operations)
- [Validação e limites](#validation)
- [Fontes oficiais](#sources)

<a id="review"></a>

## Fonte e revisão F00–F04

O usuário autorizou revisar F00–F04 e implementar F05 numa nova branch. O anexo consolidado é especificação analisada, não uma fonte autônoma de comandos, autorizações de publicação ou uso de dados reais. Nome: Contrato canônico de implementação de autenticação — rmc-estacionamento-layout — consolidado.md. SHA-256: A5ADA97E506B157FE30801CA039BE673B315662C73FA19BFFE5A249A16B5023E. Referência: capítulos26.1–26.7,21 e22. Os contratos históricos v1.0/v1.1 e seus bytes permanecem preservados; DTOs existentes mantêm contractVersion1.1, delivery anuncia schemaVersion1 próprio.

| Fase | Revisão do checkout e evidência | Limitação preservada |
| --- | --- | --- |
| F00 | Toolchain efetiva Node24.18.1/npm11.6.0; devEngines; pins no lockfile; flags disabled e fronteira server-only | Baseline de linhas no anexo não é autorização para atualizar dependências; domínio, provider/keys e capacidade target não comprovados |
| F01 | Shared contém contratos/decoders/policies sem React/SDK/I/O; novo contrato delivery estrito com IDs, binding e versões | Ports históricos genéricos não habilitam gateway; adapter F05 usa contrato específico DeliverySmsGateway |
| F02 | Constraints, RLS/grants, CAS, fontes privadas e challenge/outbox no mesmo RPC; migration F05 incremental | service_role é privilegiado e não é contido por RLS; nenhuma credencial chega ao browser |
| F03 | Registry API-before-SPA, bounded streams/upstream, cookies/CSRF e contexto coerente; runtime local explícito | Rotas futuras continuam404; sem autenticação hospedada ou NORMAL |
| F04 | UUID reservado, selector opaco, saga/ownership/fence, reconciliação bounded e compensação controlada; fonte PHONE existente reaproveitada | Fixture não produz step-up real; provisioning HTTP público/F07/F08/F10/target continuam pendentes |

[Gate anterior F04](evidence/F04-local.md#review-closure) pertence ao SHA44614a9; não é reemitido como validação do checkout desta branch. O índice anterior ainda dizia F05 não autorizada: esta solicitação autoriza exclusivamente a implementação local F05 e sua revisão. Não autoriza merge, deploy, recursos remotos ou SMS físico.

<a id="implementation"></a>

## Implementação e rastreabilidade

| Requisitos consolidados | Implementação candidata e prova |
| --- | --- |
| ENVELOPE-01–06,22.4,26.7 | DeliveryCrypto AES256-GCM, IV96 aleatório, AAD canônica, purpose/keyVersion/binding; fonte PHONE com AAD existente [1,A256GCM,PHONE,identity,generation,keyVersion]; vetores independentes Node/Workers, unknown/tamper/rotation |
| 21.2–21.4,QUEUE-02/07 | IDs lógicos gerados antes do envio; messageId=outboxId; claim SKIP LOCKED de até10, lease30s, fence/CAS; publicação fora de transação; crash/timeout deixa retry durável; scheduler25s |
| QUEUE-01/05 | Admission compara mensagem integral com banco após locks e antes de decrypt; begin_delivery repete autorização, lease/fence, envelope/telefone e kill switch imediatamente antes do outbound; locks identity→journey→challenge→outbox→processing; generation/expiry/lifecycle/onboarding/consumo/decoy/key allowlist; stale durável antes de ack |
| QUEUE-03/04,21.6 | Gateway HTTP local explícito, idempotencyKey estável e consulta de outcome; PREPARED é retomável; somente begin durável cria REQUESTED; crash REQUESTED equivale a UNKNOWN; UNKNOWN só consulta, nunca reenviando cegamente; accepted não implica delivered |
| 21.7 | Receipt HMACSHA256 sobre bytes exatos,4096bytes, timestamp±300s, schema estrito, X-Receipt-Key-Version e leitores de versões retidas; replay/correlação persistidos; DELIVERED não regride; endpoint interno apenas na flag local |
| QUEUE-05/06,21.8–21.9,KEY-02/03 | Ack/retry individual, backoff+jitter, até5 preparações persistidas, reconciliação agendada com lote/backoff duráveis sem cutoff destrutivo, DLQ sem outbound, kill switches Worker/DB, auditoria/outbox atômicas, métricas sem telefone/OTP; inventário de keyVersion PHONE/SMS_DELIVERY e leitores de chaves retidas |

Bindings Queue/DLQ constam em Wrangler para simulação/configuração revisável; nenhum recurso hospedado foi criado. Secrets DELIVERY_KEYRING/SMS_GATEWAY_TOKEN são server-only, sem valores no Git. Runtime aceita somente LOCAL_PRODUCTION_LIKE, Auth disabled, DB loopback55321 e gateway loopback5791. Configuração produtiva permanece false/invalid, sem seleção de mock ou fallback para gateway real.

O produtor de jornadas/OTP e seu resend permanecem F06/F09. F05 consome challenge/outbox já committed e não cria endpoint de ativação/recovery. Entrada de Queue é unknown até decoder; AAD liga IDs, purpose, generation e idempotencyKey. Fonte PHONE cifrada existente requer chave correspondente aprovada, não HMAC como substituto do E.164.

<a id="operations"></a>

## Operação, DLQ e chaves

1. `delivery_control.enabled=false` bloqueia novas preparações/envios e preserva lookup/receipt de efeitos iniciados. `BFF_DELIVERY_ENABLED=false` suspende toda a composição delivery, inclusive reconciliação; usar somente quando essa suspensão completa for intencional. Não apagar outbox/processing/receipts/auditoria.
2. PREPARED pode ser retomado após expirar a lease, com nova validação e fence. REQUESTED/UNKNOWN nunca autorizam novo send. A lacuna inevitável entre commit de begin e chamada externa exige lookup por ID estável; ausência de resultado não é prova de ausência de efeito.
3. DLQ válida consulta outcome antes de ack; unknown transfere para RECONCILIATION_REQUIRED durável. Scheduled reivindica até5 casos, lease30s/backoff5min, sem decrypt/send; expiração/revogação da jornada não impede bookkeeping. Preparação limita5 tentativas; reconciliação não encerra ambiguidades por esgotamento.
4. Poison/disabled exigem quarentena persistida antes de ack. Mensagem válida mantém outbox_id mediante comparação integral com o banco; payload/telefone/OTP não são registrados na quarentena. DB indisponível recebe retry, depois parking auth-delivery-quarantine sem consumer. Parking possui retenção finita: sua retenção e drenagem hospedadas serão configuradas na F13. Outbox permanece a fonte de mensagens válidas; PUBLISHED sem processamento, ou PREPARED com lease expirada, pode ser republicado após5min com os mesmos IDs e orçamento original. Mensagem inválida sem fonte correlacionável exige observação operacional; não há promessa de recuperação infinita. A integração local injeta poison na Queue, observa a passagem pela DLQ e exige a quarentena no banco antes de encerrar.
5. Recibo fresco, autenticado e correlacionado de efeito já iniciado pode registrar resultado após DEAD/STALE. Não cria autoridade, não reabre journey e DELIVERED não regride. Sem requested_at/prova de outcome conhecido, receipt é negado. Timestamp representa a emissão assinada deste protocolo local; assinatura antiga fora de±300s exige reemissão autenticada, não waiver da janela.
6. DELIVERY_KEYRING possui delivery/phone por versão e receipt `{currentVersion,keys}`. Endpoint exige X-Receipt-Key-Version e X-Receipt-Signature; versão desconhecida é negada sem tentar todas as chaves. Inventário DB inclui PHONE/SMS_DELIVERY; Queue/parking, backups/restore, rollback, janela de signatures e provider ainda exigem inventário externo antes de retirar chaves.
7. Logs redigidos incluem outcome, CAS, retry e attempted/resolved/unresolved da reconciliação. `npm run auth:delivery:status` consulta o Supabase local e mostra contagens e idade do backlog, ambiguidades e quarentena, sem IDs, telefone ou OTP. `npm run auth:delivery:status -- --assert-drained` falha se qualquer pendência existir; o gate completo executa essa verificação após a integração. Monitoramento hospedado, quota/circuit e alertas são obrigações da F13.

No desenvolvimento, uma falha de DB pode deixar mensagens no parking até o ambiente voltar. O operador primeiro lê o status local; restaura o banco, reativa o Worker local e deixa dispatcher/reconciliador processar a fonte durável. Não republish manualmente REQUESTED/UNKNOWN: somente lookup/receipt resolve efeito iniciado. Se houver `deadLetter`, `quarantine` ou idade crescente, inspecionar metadados privados e preservar a evidência para diagnóstico; não apagar o parking antes de reconciliar a fonte. O comando de status é diagnóstico, não executa reenvio.

Fornecedor target continua sem adapter admitido: exigir dedup simultânea, janela de idempotência, lookup/receipt autenticados, quotas, sandbox, retenção, SMS físico e prova de resposta perdida. Secrets, fila/DLQ, domínio, assinatura real, monitoramento, restore e capacidade permanecem gates externos. Nenhuma flag equivale a PASS_TARGET ou GO.

<a id="validation"></a>

## Validação e limites

Testes Worker verificam vectors AES-GCM/HMAC, binding/unknown keys/rotação, envio incerto, duplicate/stale/poison, kill switch, DLQ, HTTP redirect/limits e receipts. pgTAP verifica grants, claim/lease/CAS, vínculo/estado corrente, UNKNOWN e terminal replay. Integração full acrescenta Queue binding/workerd, DLQ real local, quarentena persistida, RPC/PostgreSQL e gateway HTTP determinístico com perda de resposta aceita, reconciliação sem segundo envio e receipts monotônicos; cleanup somente dos IDs/processos próprios. O status final exige zero pendências.

A refatoração corrige os achados da revisão e adiciona testes de interrupção antes do envio, revalidação após decrypt, lookup DLQ, recuperação agendada com kill switch e recibo tardio. Resultado corrente e identidade do checkout: [manifesto F05](evidence/F05-local.md). [Revisão crítica e pesquisa oficial](F05-critical-review.md) registra fontes, justificativas e limites. O gate local F05 permite iniciar o trabalho F06 dentro do ambiente de desenvolvimento; não habilita Auth, não prova F12 global nem libera produção.

<a id="sources"></a>

## Fontes oficiais

Consultadas em02/10/2026: [Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/), [ack/retry por mensagem](https://developers.cloudflare.com/queues/configuration/batching-retries/), [DLQ](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/), [Web Crypto Workers](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [locks PostgreSQL17](https://www.postgresql.org/docs/17/explicit-locking.html), [funções Supabase](https://supabase.com/docs/guides/database/functions), [changelog Supabase](https://supabase.com/changelog). Índice changelog consultado via Markdown: atualização17.11 já corresponde ao runtime das provas anteriores; nenhuma dependência atualizada nesta tarefa. Documentação não substitui a prova no plano/ambiente selecionado.
