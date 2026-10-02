# Validação e catálogo de testes

**Natureza:** referência vigente. **Escopo:** gates de aplicação/banco/tooling e suites existentes.
**Revisão:** 01/10/2026. **Baseline:** `74c7b24e647691e28df7935871c1b9afb6e34826` + F03; SHA testado no manifesto da fase.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Comandos](#c1)
- [Ambientes e política de testes](#c2)
- [Catálogo completo](#c3)
- [Evidência e limitações](#c4)
- [Fontes](#c5)

<a id="c1"></a>

## Comandos

| Comando | Execução / pré-requisito |
| --- | --- |
| check | Diff staged/unstaged, lint, tipos, docs, tests scripts e Vitest; sem Docker |
| check:app | Knip/audit/lint/tipos/docs/scripts/cobertura serial, assets/budget e Chromium sobre build atual |
| check:db | Docker; projeto fixo; recusa stack existente; dois resets, pgTAP, concurrency duas vezes, lint/advisors/diff vazio/cleanup/stop |
| check:full | app, Worker, banco+HTTPS F03 e provisioning F04 real local, compartilhando stack/dois resets; sem duplicar Vitest/build |
| check:bff | Build, Worker e banco+HTTPS local; sem app Vitest |
| check:worker | Env --check, tipos Worker, runtime e deploy dry-run; exige dist atual |
| test:worker | Runtime Workers isolado; Vitest4.1.11/plugin1.3.4 |
| test:worker:integration | Build e gate DB exclusivo; HTTPS e Chromium real, sem deploy |
| test:provider:local | Gate DB e PoC Node Auth real, ownership e cleanup sintéticos |
| test:provisioning:local | Gate DB compartilhado; Worker HTTPS/SDK/RPC/Auth reais: normal, resposta perdida/scheduled, day-zero e compensação própria sem sessões; sem build/deploy/endpoint produtivo |
| test / test:watch | Vitest completo único / watch |
| test:unit / test:integration | Seleção por camada |
| test:serial | Diagnóstico com maxWorkers=1 |
| test:scripts | Node test runner, contraprovas de tooling |
| test:coverage | V8, um worker, timeout 10s preexistente de cobertura |
| test:e2e | Build autossuficiente + três navegadores; instalar via Playwright |
| test:e2e:chromium | Build autossuficiente + Chromium serial |
| test:e2e:built | Interno: exige dist recém-produzido; somente gate app |
| test:e2e:ui | Build e UI interativa Playwright |
| docs:check | Markdown/parser, links/anchors/inventários/checksums/workflow; sem rede |
| deps:status | npm outdated informativo; exit1 de outdated não é falha de infra |
| db:start / db:stop | Stack mínimo com startup sem chaves / stop do projeto |
| db:bootstrap | Somente PostgreSQL; interno ao gate antes dos dois resets e startup completo |
| db:reset | Destrutivo, local e sem seed; usar gate para guardrails |
| db:test / db:test:concurrency / db:lint / db:advisors | Diagnóstico local individual, stack já iniciado explicitamente |

Runners usam processo Node e argumentos sem shell; falha para sequência imediatamente. SIGINT/TERM/timeout encerram árvore de processos, cleanup do stack próprio usa sinal independente. Captura tem limite de 8 MiB. Banco usa lock exclusivo local e recusa stack preexistente; após interrupção forçada, conferir processos antes de remover supabase/.temp/validation-gate.lock. Relatório por profile em validation-results registra SHA, dirty, horários/exit e versões efetivas; não publica stdout sensível. Build:assets evita repetir typecheck já feito; build público continua autossuficiente.

Bootstrap DB precede a API: iniciar PostgreSQL, executar dois resets, parar preservando volume e iniciar stack mínimo completo com health checks. Isso recupera volume com schema ausente após reset interrompido; não cria schema ad hoc nem aceita serviço unhealthy. Cleanup final permanece obrigatório.

<a id="c2"></a>

## Ambientes e política de testes

Vitest node: testes unit .ts puros; dom: .tsx e clipboard browser + integração, setup React/matchMedia/cleanup exclusivo. Isolamento por arquivo mantido. Node native testa runners/parser/ESLint. Cada arquivo deve executar uma vez; novas dependências DOM exigem classificação explícita, não cair silenciosamente em ambiente errado.

Worker usa workspace e Vitest próprios, não pertence à descoberta app. Env/runtime são gerados por Wrangler (sem tipos manuais duplicados). Contraprova de mutation vive em Worker auxiliar exclusivo de testes; produção habilita somente health/contexto local. Integração aceita certificado local só no runner; nunca NODE_TLS_REJECT_UNAUTHORIZED=0 ou confiança global. Stack/processos próprios são encerrados em finally; sinais e limpeza de fixtures não compartilham cancelamento.

Não alterar timeouts/retries para esconder falha. Coverage SQL não é V8. Thresholds DataTable: 95% statements/lines, 85% branches, 90% functions. Specs E2E usam retry2 em CI já existente; gate local sem retry, serial Chromium. Erros assíncronos usam assertions auto-wait; testes focam contratos/a11y, não classes ou upstream internals.

Banco: CAS/claim/manager/sessão 50 conexões; lease 2/5/10/50; losers cardinalidade somente 23505; RPCs service_role, fixtures constraint postgres; IDs sintéticos e cleanup finally, sem TRUNCATE. Nenhuma transação aberta durante I/O externo. T24–T29 são parcelas DB, não jornada completa.

<a id="c3"></a>

## Catálogo completo

<a id="catalog"></a>

Inventário de arquivos e cenários declarados; nomes de casos não são contagem de execuções parametrizadas. Nenhuma suite é omitida/duplicada. AST do catálogo é conferida contra disco; a execução verifica descoberta e outcomes.

### tests/unit/app

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/unit/app/app-error-boundary.test.tsx` | reporta a falha e permite recuperação |
| `tests/unit/app/query-provider.test.ts` | tenta novamente apenas falhas recuperáveis e com limite; respeita Retry-After antes de usar backoff exponencial; declara defaults seguros sem desativar revalidação por foco |
| `tests/unit/app/route-access-policy.test.ts` | exige todas as capabilities declaradas; não trata freshness transacional como estado global da rota; nega políticas desconhecidas, contraditórias ou com propriedades extras; só redireciona para autenticação quando o destino é configurado; compõe as políticas da hierarquia sem permitir que o filho enfraqueça o pai; nega uma hierarquia sem política de acesso |
| `tests/unit/app/session-fallbacks.test.tsx` | anuncia o bootstrap como estado de carregamento; bloqueia novo retry enquanto a sessão está sendo consultada |
| `tests/unit/app/session-provider.test.tsx` | descarta refresh cancelado antes de alterar sessão ou limpar cache; impede operação obsoleta de limpar cache criado por operação mais recente; limpa cache quando a autoridade do mesmo usuário muda; não permite que refresh interrompa logout em andamento; diferencia bootstrap de autoridade indisponível; cancela o bootstrap ao desmontar; cancela refresh em andamento ao desmontar; preserva sessão e cache quando o refresh falha; remove apenas cache vinculado à identidade ao encerrar a sessão; preserva sessão e cache quando o logout falha; limpa cache reaproveitado quando bootstrap resolve nova autoridade |

### tests/unit/components

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/unit/components/app/app-alert-dialog.test.tsx` | expõe descrição acessível e encaminha o cancelamento; usa as ações nativas e permite omitir o cancelamento |
| `tests/unit/components/app/app-badge.test.tsx` | mantém o ícone decorativo |
| `tests/unit/components/app/app-calendar.test.tsx` | usa o fuso local do navegador quando nenhum fuso é informado; preserva um fuso explícito do consumidor |
| `tests/unit/components/app/app-combobox.test.tsx` | expõe opções de uma lista sem grupos; expõe grupos e filtra pelo próprio input; mantém uma lista parcialmente agrupada sem cabeçalhos; encaminha seleção e limpeza nativa |
| `tests/unit/components/app/app-dialog.test.tsx` | fecha pelo DialogClose do rodapé; permite alterar ou omitir o fechamento do rodapé |
| `tests/unit/components/app/app-empty.test.tsx` | aplica o nível de heading e mantém o ícone decorativo; compõe o avatar e seu fallback dentro de EmptyMedia |
| `tests/unit/components/app/app-sheet.test.tsx` | fecha pelo SheetClose padrão do rodapé; permite alterar ou omitir o fechamento do rodapé |
| `tests/unit/components/app/app-tooltip-button.test.tsx` | preserva o disabled nativo do Button sem executar a ação; mostra tooltip no hover e executa a ação habilitada; reporta falha ao gerar o CSV |
| `tests/unit/components/data-table/data-table-actions.test.tsx` | exporta todas as linhas do modelo filtrado na ordem corrente; bloqueia exportação de registros existentes durante atualização |
| `tests/unit/components/header/header-notifications.test.tsx` | abre e fecha o painel por teclado; anuncia carregamento sem disponibilizar ações ou navegação; marca uma notificação como lida e navega para seu destino; encaminha a marcação de todas como lidas; impede ações duplicadas durante a marcação pendente; navega para ver todas e fecha o painel |
| `tests/unit/components/header/header-user-menu.test.tsx` | abre o menu e navega para o destino de perfil recebido; altera e persiste o tema pelo submenu; encaminha o logout ao consumidor; impede outro logout enquanto a operação está pendente |
| `tests/unit/components/toast/toast.test.tsx` | exibe uma notificação enviada pela API pública |

### tests/unit/features

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/unit/features/auth/auth-runtime-config.test.ts` | permanece desabilitado na ausência de configuração; aceita candidate sem habilitar upstream no browser |
| `tests/unit/features/clients/client-mapper.test.ts` | normaliza o contrato ERP sem inferir os indicadores textuais; preserva campos textuais vazios aceitos pelo ERP; formata e valida CPF e CNPJ pelo contrato compartilhado; rejeita respostas e campos incompatíveis com o contrato |
| `tests/unit/features/clients/client-presentation.test.ts` | normaliza nomes e cidades sem expandir abreviações do ERP; corrige somente a apresentação de descrições conhecidas; aplica máscaras somente quando o formato de origem é reconhecido; padroniza ausências, flags e e-mails múltiplos |
| `tests/unit/features/clients/client-preview-data.test.ts` | fornece uma coleção sintética determinística sem metadados internos |
| `tests/unit/features/clients/client-record-presentation.test.ts` | mantém todos os campos do cliente no contrato de apresentação |
| `tests/unit/features/clients/client-vehicle-mapper.test.ts` | normaliza os campos existentes no ERP; aceita veículo e motorista vazios quando o ERP envia texto vazio; rejeita uma resposta que não seja lista |
| `tests/unit/features/clients/client-vehicle-record-presentation.test.ts` | mantém todos os campos do veículo no contrato de apresentação |
| `tests/unit/features/clients/client-vehicles-data-table.test.tsx` | renderiza somente os veículos do cliente e preserva colunas internas ocultas; copia dados funcionais do veículo selecionado; encontra o veículo pela placa formatada |
| `tests/unit/features/clients/clients-data-table-query.test.tsx` | mantém o boundary ocupado até a carga inicial concluir; mantém o estado inicial quando a consulta está pausada sem dados; isola a falha inicial e permite refazer a consulta; preserva dados e não repete erro de refetch cacheado após remontagem |
| `tests/unit/features/clients/clients-data-table.test.tsx` | renderiza dados do domínio e mantém colunas configuradas como ocultas; copia um e-mail adicional; copia os dados funcionais do cliente selecionado; expõe as opções de cidade derivadas dos dados; encontra o cliente pelo telefone formatado mesmo com a coluna oculta |
| `tests/unit/features/units/unit-mapper.test.ts` | preserva nomes canônicos do ERP e normaliza apenas tipos técnicos; preserva o nome do estado recebido e normaliza sua UF; aceita identificador inteiro em número, string ou bigint; descarta coordenadas opcionais inválidas e ignora metadados internos; rejeita respostas e campos obrigatórios inválidos |
| `tests/unit/features/units/unit-presentation.test.ts` | formata valores ERP em caixa alta somente para apresentação; preserva acentos e capitalização já fornecidos pela origem; preserva siglas e rodovias, mas não confunde Rio e Sul com siglas |
| `tests/unit/features/units/unit-preview-data.test.ts` | fornece as unidades do espelho histórico sem metadados internos |
| `tests/unit/features/units/unit-record-presentation.test.ts` | mantém todos os campos da unidade no contrato de apresentação; preserva o valor canônico no modelo e formata cópia e CSV; apresenta Paraná e Paranaguá corretamente a partir do espelho |
| `tests/unit/features/units/units-data-table-query.test.tsx` | mantém o boundary ocupado até a carga inicial concluir; isola a falha inicial e permite refazer a consulta; preserva dados e notifica uma vez quando o refetch falha |
| `tests/unit/features/units/units-data-table.test.tsx` | combina cidade e bandeira e exporta apenas a interseção; renderiza dados normalizados e mantém metadados internos ocultos; copia dados funcionais da unidade selecionada; exporta o conjunto completo na ordem selecionada antes da paginação; exporta somente registros correspondentes à faceta ativa; encaminha a busca para o modelo local; expõe estado vazio e permite limpar somente a busca ativa |

### tests/unit/lib

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/unit/lib/browser/browser-clipboard.test.ts` | encaminha o valor para a Clipboard API; propaga falhas da Clipboard API |
| `tests/unit/lib/http/http-client.test.ts` | DTO estrito/null/unknown; MIME/JSON/UTF-8/16KiB; origem/headers proibidos; GET retry único, 408/425 não autoritativos e Retry-After sem truncar; POST sem retry; 403 sem logout; signal/timeout/timers; stream cancelado; input não serializável e base64url canônico |
| `tests/unit/lib/csv-export.test.ts` | serializa cabeçalho, CRLF e campos que exigem aspas |
| `tests/unit/lib/erp/erp-brazilian-states.test.ts` | resolve nomes canônicos das 27 UFs por sigla; rejeita siglas desconhecidas |
| `tests/unit/lib/erp/erp-date-time.test.ts` | normaliza ISO e timestamps PostgreSQL com fuso explícito; rejeita datas impossíveis e date-times sem fuso |
| `tests/unit/lib/erp/erp-record.test.ts` | sanitiza apenas espaços e caracteres de controle; unifica identificadores inteiros em string; distingue inteiro obrigatório de texto opcional |
| `tests/unit/lib/erp/erp-tax-id.test.ts` | valida e formata CPF e CNPJ; rejeita documentos com tamanho ou dígitos verificadores inválidos |
| `tests/unit/lib/erp/hub-contracts.test.ts` | aceita campos opcionais ausentes e não fabrica quantidade zero; mantém códigos de veículo e cliente distintos e ignora metadados fora da resposta |

### tests/unit/shared

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/unit/shared/auth-contracts.test.ts` | mantém fechado o tipo canônico de authority purpose; aceita a projeção pública estrita e rejeita campos inesperados; rejeita null, shape desconhecido, capability e assurance não canônicas (T03); fecha as etapas restricted por jornada e rejeita combinações cruzadas; totaliza transições, exige fatos e falha fechado para estados desconhecidos; formaliza IDs opacos internos como UUID v4 sem aceitar segredos arbitrários; expõe scope estrito com chave externa opaca, sem presumir UUID; valida identificadores humanos canônicos sem coerção; rejeita OTP fora do formato ou comando com campo extra; mantém login como comando fechado; mantém a política central versionada e os limites canônicos de F01 |
| `tests/unit/shared/auth-freshness.test.ts` | aceita exatamente 300 s e 30 s futuros (T10) |
| `tests/unit/shared/auth-ports.test.ts` | expõe somente contratos tipados da fronteira F01 sem selecionar adapters |
| `tests/unit/shared/auth-problem.test.ts` | mantém o mapa fechado de códigos e status; rejeita status divergente, código desconhecido e campos inesperados (T21) |
| `tests/unit/shared/auth-provisioning.test.ts` | portas estreitas CPF/provisioning; audit allowlisted sem secrets ou extras; outcomes owned/absent/unknown/conflict; envelope CPF e reserva com fence estritos |
| `tests/unit/shared/authorization.test.ts` | contém as 17 capabilities Users do contrato; falha fechado para capability desconhecida |
| `tests/unit/shared/password-policy.test.ts` | normaliza NFC antes de contar e preserva espaços (T31) |

### tests/integration

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/integration/app-routing.test.tsx` | atualiza o título ao navegar e restaura a identidade na rota desconhecida; monta o shell na rota raiz; resolve a rota interna sem registrá-la em appRoutes; reconhece a rota dinâmica de detalhe do cliente; mantém o fallback desconhecido fora do shell |
| `tests/integration/app-shell-navigation.test.tsx` | deriva o item e a seção ativos da rota atual; mantém o item pai ativo em uma rota descendente; mantém somente uma seção aberta; permite fechar manualmente a seção da rota ativa; descarta o override manual ao navegar para outra seção; não mantém uma seção contextual ao navegar para um item principal; fecha o menu mobile após navegar; mantém a navegação funcional com a Sidebar recolhida |
| `tests/integration/app-shell-sign-out.test.tsx` | usa feedback público urgente quando o logout falha |
| `tests/integration/app-shell.test.tsx` | expõe o header e seus controles como banner da aplicação; não oferece ação no estado sem novas notificações |
| `tests/integration/data-table.test.tsx` | renderiza tabela nativa, caption e primeira página; busca imediatamente ignorando acentos e permite limpar; volta à primeira página quando o filtro reduz os resultados; ordena com aria-sort e exporta todas as linhas antes da paginação; filtra a faceta, atualiza as contagens e limpa os filtros; pagina, altera tamanho e controla visibilidade; deriva o skeleton da página e bloqueia controles na carga inicial; oculta paginação no estado vazio; preserva os dados e controles durante atualização em background; apresenta erro persistente com retry; oferece ação de cópia por linha; mantém a tabela utilizável quando a cópia falha |
| `tests/integration/route-access-boundary.test.tsx` | preserva pathname, query e hash ao redirecionar; nega acesso quando um match contém handle inválido |
| `tests/integration/route-error-boundary.test.tsx` | Casos parametrizados e integração do escopo. |
| `tests/integration/theme.test.tsx` | persiste a preferência selecionada e aplica o esquema resolvido; acompanha mudanças da preferência do sistema |

### tests/e2e

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/e2e/app.spec.ts` | busca cidade acentuada do espelho e combina filtros de unidades; distingue códigos de veículo e cliente sem tipografia mono ou tabular; monta o shell da aplicação; resolve uma rota por deep link; navega pelo menu lateral no desktop; fecha o menu lateral mobile após navegar; mantém o fallback de rota fora do shell; mantém a rolagem horizontal dentro da tabela de unidades; filtra, pagina e abre clientes e veículos sem depender da copy; filtra, ordena e pagina unidades sem depender da copy; mantém clientes responsivos e foco de teclado em 390 px; aplica e persiste o tema escuro; abre os e-mails adicionais por teclado e devolve foco ao fechar |
| `tests/e2e/rmc.spec.ts` | exibe as prévias inline dos componentes compartilhados; abre e fecha overlays e mantém o rodapé visível durante a rolagem; mantém a prévia utilizável em 390 px |

### tests/scripts

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `tests/scripts/docs-model.test.mjs` | Markdown parser resolves references, ids, repeated headings and code inventories; local links cannot escape the repository and external links are not fetched; Vitest discovers every unit/integration suite exactly once in node or dom |
| `tests/scripts/auth-provider-poc.test.mjs` | PoC F04 nega URL remota/UUID não allowlisted; ownership apenas em app_metadata; telefone confirmado, prova extra e recurso alheio negados; redirect/limite, cancelamento antes do provider, cleanup não cancelado e listeners removidos |
| `tests/scripts/auth-provisioning-integration.test.mjs` | Comando da fixture estrito; UUIDs, operações e fault injection allowlisted; rejeita campos/credenciais extras antes de I/O |
| `tests/scripts/shared-imports.test.mjs` | effective ESLint config denies runtime/UI/SDK/I-O imports in shared contracts |
| `tests/scripts/validation-process.test.mjs` | Report directories isolated from Playwright cleanup; success/sanitized failure; timeout/cancellation/unavailable command/output overflow; stop after failure with outcomes; nonempty schema diff; concurrent gate exclusion and lock release; refusal of preexisting stack; cleanup of owned startup on failure |
| `tests/scripts/worker-runner.test.mjs` | Workspace isolado/falha interrompe sequência; URLs remotas/probes ambíguos negados; descoberta Worker exatamente uma vez; appVitest5 e WorkerVitest4 preservados |

### worker/tests

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `worker/tests/worker-boundary.test.ts` | API404 com AcceptHTML e disabled; health/método; configuração hosted fechada; catch sanitizado/headers; 8192/8193 sem length/multibyte; MIME/encoding/JSON; stream lento/deadline; URL/Cookie limites; todas as combinações conflitantes de autoridade; Origin/Host/Fetch Metadata e subresources; desafio 401; token estável, stale e mismatch negados antes de side effect no auxiliar; vetor AES-GCM independente, codec/algorithm desconhecidos, purpose/binding/version/tamper/key separation |
| `worker/tests/worker-upstream.test.ts` | URL somente local; SDK request-scoped/redirect negado/signal; sem Cookie browser; respostas RPC MIME/64KiB/DTO inválidos; rede indisponível sem vazamento |
| `worker/tests/worker-cpf-crypto.test.ts` | AES-GCM/HMAC com vetor independente Node, nonce aleatório, binding/generation/tag/version adulterados negados, chaves CPF separadas, retenção/retirada de chave histórica, cancelamento e canonicalização CPF |
| `worker/tests/worker-provisioning-provider.test.ts` | F04 create/read local request-scoped, UUID/prova/credencial interna; admission stale e command alterado sem side effect; ausência somente lookup explícito; ownership alterado, user_metadata, redirect, MIME/JSON/limite e perda de resposta sem retry |
| `worker/tests/worker-provisioning-store.test.ts` | RPCs allowlisted, cardinalidade, binding/fence/generation, resposta estrita, confirmação consistente e commit com request ID; ausência de headers browser |
| `worker/tests/worker-provisioning-saga.test.ts` | Reserva antes do efeito, replay terminal, resposta perdida, lookup inconclusivo/404 sem abort, prova divergente, confirmação stale, falha audit e cancelamento |
| `worker/tests/worker-provisioning-reconciler.test.ts` | Local explícito, disabled/remote sem I/O, lease/circuit durável, lote bounded e respostas estritas/cancelamento sem criação |
| `tests/unit/shared/auth-provisioning-policy.test.ts` | Base users.create, NORMAL aal2, hierarquia inferior, fresh vinculado à intenção/sessão, geração e scope unit fail-closed |

### supabase/tests/database

| Arquivo | Cenários/contratos cobertos |
| --- | --- |
| `supabase/tests/database/auth_hardening.test.sql` | Bindings/challenge-outbox atômicos, NULL/UUID/hash/envelope, lifecycle/fence/expiry/budget, imutabilidade, superadmins, assignments e grants. |
| `supabase/tests/database/auth_invariants.test.sql` | Cardinalidade, CAS one-time, intenção idempotente/conflito e leases. |
| `supabase/tests/database/auth_roles.test.sql` | PUBLIC/anon/authenticated/service_role reais, grants/RLS/invoker e acesso direto/RPC. |
| `supabase/tests/database/auth_schema.test.sql` | Objetos/colunas/constraints/índices, schemas privados, RLS e propriedades das funções. |
| `supabase/tests/database/auth_csrf.test.sql` | Material exclusivo/imutável; grants/roles/invoker; PREAUTH+CSRF atômico; hash/codec/algorithm explícitos e desconhecidos negados; stale generation/token errado/invalidation/expiry; binding adulterado; limpeza limitada; limite IP/global e chaves IP não criadas após bloqueio global |
| `supabase/tests/database/auth_prerequisites.test.sql` | CPF source/lookup atômico, CAS, dual-write obrigatório, backfill/cutover/rollback com generation; invoker/grants; reserva idempotente, UUID/binding/lease, unknown versus absent; commit PENDING e audit/outbox únicos; falha de audit reverte commit e generation stale nega |
| `supabase/tests/database/auth_dispatch.test.sql` | Admissão de dispatch única e irreversível, leitura sem consumo, fence/binding/lifecycle stale, grants mínimos e função invoker com search_path vazio |
| `supabase/tests/database/auth_reconciliation.test.sql` | Claim exclusivo com tentativa durável, backoff mesmo após lease expirada, prazo imutável, contador não reiniciável e grants/invoker |
| `supabase/tests/database/auth_controlled_operations.test.sql` | Day-zero operador-only, primeiro S PENDING/one-time e dados cifrados; batch/circuit persistidos, owner/fence e grants |
| `supabase/tests/database/auth_provisioning_authorization.test.sql` | Fonte PHONE controlada/grants/nega substituição; prova intenção/sessão/generations, consumo único; lookup após revogação sem mutation/commit, fence de compensação e ausência inconclusiva escalada |
| `supabase/tests/database/auth_provisioning_review.test.sql` | Nomes RPC legados não contornam autorização; primitives privadas; conflito fenced persistido com audit/outbox únicos, replay e exclusão de retries |

Concorrência adicional em `scripts/auth-db/auth-db-context-concurrency.mjs`: dez conexões para criação atômica, dez leituras estáveis e dez invalidações (um vencedor); duas rodadas no mesmo stack do gate. O runner HTTPS `scripts/worker/worker-integration.mjs` prova API/SPA/cookie HttpOnly e dez leituras concorrentes com PostgreSQL real. São procedimentos adicionais, não suites Vitest omitidas.

Pré-F04/F04: `scripts/auth-db/auth-db-prerequisites-concurrency.mjs` disputa CPF com duas conexões, nega duplicata entre versões; disputa reserva provider, dispatch, lease de reconciliação, first-S day-zero e batch com dez conexões cada; exige um vencedor e nega fence antigo. Duas rodadas no gate; limpeza restrita aos IDs sintéticos e rollback da política mantendo generation monotônica.

F04 primeiro marco: `npm run test:provider:local` executa `worker/scripts/worker-provider-poc.mjs`, com gate DB próprio (dois resets/concorrências/pgTAP) e PoC Auth real local. Reserva persistida antes de createUser, UUID/selector/ownership server-only, telefone não confirmado, associação PENDING e audit; cleanup só do recurso sintético comprovado sem sessões. Prova Node separada dos testes do adapter Workers; não comprova saga/day-zero/target. Recusa stack preexistente e URL remota; pode apagar somente o banco local de testes pertencente ao runner.

<a id="c4"></a>

## Evidência e limitações

Baseline F02 comprovou 54 arquivos/227 Vitest, 126 assertions pgTAP e 19 Chromium no SHA bc8ab3c; esses totais não são prova desta branch. Manutenção permanece [histórica](../auth/evidence/pre-f03-maintenance-local.md). O [manifesto F03](../auth/evidence/F03-local.md) registra 55 arquivos/246 testes aplicação, 19 Worker, 17 tooling, 156 pgTAP e 19 E2E por navegador no SHA 4f63abf. Relatório runner é auxiliar: totais de casos vêm do runner real, não de parser de títulos.

Billing hospedado é falha de infraestrutura; merge exige autorização/waiver explícito naquela PR. Firefox/WebKit/DOM não provam leitor de tela, provider, RLS target, load ou release. Nenhum snapshot ou fixture real é anexado.

<a id="c5"></a>

## Fontes

[Vitest projects](https://vitest.dev/guide/projects), [Coverage](https://vitest.dev/guide/coverage), [Playwright CI](https://playwright.dev/docs/ci), [Testing Library](https://testing-library.com/docs/guiding-principles/), [Supabase tests](https://supabase.com/docs/guides/local-development/testing/overview).
