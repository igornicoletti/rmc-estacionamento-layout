# Matriz viva de requisitos Auth

## Convenções

- `planned`: contrato aceito, ainda sem implementação.
- `implemented`: código existe, mas o gate da fase ainda não foi concluído no SHA corrente.
- `verified-local`: gate específico da fase comprovado localmente; não significa `PASS_LOCAL` global.
- `pass-local`, `pass-target` e `go`: somente F12, F13 e F14 podem atribuir esses estados.
- `blocked`: dependência externa ou evidência material ausente mantém o fluxo fechado.

| Requisito ou conjunto | Fase | Implementação | Testes mínimos | Evidência | Status |
| --- | --- | --- | --- | --- | --- |
| D01–D18, SEC-01–20, baseline e feature stage | F00 | registro, configuração pública fail-closed e toolchain pinada | flag inválida, candidate sem upstream e checks do projeto | merge `b10043a`; PR #28 com CI não iniciada por billing | verified-local |
| Estados, DTOs, schemas, erros, clocks e portas | F01 | `src/shared/auth`; restricted step fechado por jornada; política central versionada; portas F01 limitadas a Auth/DB/SMS + clock; freshness rejeita AAL desconhecido em runtime | T03, parcela pura de T10/T21/T31 e malformed/unknown | `evidence/F01-local.md`; SHA anterior `8aa2148e78f6ff8c2c643f4d28e71ee60ba643b7` validado; SHA corrente requer revalidação após review do PR #31 | implemented |
| Catálogo fechado de capabilities e reconhecimento puro | F01 | `src/shared/authorization`; capability desconhecida falha fechado | capability desconhecida e imports proibidos | `evidence/F01-local.md`; SHA anterior `8aa2148e78f6ff8c2c643f4d28e71ee60ba643b7` validado; SHA corrente requer revalidação junto ao gate F01 | implemented |
| Hierarquia, scope, target e evaluator/enforcement completo | F10 | evaluator puro e enforcement BFF | T22–T27 | identidade ERP não comprovada | blocked |
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

A política de acesso existente em `src/features/auth` continua sendo scaffold de UX do layout; ela não é o evaluator autoritativo de F10. Fresh step-up não é modelado como flag global dessa policy: a prova final permanece vinculada à sessão e à intenção no servidor.

A F01 retorna temporariamente a `implemented` porque o PR #31 incorporou uma correção de segurança posterior ao último SHA integralmente validado. O estado volta a `verified-local` somente após o gate completo passar no novo SHA de implementação. Isso não antecipa F12, não converte a branch em `PASS_LOCAL` global e não substitui provas de Worker, banco, provider, staging ou target.

Atualizar esta matriz no mesmo PR que altera implementação ou evidência. Um teste contado sem vínculo ao requisito não muda status, e evidência de outro SHA não é transportada por inferência.
