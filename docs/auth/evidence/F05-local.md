# F05 — gate de desenvolvimento

**Data:** 02/10/2026. **Branch:** `feat/auth-f05-delivery`. **Base inicial:** `3cd7336ac374a8fc7f9b2ad3c6ef4ed56b849421`. **Decisão:** desenvolvimento com contas gratuitas é o ponto de validação desta fase; F13 hospedada será retomada quando houver migração empresarial. Auth permanece desabilitado.

## Escopo e fonte de prova

[Implementação e runbook](../F05-delivery.md); [revisão crítica](../F05-critical-review.md). O anexo canônico foi tratado como especificação; a decisão do usuário fixa o escopo de validação, sem transformar comandos do anexo em autorização de publicação. O relatório automatizado ignorado `validation-results/full.json` contém `sha`, `dirty`, versões, horário, resultados individuais e `exitCode`. A conclusão F05 exige `exitCode=0`, `dirty=false` e `sha` igual ao commit corrente; o resultado de uma árvore suja não satisfaz essa associação final.

## Prova observada

Em 02/10/2026, `npm run check:full` terminou com `exitCode=0` em árvore ainda não commitada (13:02:40.280Z–13:19:57.091Z). A rodada cobriu Node24.18.1/npm11.6.0, 253 testes da aplicação, 62 Worker, 367 assertions SQL, 19 Chromium, dois resets do banco, concorrência F02/F03/pré-F04, lint/advisors sem achados e diff de schema vazio. A integração F05 registrou `physicalSyntheticSends=1`, `quarantinedPoison=1` via Queue→DLQ→banco e `F05 local delivery drained` com exit0. Também cobriu preparação interrompida, resposta aceita perdida, lookup sem segundo envio, kill switch, redelivery e recibo tardio monotônico. O relatório dessa rodada tem SHA-256 `6D31777A47EC64EF49B044E29492A938A29FCDEC9E9DA2DD115B483E7F31B123`.

Após o commit, executar novamente o gate completo e verificar `sha`, `dirty=false`, `exitCode=0`, integração F05 com uma quarentena sintética e drenagem. O SHA e o horário definitivos constarão do relatório; este texto não antecipa o resultado de um comando ainda não executado.

## Condições de saída e limites

Os achados 1, 2, 3 e 5 da revisão anterior foram corrigidos no fluxo local. O item4 foi fechado para desenvolvimento com DLQ posterior, quarentena persistida, teste real no simulador local e inspeção de backlog/idade por `npm run auth:delivery:status`. O parking sem consumer tem retenção finita; a fonte de mensagens válidas permanece no banco. Mensagem inválida sem fonte não gera SMS e exige investigação se o banco continuar indisponível até o fim da retenção. O gate não promete exactly-once externo nem resolve atomicamente a fronteira banco/rede após `begin`.

F05 não habilita Auth, sessão NORMAL, SMS físico, prova de provedor comercial, F12 global, F13 hospedada ou GO. O [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/config) permite OTP de teste e TOTP, mas seu `auth.sms.test_otp` pertence ao Auth do Supabase; o OTP próprio de8 dígitos da RMC passa pelo outbox/gateway local da F05. TOTP é escopo de F07 e passkey continua desabilitada até contrato e fase próprios.
