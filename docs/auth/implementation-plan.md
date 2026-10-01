# Plano de implementação Auth — F01 a F14

## Regra de execução

O Contrato canônico de autenticação, sessão, autorização e acesso v1.0 é a fonte normativa. Cada fase F01–F14 usa branch e PR próprios, atualiza a matriz de requisitos e produz evidência vinculada ao SHA testado. Uma fase não transforma automaticamente a seguinte em autorizada.

Auth permanece desabilitado até que o gate da fase responsável esteja comprovado. `candidate` e `validated` são estágios do fluxo; `LOCAL`, `LOCAL_PRODUCTION_LIKE`, `STAGING/TARGET_HOSTED` e `PRODUCTION` são ambientes; `PASS_LOCAL` e `PASS_TARGET` são resultados de evidência.

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

## Manutenção e drift

No início de cada fase, revisar documentação e changelogs oficiais aplicáveis e registrar a consulta na evidência. Mudança material de requisito exige versão, justificativa, impacto, testes e supersessão explícita; código não modifica o contrato silenciosamente.

Billing ou runner indisponível é limitação externa. Não equivale a CI verde e exige waiver explícito do responsável para merge quando o check obrigatório não iniciar.

O gate corretivo F00/F01 deve ser integrado e validado explicitamente pelo responsável antes da criação da branch F02. Preparação documental e pesquisa não constituem início da fase.
