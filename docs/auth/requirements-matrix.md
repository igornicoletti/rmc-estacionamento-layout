# Matriz viva de requisitos Auth

## Convenções

- `planned`: contrato aceito, ainda sem implementação.
- `implemented`: código existe, mas o gate da fase ainda não foi concluído.
- `verified-local`: gate específico da fase comprovado localmente; não significa `PASS_LOCAL` global.
- `pass-local`, `pass-target` e `go`: somente F12, F13 e F14 podem atribuir esses estados.
- `blocked`: dependência externa ou evidência material ausente mantém o fluxo fechado.

| Requisito ou conjunto | Fase | Implementação | Testes mínimos | Evidência | Status |
| --- | --- | --- | --- | --- | --- |
| D01–D18, SEC-01–20, baseline e feature stage | F00 | registro, configuração pública fail-closed e toolchain pinada | flag inválida, candidate sem upstream e checks do projeto | merge `b10043a`; PR #28 com CI não iniciada por billing | verified-local |
| Estados, DTOs, schemas, erros, clocks e portas | F01 | `src/shared/auth` | T03, T10, T21, T31 e malformed/unknown | `evidence/F01-local.md`; `f57c291` | verified-local |
| Catálogo fechado de capabilities e reconhecimento puro | F01 | `src/shared/authorization` | capability desconhecida e imports proibidos | `evidence/F01-local.md`; `f57c291` | verified-local |
| Hierarquia, scope, target e enforcement BFF | F10 | evaluator puro e enforcement BFF | T22–T27 | identidade ERP não comprovada | blocked |
| Identidade, sessões, jornadas, assignments e invariantes | F02 | migrations, constraints, grants/RLS e RPCs | T24–T29, pgTAP e rebuild | pendente | planned |
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

Atualizar esta matriz no mesmo PR que altera implementação ou evidência. Um teste contado sem vínculo ao requisito não muda status.
