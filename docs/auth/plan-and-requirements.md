# Plano e requisitos Auth

**Natureza:** referência vigente. **Escopo:** F00–F14.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Regra de execução](#c1)
- [Sequência](#c2)
- [Decisões congeladas](#c3)
- [Manutenção e drift](#c4)
- [Matriz viva](#c5)

<a id="c1"></a>

## Regra de execução

O Contrato canônico de autenticação, sessão, autorização e acesso v1.0 é a fonte normativa. Cada fase F01–F14 usa branch e PR próprios, atualiza a matriz de requisitos e produz evidência vinculada ao SHA testado. Uma fase não transforma automaticamente a seguinte em autorizada.

Auth permanece desabilitado até que o gate da fase responsável esteja comprovado. `candidate` e `validated` são estágios do fluxo; `LOCAL`, `LOCAL_PRODUCTION_LIKE`, `STAGING/TARGET_HOSTED` e `PRODUCTION` são ambientes; `PASS_LOCAL` e `PASS_TARGET` são resultados de evidência.

<a id="c2"></a>

## Sequência

| Fase | Entrega principal | Gate de saída |
| --- | --- | --- |
| F01 | Estados, DTOs, schemas, policies, errors, clocks e portas puros | Contraprovas de malformed/unknown e nenhuma dependência de UI/SDK/I/O |
| F02 | Migrations, grants/RLS, RPCs, constraints, ledger, outbox e leases | Banco reconstruído; pgTAP, advisors e concorrência aprovados |
| F03 | Worker/BFF same-origin, transporte, cookies, CSRF, headers e Problem Details | Testes no runtime Worker e dry-run sem rotas permissivas |
| F04 | Provisioning, saga Auth–DB, ownership e reconciliação | Falhas parciais não criam autoridade NORMAL |
| F05 | Outbox, Queue, consumer, DLQ e porta SMS | Duplicidade/stale/perda de resposta sem efeito indevido |
| F06 | Ativação, BOOTSTRAP, senha e promoção | Interrupções preservam autoridade restrita |
| F07 | Login, MFA_PENDING, TOTP e fresh step-up | Fator existente e binding nunca são ignorados |
| F08 | Sessão NORMAL, refresh distribuído, idle, abas e logout | Concorrência, fence e resultado indeterminado comprovados |
| F09 | Recovery e mudança de senha | Recovery não concede NORMAL nem remove MFA |
| F10 | Autorização, hierarquia, scope e Units | Capability/target/unidade revalidados no servidor e no commit |
| F11 | Controller, middleware/router, forms, feedback e cache contextual | Deep links, cancelamento, a11y e resposta tardia integrados |
| F12 | Matriz local T01–T38 e capacidade/fault injection | Manifesto `PASS_LOCAL` do SHA corrente |
| F13 | HTTPS, provider, SMS, Queue/DLQ, jobs, secrets e observabilidade | Manifesto `PASS_TARGET` das propriedades hospedadas |
| F14 | Rollout, rollback, alertas e runbooks | GO explícito do responsável; nunca inferido de `validated` |

<a id="c3"></a>

## Decisões congeladas

- SPA React Router em Data Mode; BFF próprio no Cloudflare Worker.
- Browser usa somente HTTP same-origin e nunca recebe tokens Supabase.
- Persistência por tabelas privadas e RPCs estreitas acessíveis apenas pelo BFF; sem Hyperdrive no release inicial.
- `@supabase/supabase-js` será usado somente no servidor, request-scoped, sem persistência ou auto-refresh independente.
- Cloudflare Queue é at-least-once; generation e idempotency key são persistentes.
- `shared/auth` e `shared/authorization` não importam React, Worker, SDK ou I/O.
- O contrato normativo resume as fronteiras F01 em Auth/DB/SMS. O plano mestre amplia deliberadamente os contratos puros com `CryptoProvider`, `QueuePublisher` e `AuditSink` para impedir acoplamento futuro; nesta fase isso não inclui adapters, I/O ou prova operacional de F03–F10.
- IDs internos, contextuais, de comando e de challenge seguem o ADR-001 (UUID v4 opaco). Chaves externas de Units permanecem texto opaco associado ao sistema de origem; segredos aleatórios não são IDs.
- `components/ui` contém primitives shadcn/Base UI; `components/app` contém apenas composições com contrato compartilhado.
- Gateway SMS, domínio final, projeto/plano Supabase e identidade ERP de Units são gates externos. Ausência de prova mantém o fluxo dependente desabilitado.

<a id="c4"></a>

## Manutenção e drift

No início de cada fase, revisar documentação e changelogs oficiais aplicáveis e registrar a consulta na evidência. Mudança material de requisito exige versão, justificativa, impacto, testes e supersessão explícita; código não modifica o contrato silenciosamente.

Billing ou runner indisponível é limitação externa. Não equivale a CI verde e exige waiver explícito do responsável para merge quando o check obrigatório não iniciar.

F00/F01 foram validadas antes de F02; F02 foi integrada no PR #34. A manutenção pré-F03 não inicia nem autoriza F03; nova fase exige validação explícita.

<a id="c5"></a>

## Matriz viva

### Convenções

- `planned`: contrato aceito, ainda sem implementação.
- `implemented`: código existe, mas o gate da fase ainda não foi concluído no SHA corrente.
- `verified-local`: gate específico da fase comprovado localmente; não significa `PASS_LOCAL` global.
- `pass-local`, `pass-target` e `go`: somente F12, F13 e F14 podem atribuir esses estados.
- `blocked`: dependência externa ou evidência material ausente mantém o fluxo fechado.

| Requisito ou conjunto | Fase | Implementação | Testes mínimos | Evidência | Status |
| --- | --- | --- | --- | --- | --- |
| D01–D18, SEC-01–20, baseline e feature stage | F00 | registro, configuração pública fail-closed e toolchain pinada | flag inválida, candidate sem upstream e checks do projeto | `evidence/F00-local.md`; baseline `b10043a`; reauditoria `e1125b0` | verified-local |
| Estados, DTOs, schemas, erros, clocks e portas | F01 | `src/shared/auth`; schemas estritos; transições runtime totais; scope público; portas Auth/DB/SMS e ampliação deliberada Crypto/Queue/Audit somente como contratos puros | T03, parcelas puras de T10/T21/T31, malformed/unknown e fatos ausentes | `evidence/F01-local.md`; SHA testado `e1125b0ee90bff810a6365f284581d4e6477332c` | verified-local |
| Catálogo fechado de capabilities e reconhecimento puro | F01 | `src/shared/authorization`; capability desconhecida falha fechado; imports diretos e prefixados | capability desconhecida e imports proibidos | `evidence/F01-local.md`; SHA testado `e1125b0ee90bff810a6365f284581d4e6477332c` | verified-local |
| Hierarquia, scope, target e evaluator/enforcement completo | F10 | evaluator puro e enforcement BFF | T22–T27 | identidade ERP não comprovada | blocked |
| Identidade, sessões, jornadas, assignments e invariantes | F02 | schemas privados; migrations; perfil ADR-002; grants mínimos; estado/binding/fence; RPCs invoker para claim, CAS, lease e challenge/outbox atômicos | contraprovas de persistência; cardinalidade/histórico T25; override T26; banco/roles T27; commit/rollback T28 e binding T29; T24 autoritativo fica F04/F10 | `evidence/F02-reaudit-local.md`; SHA testado `bc8ab3c968ecf0e91c90d4c21934a3f70500d647`; 126 assertions e duas rodadas concorrentes | verified-local |
| HTTP, body, cookies, CSRF, headers e erros | F03 | Worker/BFF e transporte same-origin | T02, T03, T18, T21, T35 | pendente | planned |
| Provisioning e saga Auth–DB | F04 | ledger, adapter Auth e reconciler | T04, T24, falhas parciais | pendente | planned |
| Outbox, Queue, SMS e DLQ | F05 | dispatcher, consumer e adapter de gateway | T28–T30 | gateway não selecionado | blocked |
| Ativação e senha inicial | F06 | challenge, BOOTSTRAP e promoção | T01, T04, T11, T31 | pendente | planned |
| Login, TOTP e step-up | F07 | MFA_PENDING, enrollment e binding | T08–T10 | pendente | planned |
| Sessão, refresh, idle, abas e logout | F08 | NORMAL, lease, fence e reconciliação | T05–T07, T14–T17, T32 | pendente | planned |
| Recovery e mudança de senha | F09 | RECOVERY, fence e runbook MFA | T12, T13, T31 | pendente | planned |
| Units e operações unit-scoped | F10 | source adapter, assignment e scope | T22–T27 | identidade ERP não comprovada | blocked |
| Runtime frontend, rotas, forms e cache | F11 | controller, middleware, adapters e UI | T04, T05, T07, T17, T19–T21, T32–T34, T37 | pendente | planned |
| Prova local completa | F12 | manifesto e artefatos locais | T01–T38 | pendente | planned |
| Prova hospedada | F13 | staging isolado e probes target | T30, T35, T36 e E2E target | domínio/provider/SMS pendentes | blocked |
| GO operacional | F14 | rollout, rollback, alertas e runbooks | exercício operacional | depende de F12 e F13 | blocked |

A política de acesso existente em `src/features/auth` continua sendo scaffold de UX do layout; ela não é o evaluator autoritativo de F10. Fresh step-up não é modelado como flag global dessa policy: a prova final permanece vinculada à sessão e à intenção no servidor.

A F01 e a F02 estão `verified-local` nos SHAs explicitamente registrados. A evidência anterior da F02 foi supersedida após a reauditoria. A F03 continua bloqueada até nova validação explícita do responsável. Isso não antecipa F12, não converte a branch em `PASS_LOCAL` global e não substitui provas de Worker, provider, staging ou target.

Atualizar esta matriz no mesmo PR que altera implementação ou evidência. Um teste contado sem vínculo ao requisito não muda status, e evidência de outro SHA não é transportada por inferência.
