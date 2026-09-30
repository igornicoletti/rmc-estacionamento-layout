# Registro do contrato e baseline — F00

## Fonte normativa

| Campo | Valor |
| --- | --- |
| Contrato | Contrato canônico de autenticação, sessão, autorização e acesso — rmc-estacionamento-layout — v1.0 |
| Versão | `1.0` |
| Data de consolidação | 28/09/2026 |
| SHA-256 do artefato recebido | `74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148` |
| Checkout de implementação F00 | `a097e74b8cba1822c1c73f2a47900106cf315b39` |

Mudança material de requisito exige nova versão, justificativa, impacto, testes e supersessão explícita. Este registro não substitui o contrato.

## Status do bloco

**F00 em andamento. Não é PASS_LOCAL, PASS_TARGET nem autorização de release.**

O baseline mantém Auth fechado por padrão e não inclui Worker/BFF, Supabase SDK, banco, Queue/DLQ, SMS, cookies de sessão ou endpoints Auth. Esses elementos entram apenas nas fases posteriores previstas pelo contrato.

## Baseline tecnológica observada

| Item | Estado registrado |
| --- | --- |
| Node | Manifesto `^24.18.1`; registrar a versão realmente executada em cada evidência. |
| npm | Manifesto `11.6.0`; o início da F00 observou `12.1.0`, portanto esse ambiente não deve ser tratado como prova da toolchain pinada. |
| React / React DOM | `19.3.0` resolvido no baseline. |
| React Router | `8.4.0` resolvido; arquitetura Data Mode. |
| TypeScript | `6.0.2` resolvido. |
| Vite | `8.3.0` resolvido. |
| TanStack Query | `5.103.2` resolvido. |
| Base UI | `1.8.0` resolvido. |
| Supabase SDK/Auth | Nenhum adapter ou SDK novo é instalado em F00. Versão e package server-side serão selecionados e provados no bloco que implementar o adapter. |
| PostgreSQL | Major/minor real, extensões e configuração hospedada ainda exigem prova antes de F02. |
| Cloudflare Workers / Queues | Plataforma de destino registrada; configuração Wrangler, Worker runtime, Queue/DLQ e typegen são deliberadamente adiados para as fases que os implementam. |

O checkpoint forense `9bb1b0a` chegou a avaliar Wrangler `4.143.0`, `compatibility_date` `2026-09-28` e um Worker de scaffold. Esses itens foram removidos do baseline ativo porque antecipavam F03 e não constituíam prova de implementação.

## Arquitetura congelada para as próximas fases

- SPA React em Data Mode.
- Browser sem integração direta com Supabase Auth/Data API.
- Provider tokens somente no servidor.
- Browser acessa futuramente um adapter HTTP **same-origin** em `/api/*`.
- Worker será a fronteira BFF quando F03 for implementada.
- Sessão funcional futura será opaca e autoritativa no servidor; estados de UI não concedem autoridade.

O domínio HTTPS final permanece dependente de prova de ambiente. `https://rmc-estacionamento.igor93nicoletti.workers.dev` é somente uma origem candidata de desenvolvimento observada durante a F00; não é domínio canônico validado nem variável de upstream escolhida pelo browser.

## Ambientes e feature stage

Ambientes previstos pelo contrato:

- `LOCAL`;
- `LOCAL_PRODUCTION_LIKE`;
- `STAGING/TARGET_HOSTED`;
- `PRODUCTION`.

Estágios do fluxo:

- `disabled` — padrão público do bundle;
- `candidate` — configuração candidata, sem habilitar fluxo;
- `validated` — depende de manifesto e evidência e não é aceito como flag pública do bundle.

A única flag pública adicionada em F00 é `VITE_AUTH_STAGE`. Não existe `VITE_AUTH_API_ORIGIN` e nenhuma variável `VITE_SUPABASE_*` é necessária neste bloco.

## Autoridades registradas

A F00 registra os nomes canônicos, sem implementar suas máquinas de estado:

- `PREAUTH`;
- `MFA_PENDING`;
- `BOOTSTRAP`;
- `RECOVERY`;
- `NORMAL`.

## Identidade, lifecycle e onboarding registrados

Lifecycle:

- `PENDING`;
- `ACTIVE`;
- `SUSPENDED`;
- `BLOCKED`;
- `DISABLED`;
- `DELETED`.

Onboarding:

- `ACTIVATION_REQUIRED`;
- `PASSWORD_REQUIRED`;
- `SECURITY_SETUP`;
- `COMPLETE`.

Papéis previstos pelo contrato: `S` (superadmin), `A` (administrator), `R` (auditor), `M` (manager) e `O` (operator). O registro desses nomes não implementa autorização.

## Catálogo inicial de capabilities registrado

O catálogo inicial de Users é registrado apenas para rastreabilidade; avaliação, hierarchy, scope e enforcement pertencem às fases de contratos/autorização:

- `users.read`;
- `users.create`;
- `users.update_profile`;
- `users.change_role`;
- `users.change_unit`;
- `users.resend_activation`;
- `users.start_recovery`;
- `users.suspend`;
- `users.resume`;
- `users.block`;
- `users.unblock`;
- `users.disable`;
- `users.reactivate`;
- `users.end_session`;
- `users.reset_mfa`;
- `users.audit.read`;
- `users.cpf.reveal`.

Nenhuma capability registrada autoriza endpoint ou acesso antes de seus gates.

## Threat model e invariantes aplicáveis desde agora

O desenho deve resistir a credential stuffing, enumeração, CSRF, XSS que atue na sessão, fixation, replay, BOLA/IDOR, escalada de privilégio, corridas de refresh, respostas tardias, abuso de SMS, exaustão de memória, bypass de autorização, perda/duplicação de mensagens e revogação incompleta.

Desde o baseline ficam preservadas as decisões de negação por padrão, provider tokens somente no servidor, sessão opaca, separação entre identidade/role/lifecycle/onboarding/unidade, DTOs decodificados, cache privado por contexto, CSRF sincronizador e indisponibilidade distinta de anonymous.

## Funcionalidades explicitamente fechadas

Permanecem sem endpoint ou comportamento funcional neste bloco e, quando aplicável, fora do release inicial:

- signup público;
- login por email;
- social login;
- autenticação anônima;
- passkeys;
- rebind self-service de telefone;
- remoção self-service de fator verificado;
- mutações de domínios sem contrato aprovado;
- login, sessão, provisioning, SMS e MFA funcionais;
- endpoints privados de Auth.

## Dependências externas ainda sem prova

- domínio HTTPS canônico e política final de cookies/allowlist;
- versão/configuração hospedada do Supabase e plano/quota;
- signing/JWKS e demais credenciais server-side;
- major/minor/extensões reais do PostgreSQL;
- Queue/DLQ, retenção e jobs;
- gateway SMS, idempotência e delivery físico;
- identidade externa de Units/ERP para gates dependentes;
- keyrings/secrets operacionais;
- observabilidade, alertas, capacidade e retenção.

A ausência dessas provas mantém os fluxos dependentes desabilitados.

## Rastreabilidade F00

| Requisito | Evidência deste bloco |
| --- | --- |
| versão/contrato | cabeçalho e hash deste registro |
| baseline/pins | inventário acima, distinguindo versão resolvida de item ainda pendente |
| domínio pretendido | origem de desenvolvimento registrada como candidata, não validada |
| ambientes/stage | catálogo acima e parser fail-closed de `VITE_AUTH_STAGE` |
| authorities/lifecycle/onboarding | nomes canônicos registrados sem implementação antecipada |
| capabilities | catálogo inicial registrado sem enforcement |
| threat model | ameaças e invariantes acima |
| dependências sem prova | inventário explícito acima |
| funcionalidades fora do release/bloco | bloqueios explícitos acima |

O bloco só poderá ser marcado como F00 PASS quando os itens obrigatórios pendentes forem resolvidos e a configuração candidata do SHA corrente for validada sem secrets reais e sem caminhos permissivos. Testes unitários da flag, isoladamente, não constituem PASS_LOCAL ou PASS_TARGET.
