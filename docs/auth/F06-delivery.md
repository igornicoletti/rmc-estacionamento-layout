# F06 — ativação e revisão F00–F06

**Data:** 02/10/2026. **Branch:** `feat/auth-f06-journeys`. **Base:** `b0463e1339e2d8554fc59e49dc49ec29169a4ee9`. **Estado:** implementação local candidata; Auth e rota de ativação desabilitadas por padrão. O resultado do gate integral consta somente no relatório gerado pelo próprio comando `npm run check:full`.

## Sumário navegável

- [Método e fontes](#method)
- [Revisão por fase](#review)
- [Implementação F06](#implementation)
- [Falhas corrigidas e limites](#limits)
- [Validação](#validation)

<a id="method"></a>

## Método e fontes

A pesquisa comparou o [contrato v1.0](contract-v1.0.md), as substituições explícitas da [v1.1](contract-v1.1.md), o [plano](plan-and-requirements.md), as [evidências F04](evidence/F04-local.md) e [F05](evidence/F05-local.md), o anexo consolidado de implementação (SHA-256 `A5ADA97E506B157FE30801CA039BE673B315662C73FA19BFFE5A249A16B5023E`) e o dossiê de auditoria v2, capítulo F06-R. Foram selecionadas fontes primárias para comportamento do provedor, HTTP, criptografia e transação; blogs e exemplos sem contrato de versão não fundamentaram decisões. As provas locais usam GoTrue/Supabase e PostgreSQL do stack pinado pelo projeto; não substituem a configuração hospedada.

Fontes oficiais consultadas em 02/10/2026: [admin updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid), [signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [MFA TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [MFA enroll](https://supabase.com/docs/reference/javascript/auth-mfa-enroll), [configuração local Supabase](https://supabase.com/docs/guides/local-development/cli/config), [password security](https://supabase.com/docs/guides/auth/password-security), [HIBP Pwned Passwords API](https://haveibeenpwned.com/API/V3), [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html), [Web Crypto Workers](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [locks PostgreSQL 17](https://www.postgresql.org/docs/17/explicit-locking.html) e [funções Supabase](https://supabase.com/docs/guides/database/functions).

A documentação de configuração chama `auth.email.enable_signup` de controle de cadastro. No GoTrue local pinado, desativá-lo também impediu o login por senha do usuário técnico: o PoC reproduziu o erro. A configuração local mantém esse provider habilitado e `auth.enable_signup=false`; o PoC confirmou cadastro público negado, criação administrativa e autenticação por senha. Essa observação pertence à versão local testada e exige nova verificação no target.

<a id="review"></a>

## Revisão por fase

| Fase | Evidência reexaminada neste checkout | Estado e limite |
| --- | --- | --- |
| F00 | Toolchain e flags fail-closed, origem local explícita, chaves server-only | Infraestrutura hospedada, domínio, secret management e probes públicos seguem F13 |
| F01 | DTOs, estados, políticas e erros estritos; DTOs F06 acrescentados em `src/shared/auth/auth-activation.ts` | Contratos puros não concedem autoridade por si |
| F02 | Migrations reconstruídas, RPCs invoker, grants de coluna, RLS e transações; testes pgTAP atuais | `service_role` possui privilégios próprios e contorna RLS; acesso fica somente no Worker |
| F03 | Same-origin, cookies `__Host-`, CSRF, limites HTTP, `no-store`, Problem Details | `GET /api/auth/context` ainda não projeta NORMAL; integração de UI e contexto fica F08/F11 |
| F04 | Reserva/ownership do UUID técnico, associação única e reconciliação com fence | PoC F06 lê o vínculo do Auth; prova target e autorização hospedada seguem pendentes |
| F05 | Challenge/outbox/Queue, consumer e delivery com efeito incerto reconciliável | PoC de SMS físico e gateway target continuam F13; accepted nunca equivale a entregue |
| F06 | Request/decoy, OTP, BOOTSTRAP, senha, TOTP mínimo e promoção atômica local | Gate e limitações abaixo; nenhuma flag de Auth ativada |

Os resultados históricos F00–F05 pertencem aos SHAs de seus manifestos. A reconstrução e os testes deste checkout reavaliam compatibilidade local, sem reemitir prova hospedada. A autorização do usuário incluiu o TOTP mínimo na F06 para permitir promoção S/A; login/MFA normal e fresh step-up seguem F07.

<a id="implementation"></a>

## Implementação F06

`POST /api/auth/activation/request` exige PREAUTH/CSRF e origem canônica. CPF válido é procurado por HMAC versionado; CPF ausente/inelegível segue desafio decoy de formato público equivalente. O RPC registra jornada, challenge de oito dígitos, verifier HMAC, orçamento, outbox cifrado e auditoria em commit único. `request` repete a mesma resposta para comando já persistido com intenção e PREAUTH idênticos. A expiração do desafio é de dez minutos; a jornada não se estende em replay. `POST /api/auth/activation/restart` cancela uma jornada pendente, invalida CSRF e exige novo PREAUTH.

`verify` consome OTP sob locks e limites, confere identidade e telefone provisionado corrente, cria sessão BOOTSTRAP restrita e consome a jornada. `password` normaliza NFC, verifica limites em caracteres e bytes, blocklist contextual e HIBP por prefixo SHA-1; indisponibilidade da consulta bloqueia a escrita. Claim, lease e fence antecedem o update administrativo. O adapter só atualiza depois de `invalid_credentials` definido e sempre reautentica a senha escolhida; resposta externa incerta permanece restrita. O token de acesso fica cifrado com chave separada, sem refresh token persistido.

Na etapa `SECURITY_SETUP`, o endpoint TOTP mínimo faz claim exclusivo, comprova ownership no Auth e cardinalidade exata de fatores, inscreve fator único e retorna segredo/URI somente na resposta `no-store`. `totp/verify` comprova o fator no provedor e AAL2, depois a função de banco revalida role, generation, reserva, day-zero S, assignment M/O, BOOTSTRAP, CSRF, senha e fator. O commit único faz `ACTIVE` + `COMPLETE` + sessão NORMAL, invalida CSRF BOOTSTRAP e grava auditoria/outbox. S e M exigem TOTP na implementação local; O pode seguir sem fator se o Auth confirmar zero fatores. A política para M antes do target ainda depende de decisão normativa. A resposta final perdida pode ser reconstituída durante sessenta segundos somente com cookie/CSRF BOOTSTRAP, mesmo `commandId` e mesma intenção, sem criar outra sessão. O cookie NORMAL só sai após o commit.

Todos os endpoints exigem `BFF_ACTIVATION_ENABLED=true` e configuração `LOCAL_PRODUCTION_LIKE`, Auth disabled, origem HTTPS local e DB loopback. A flag distribuída fica false. O browser recebe apenas URL e publishable key do Supabase; as chaves de contexto, CPF, OTP, delivery, provider e `service_role` ficam no Worker.

<a id="limits"></a>

## Falhas corrigidas e limites

- A primeira execução do teste de cancelamento revelou falta do privilégio `UPDATE(updated_at)` para `service_role`; o grant de coluna foi corrigido e as migrações foram reconstruídas antes do novo teste.
- O modo local de email com `enable_signup=false` impedia login técnico no GoTrue pinado. O PoC verificou a combinação corrigida com cadastro global bloqueado. É obrigatório repetir essa verificação no Auth hospedado antes de mudar flags.
- O contrato v1.0 manda materializar confirmação do telefone no Auth após SMS. A v1.1 define usuário técnico sem telefone, e a F04 o provisiona assim. A F06 comprova posse via OTP RMC e fonte PHONE corrente no banco, sem escrever telefone pessoal no Auth. A divergência normativa precisa de resolução expressa antes do target; não se afirma `phone_confirmed_at` no Auth.
- A perda da resposta `verify` depois do consumo do OTP deixa BOOTSTRAP restrito e pode exigir recuperação operacional; não se emite sessão por simples `commandId`. A perda do segredo TOTP após enrollment pode deixar fator unverified e requer reconciliação aprovada. Nenhuma dessas situações libera NORMAL.
- A sessão NORMAL criada é durável mas o contexto F03 ainda não a projeta; login, refresh, logout, recovery, UI e autorização de dados são fases posteriores. O token de acesso do provedor expira e a sessão local é limitada por essa expiração. Sem integração F08/F11, não há alegação de uso funcional do aplicativo.
- O mock de fator no teste unitário e o PoC real do Auth local verificam a sequência de chamadas, mas não constituem E2E HTTP completo da jornada com SMS real. F13 requer provider/gateway/keys/Queue/edge target, restore, segurança hospedada e probes finais. TOTP não é resistente a phishing e não se declara certificação NIST AAL2.

<a id="validation"></a>

## Validação

As provas locais específicas são `npm run db:reset`, `npm run db:test`, `npm run db:lint`, `npm run test -w worker`, `node worker/scripts/worker-activation-provider-poc.mjs`, typecheck, lint, `git diff --check` e `npm run check:full`. O comando integral registra seu próprio SHA, saídas e falhas em `validation-results/full.json`; somente exit code zero no checkout final constitui gate verde. Execução parcial ou stack preexistente recusado pelo runner não equivale a aprovação.
