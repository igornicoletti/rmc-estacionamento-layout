# F04 — evidência parcial do primeiro marco local

**Natureza:** checkpoint, não aceite da fase. **Data:** 01/10/2026. **Contrato:** v1.1 sobre v1.0 imutável. **Ambiente:** LOCAL sintético, Auth disabled. **Baseline integrada:** main `844ca20f3a01fb4f69d0c4a05bff9420e25b57a0`. **SHA final do runner testado:** `a824b8981492ed235ea06c2c2cfe9b56fe5092b0`. **Status:** primeiro marco comprovado; F04 em implementação. Não PASS_LOCAL/PASS_TARGET/GO.

## Sumário navegável

- [Escopo e implementação](#scope)
- [Comandos e resultados](#validation)
- [Integridade e cleanup](#integrity)
- [Tentativas e limitações](#limitations)
- [Pendências da fase](#pending)

<a id="scope"></a>

## Escopo e implementação

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

Composição RPC do adapter com admission autoritativa, saga/idempotência/intenção, reconciliação persistida com lease/fence/retries bounded, compensação/revogação segura e day-zero controlado ainda não implementados. Faltam crash/perda de resposta em cada fronteira, autorização ator/alvo/scope no commit e gate integral no SHA final da fase. Units reais não comprovadas mantêm provisioning M/O fechado. PR de aceite F04 somente ao concluir esses marcos; merge/F05 exigem nova autorização do responsável.
