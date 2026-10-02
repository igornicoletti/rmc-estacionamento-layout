# Pesquisa oficial

**Natureza:** referência vigente. **Escopo:** fontes, versões e impacto; histórico explícito.
**Revisão:** 01/10/2026. **Baseline:** main844ca20; F04 em implementação.
**Status:** fontes e limites registrados; resultados por SHA nos manifestos, não inferidos desta referência.

## Sumário navegável

- [2026-09-30 — execução local da F02](#c1)
- [2026-10-01 — reauditoria crítica da F02](#c2)
- [2026-10-01 — Manutenção pré-F03](#c3)
- [2026-10-01 — Implementação F03](#c4)
- [2026-10-01 — Confronto do dossiê v2.0](#c5)
- [2026-10-01 — Saneamento pré-F04](#c6)
- [2026-10-01 — Início F04](#c7)

<a id="c1"></a>

## 2026-09-30 — execução local da F02

A F02 foi autorizada após a integração e validação do saneamento F00/F01. As fontes oficiais foram reconferidas antes das migrations; nenhum ambiente remoto foi vinculado ou alterado.

| Tema | Fonte oficial | Versão ou decisão observada | Impacto planejado |
| --- | --- | --- | --- |
| CLI e migrations locais | <https://supabase.com/docs/guides/local-development/cli-workflows> | CLI `2.118.0` pinada; registry já oferece `2.119.0` | Mantida `2.118.0` por decisão aprovada; reconstrução feita por `supabase db reset`. |
| Database migrations | <https://supabase.com/docs/guides/local-development/database-migrations> | migrations são a única fonte evolutiva | Dumps por schema são evidência derivada e recebem checksum. |
| Testes de banco e pgTAP | <https://supabase.com/docs/guides/local-development/testing/overview> e <https://supabase.com/docs/guides/database/extensions/pgtap> | pgTAP `1.3.3` no stack local | Provar objetos, grants, RLS, constraints, RPCs e invariantes. |
| SDK servidor | <https://supabase.com/docs/guides/auth/choosing-a-server-package> | `@supabase/supabase-js` `2.117.2` pinado | Reservado ao adapter BFF futuro; a exceção temporária no Knip é explícita e nenhum import de browser foi criado. |
| Funções de banco | <https://supabase.com/docs/guides/database/functions> e <https://www.postgresql.org/docs/17/sql-createfunction.html> | as quatro RPCs corrigidas são `SECURITY INVOKER` e `search_path=''` | API expõe funções estreitas; nenhum `SECURITY DEFINER` foi necessário. |
| Row Level Security | <https://supabase.com/docs/guides/database/postgres/row-level-security> e <https://www.postgresql.org/docs/17/ddl-rowsecurity.html> | grants e RLS são controles distintos; `service_role` tem `BYPASSRLS` | Contraprovas separadas; FORCE RLS não é descrito como contenção do papel. |
| Mudanças incompatíveis | <https://supabase.com/changelog?types=breaking-change> | hosted registra PostgreSQL `17.11`; imagem local efetiva é `17.6.1.171`, servidor `17.6` | Major 17 compatível; minor local é registrado sem ser promovido a prova do target. Data API usa exposição opt-in. |
| Unicidade condicional | <https://www.postgresql.org/docs/17/indexes-partial.html> | unique partial indexes | Cardinalidades correntes de assignment, manager e sessão NORMAL são protegidas no banco. |

O stack local usa portas `55320`–`55329` porque outro projeto já ocupava a faixa padrão; nenhum processo do outro projeto foi interrompido. A prova hospedada, versões do target e advisors remotos permanecem fora do escopo da F02.

<a id="c2"></a>

## 2026-10-01 — reauditoria crítica da F02

Busca dirigida por `CHECK NULL`, `foreign key nullable`, `FOR UPDATE column privileges`, `SECURITY INVOKER`, `BYPASSRLS`, `clock_timestamp` e `Supabase database CI`. Aceitas somente fontes oficiais PostgreSQL 17, Supabase e W3C. O contrato foi confrontado primeiro; fontes externas fundamentaram escolhas técnicas, sem redefinir regras de negócio. Achados, correções e limites estão em [F02-critical-audit.md](F02-critical-audit.md).

| Fonte consultada | Consequência na implementação |
| --- | --- |
| <https://www.postgresql.org/docs/17/ddl-constraints.html> | NULL tratado explicitamente; FKs compostas para purpose/binding/generation e triggers para identidade nullable. |
| <https://www.postgresql.org/docs/17/explicit-locking.html> e <https://www.postgresql.org/docs/17/transaction-iso.html> | Locks em ordem por identidade/contexto; validação após aquisição; nenhuma chamada externa na transação. |
| <https://www.postgresql.org/docs/17/sql-select.html> | UPDATE por coluna `id` necessário para row locks com invoker; triggers garantem ID imutável. |
| <https://supabase.com/docs/guides/database/functions> e <https://www.postgresql.org/docs/17/sql-createfunction.html> | Overloads com clock externo removidos; quatro RPCs invoker e grants mínimos. |
| <https://supabase.com/docs/guides/api/using-custom-schemas> e <https://www.postgresql.org/docs/17/ddl-rowsecurity.html> | Provas SQL com roles reais e probes HTTP locais; service_role não é contido por RLS. |
| <https://supabase.com/docs/guides/deployment/ci/testing> | Job específico de banco acrescentado ao workflow existente, CLI pelo lockfile, startup sem imprimir chaves; execução hosted continua dependente de billing. |
| <https://www.w3.org/TR/WebCryptoAPI/> | Perfil binário SHA-256/AES-GCM documentado em ADR-002; SQL prova forma, adapter futuro provará criptografia. |

`supabase db advisors --local --type all --level warn --fail-on warn` existe na CLI pinada e foi executado; substitui a inferência anterior baseada somente em queries parciais de advisors.

<a id="c3"></a>

## 2026-10-01 — Manutenção pré-F03

Busca dirigida: npm lockfile/peers, Vitest projects, shadcn source updates, GitHub permissions/pins/Dependabot, Diátaxis, Supabase CLI/PG breaking changes. Inclusão: documentação/changelog dos mantenedores; exclusão: blogs/recomendações sem origem verificável. Changelog Markdown Supabase foi lido via HTTP quando browser recusou content-type.

| Fonte oficial | Decisão e impacto |
| --- | --- |
| [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/), registry/peer metadata consultados em 01/10 | Lock reproduzível; patches/minors aprovados; TypeScript 7 fora da faixa de TypeScript suportada pelo typescript-eslint escolhido (TS <6.1) |
| [CLI 2.119.0](https://github.com/supabase/cli/releases/tag/v2.119.0) | Revisadas mudanças start/status, pg-delta e runtime; captura de saída sensível; minor DB efetiva depende de consulta |
| [PG 17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes) | Não assumir patch por major/CLI; verificar ltree/btree_gist/pgcrypto/operators. Auth migrations não usam ciphers PGP legados, ltree ou btree_gist; não equivale a todo PostgreSQL corrigido |
| [Vitest projects](https://vitest.dev/guide/projects), [performance](https://vitest.dev/guide/improving-performance) | Regras puras em Node; DOM somente UI/browser; isolamento preservado |
| [Playwright CI](https://playwright.dev/docs/ci) | Build único por gate; E2E Chromium serial e prova local adicional Firefox/WebKit |
| [VS Code TS](https://code.visualstudio.com/docs/typescript/typescript-transpiling) | js/ts.tsdk.path é configuração válida atual; preservada, sem migração baseada em recomendação antiga |
| [Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) | Atualização semanal com grupos compatíveis, cooldown e revisão manual |
| [Diátaxis](https://diataxis.fr/start-here/) | Documentação por necessidade/escopo, sem pastas vazias; referências/procedimentos/explicações separados por seção |
| [shadcn CLI](https://ui.shadcn.com/docs/cli), [Base UI](https://base-ui.com/react/overview/quick-start) | info confirmou base-luma, 27 primitives, cn package; nenhum overwrite de source |

Fontes consultadas em 01/10/2026; nomes/versões capturam a consulta, não representam atualização contínua automática. Critérios SQL antigos permanecem históricos. Ações remotas/segredos/deploy não fizeram parte desta pesquisa.

<a id="c4"></a>

## 2026-10-01 — Implementação F03

Perguntas: como impedir fallback SPA para API; provar streaming/deadlines no runtime; separar versões Vitest; vincular CSRF sem sessão SSR; restringir RPC e registrar limites de prova. Busca dirigida por Workers Static Assets run_worker_first, Vitest plugin peerDependencies, Wrangler types HTTPS, synchronizer CSRF same-origin, Supabase request scoped custom schemas e RFC9457. Incluídas somente docs/changelogs/metadata dos mantenedores, IETF e OWASP; exemplos antigos de pool e grants amplos foram rejeitados. Contrato confrontado antes das fontes externas. Sem dados humanos, serviços remotos ou inferência de capacidade target.

| Fonte oficial consultada em 01/10 | Decisão/impacto |
| --- | --- |
| [Worker-first](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) | /api e /api/* antes da SPA; desconhecida jamais usa assets |
| [Headers](https://developers.cloudflare.com/workers/static-assets/headers/) | _headers só assets; respostas Worker recebem proteção centralizada |
| [Vitest Workers](https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/) | cloudflareTest e cloudflare:workers; plugin1.3.4 peer ^4.1.0, Vitest4.1.11 isolado do app5.0.3 |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/workers/) | 4.145.0 pinado; types --check, HTTPS local e dry-run sem publicação |
| [Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) | HMAC-SHA-256, AES-GCM, timingSafeEqual; chaves/domínios distintos |
| [Request runtime](https://developers.cloudflare.com/workers/runtime-apis/request/) | HTTPS real mostrou que Workers não implementa redirect:error; usar manual e negar todo 3xx antes de body/schema. Browser permanece redirect:error. CLI dev também não aceita infer-origin-from-routes como flag nesta versão; sem routes/host externos, origem local preservada e comprovada |
| [SDK](https://supabase.com/docs/guides/auth/choosing-a-server-package), [schemas](https://supabase.com/docs/guides/api/using-custom-schemas) | SDK2.117.2 request-scoped no Worker; nenhuma sessão SSR; grants mínimos em vez de GRANT ALL dos exemplos |
| [RFC9457](https://www.rfc-editor.org/rfc/rfc9457.html) | about:blank usa título do status, código fechado/request ID, sem detalhes internos |
| [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) | synchronizer persistido; same-site é negado; mutation requer Origin exato + CSRF |
| [Supabase changelog](https://supabase.com/changelog?types=breaking-change) | PG17.11 hospedado não presume minor local; registrar show server_version; Data API opt-in, schemas internos não utilizados |

Registry engines/peers/advisories foram conferidos antes da instalação. Um lockfile raiz; sem instalação forçada. Testes runtime não substituem HTTPS+PostgreSQL reais, e ambos não substituem prova hosted da F13.

<a id="c5"></a>

## 2026-10-01 — Confronto do dossiê v2.0

Objetivo: distinguir obrigação existente, correção normativa, detalhe de implementação e prova ausente. Método: leitura integral do dossiê e v1.0, confronto dos 18 P0 e T39–T63 com implementação e fontes primárias; excluir blogs, exemplos permissivos de grants e comportamento interno não fixado. Resultado/matriz e hashes em [v1.1](contract-v1.1.md#audit). Consulta: 01/10/2026; nenhuma versão hospedada certificada.

| Busca/fonte primária | Evidência e limite | Decisão |
| --- | --- | --- |
| Supabase admin createUser/password; fonte Auth `ce9a8eee0cc042be8c7a42981a7ddae631e41d91` | UUID fornecido e credencial interna aleatória suportados; API de login email/phone, não CPF; comportamento target exige PoC | Adapter técnico e ownership reservado F04; sem senha entregue, não ausência literal de credencial |
| Supabase sessions/signing keys | JWT válido pode sobreviver à sessão provider; JWKS tem cache upstream/SDK | Não remover verificação online sem protocolo de revogação/fence |
| PostgREST transactions/PostgreSQL RLS | RPC transacional; READ COMMITTED não é snapshot único entre statements; service_role BYPASSRLS | Isolamento por comando; grants separados de RLS |
| RFC 9110 §15.5.2/RFC 9457 | WWW-Authenticate obrigatório em 401; about:blank usa título do status | Desafio RMCSession específico da aplicação; sem exigir Bearer |
| OWASP CSRF/transaction authorization; NIST 800-63B | Proteção vinculada a contexto/efeito; TOTP não phishing-resistant | Cookies determinísticos, prova one-time; não alegar conformidade NIST integral |
| Workers Web Crypto/Static Assets headers | Codec precisa ser inequívoco; headers combinados requerem detach para cache immutable | Codec 1 explícito, vetor independente, style exception separada de script |

URLs reproduzíveis e commit fixado estão nas [fontes da revisão](contract-v1.1.md#sources). A base possui 160 IDs, não 157; o dossiê tem 125 IDs próprios e 25 testes adicionais. Esses inventários não equivalem a provas de segurança nem certificação de auditoria independente.

<a id="c6"></a>

## 2026-10-01 — Saneamento pré-F04

Perguntas: manter unicidade CPF entre chaves; recuperar envelope após generation; reservar UUID antes do provider; distinguir outcome desconhecido de ausência e impedir commit após perda de lease. Confronto da v1.1 com código/RPCs/testes, incluindo todos os P0/P1/P2 da [preparação](F04-preparation.md#findings), sem tratar recomendações como autorização autônoma. [ADR-005](decisions.md#c6) e [manifesto suplementar](evidence/pre-f04-prerequisites-local.md) registram resultados e limites.

| Busca / fonte primária consultada em 01/10/2026 | Aplicação |
| --- | --- |
| [PostgreSQL17 explicit locking](https://www.postgresql.org/docs/17/explicit-locking.html) — row locks, shared/exclusive, lifetime | Policy shared no writer e exclusive na rotação; CAS/fence e ordem de locks; sem transação mantida durante rede |
| [Supabase database functions](https://supabase.com/docs/guides/database/functions) — invoker, search_path, EXECUTE | Funções invoker qualificadas, defaults/grants explícitos; administração de rotação não concedida ao BFF; RETURNING audit exige somente SELECT id |
| [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) — AES-GCM, HMAC e random | Codec CPF separado, AAD/binding versionados, 39 bytes, vetor independente Node e runtime Workers real; não configurar secrets ou rota nova |
| [Changelog PG17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes) — ltree, pgcrypto PGP legado, btree_gist float e custom operators | Sem essas utilizações no schema Auth; AES-GCM no Worker, não PGP no PostgreSQL. Runtime local17.11 confirmado, nenhum resultado target inferido |

Índice Markdown do changelog obtido por HTTP após content-type recusado pelo navegador; seguido o breaking change relevante. Mantidos toolchain/pins/lockfile: o aviso Wrangler4.146.0 não autoriza atualização incidental nesta correção. A referência local da skill Workers ainda exemplifica pool antigo; prevalece a integração oficial atual pinada no projeto, sem downgrade. Ausência de PoC provider, keyring operacional e restore reais mantém esses gates futuros fechados.

<a id="c7"></a>

## 2026-10-01 — Início F04

Perguntas: SDK/servidor preservam UUID fornecido; ownership privado pode ser consultado diretamente; criação produz sessão ou confirma telefone; falha de transporte comprova ausência? Fontes primárias, código instalado e PoC local; nenhuma prova target inferida. Changelog Markdown reconferido por HTTP, incluindo PG17.11 e Data API opt-in; sem atualização incidental de dependências.

| Busca/fonte primária | Resultado e decisão |
| --- | --- |
| [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [getUserById](https://supabase.com/docs/reference/javascript/auth-admin-getuserbyid), [deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser) | Admin somente servidor; UUID no tipo AdminUserAttributes instalado. PoC exige reserva persistida, GET direto e ownership em app_metadata; não listar/adotar por email/user_metadata |
| [Auth v2.197.0 fixado](https://github.com/supabase/auth/tree/4eee58f296d9698a1c2c0ae14d7a0b379c7622d3) e imagem local | PoC recusa drift da imagem/digest; SDK2.117.2 mantido. Versão binária via subcomando version, não flag --version. Fonte não substitui execução |
| SDK auth-js instalado, lib/fetch.ts e GoTrueAdminApi.ts | X-Supabase-Api-Version determina interpretação do campo code; preservar header. Apenas GET404/user_not_found prova ausência; criação perdida permanece UNKNOWN sem retry |
| [Workers Fetch](https://developers.cloudflare.com/workers/runtime-apis/fetch/) | Manual no Worker, negar redirect antes de ler; 64KiB, timeout por fetch+body e signal propagado. Node PoC usa redirect:error; não confundir runtimes |

Domínio auth.rmc.invalid é exclusivamente sintético; email técnico confirmado não confirma telefone nem autoriza NORMAL. Adapter inicial não implementa DELETE/revogação e não está ligado ao entrypoint. PoC independentemente exige ausência de sessões e ownership antes do cleanup do próprio usuário; não é compensação operacional. Skills Supabase/Workers orientaram pin, limite e verificação; referência antiga de pool não alterou a integração vigente.

Continuação F04, fontes oficiais reconferidas em 01/10/2026 local:

| Questão / busca oficial | Decisão e limite |
| --- | --- |
| [updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid), [signOut](https://supabase.com/docs/reference/javascript/auth-admin-signout), [deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser) — ban/revogação/delete | Ban não comprova revogação JWT. Protocolo local só remove owned sem sessões, após fence/bloqueio confirmados; demais casos escalonados. Não inventar token para signOut nem escrever schemas internos |
| [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [scheduled handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) — execução e prova local | Handler scheduled real testado via Wrangler --test-scheduled e /__scheduled, não rota produtiva. Lease/circuit persistentes, máximo três itens e lookup-only; cron hospedado disabled, sem deploy |
| [Advisory locks PostgreSQL17](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS) — day-zero concorrente | Advisory transaction lock somente durante SQL; singletonreceipt/operador/intenção; nenhuma transação aberta durante provider. Dez conexões independentes provam um vencedor local |

Skills Supabase/Workers/Postgres orientaram grants mínimos, health checks preservados e ordem de locks. Wrangler4.145.0 e plugin pinado mantidos; docs/avisos não autorizaram atualização incidental. Evidências anteriores permanecem históricas e limitadas ao SHA/checkout descrito; F07/F08/F10/F13 fornecem provas ainda externas a esta parcela.

Continuação: consulta direta por UUID não fornece fencing externo nem garante que um create anterior deixou de executar. Resultado GET404 após timeout permanece inconclusivo na saga; não pode autorizar abort/recreate. [Locks PostgreSQL17](https://www.postgresql.org/docs/17/explicit-locking.html) sustentam admissão única persistida sob locks ordenados, sem transação aberta durante provider. [Funções Supabase](https://supabase.com/docs/guides/database/functions) sustentam invoker e fronteira RPC estreita. [ADR-006](decisions.md#c7) registra crash antes do POST, limites dessa garantia e gates pendentes. Startup restabelecido com bootstrap PostgreSQL antes de reconstruir os schemas; health checks preservados. Concorrência e integração real passaram no SHA67878c0, conforme [evidência parcial](evidence/F04-local.md#stable). Pesquisa não substitui teste nem prova target.

Revisão do PR44, 02/10/2026: [ALTER FUNCTION PostgreSQL17](https://www.postgresql.org/docs/17/sql-alterfunction.html) e [funções Supabase](https://supabase.com/docs/guides/database/functions) reconferidos para mover primitives não autorizadas ao schema privado sem editar migrations anteriores. Wrappers legados preservam assinatura, mas exigem a mesma autorização dos atuais. [Scheduled handler Workers](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) reconferido: ausência de trabalho não prova recuperação de dependência; circuito mantém histórico entre backoffs. Conflito de ownership requer escalonamento auditado durável antes de retornar CONFLICT. Contraprovas incluem chamadas legadas sem fresh proof, audit failure/rollback, replay e ciclos vazios intercalados entre três falhas. Pins e contratos integrais preservados; nenhum recurso remoto ou credencial real usado.
