# Decisões derivadas de Auth

**Natureza:** referência vigente. **Escopo:** decisões derivadas e revisão normativa explicitamente identificada.
**Revisão:** 01/10/2026. **Baseline:** main3c4b6d4 + saneamento pré-F04 em revisão.
**Status:** decisões explícitas; resultados por SHA nos manifestos, não inferidos desta referência.

## Sumário navegável

- [ADR-001 — Identificadores opacos](#c1)
- [ADR-002 — Perfil de persistência](#c2)
- [Precedência e limites](#c3)
- [ADR-003 — Transporte e runtime F03](#c4)
- [ADR-004 — Revisão normativa v1.1](#c5)
- [ADR-005 — Fundamentos pré-F04 e rotação CPF](#c6)
- [ADR-006 — Admissão persistida de dispatch](#c7)

<a id="c1"></a>

## ADR-001 — Identificadores opacos

### Estado

Aceito para F01/F02. Esta decisão não habilita Auth nem substitui os gates de banco, BFF ou target.

### Contexto

O contrato exige identificadores internos opacos e imutáveis, mas não define formato. A F01 anterior aplicava um alfabeto e comprimento arbitrários, enquanto a F02 precisa de chaves reproduzíveis e constraints explícitas. Segredos autenticadores são outra categoria e não podem ser confundidos com IDs públicos.

### Decisão

- `identityId`, `contextId`, `commandId`, `challengeId`, session ID interno, journey ID interno e IDs de eventos usam UUID v4.
- UUID é representação técnica, não prova de autorização, ownership, existência ou aleatoriedade suficiente para autenticar.
- Cookies, CSRF, OTP, idempotency secrets e demais autenticadores usam o número de bits definido na política própria; nunca reutilizam UUID como segredo.
- Chaves externas de Units permanecem texto opaco canônico, com `sourceSystem`; não são convertidas para UUID. O contrato ERP observado usa `cod_empresa`, mas a autoridade dessa identidade só será comprovada na F10.
- DTOs podem expor apenas IDs explicitamente previstos. A posse de um ID nunca concede leitura, retry, resultado de comando ou acesso a sessão.

### Consequências

- Schemas runtime rejeitam UUID que não seja v4 para IDs criados pelo RMC.
- PostgreSQL 17 usará `uuid` e geração aleatória suportada pelo stack local escolhido na F02.
- Migração futura de formato exige ADR de supersessão e não altera IDs existentes silenciosamente.

<a id="c2"></a>

## ADR-002 — Perfil de persistência

Aceito como decisão técnica derivada do contrato v1.0 para F02. Não altera requisitos, autoridades, TTLs ou gates. Estabelece a representação que o contrato deixou a cargo da implementação.

- HMAC/hash persistente usa SHA-256 (32 bytes) e chaves separadas por finalidade. O banco valida tamanho; o adapter comprova algoritmo, canonicalização e separação de domínio.
- Envelope binário usa `IV de 12 bytes || ciphertext || tag GCM de 16 bytes`. O mínimo persistente é 29 bytes para payload não vazio. AAD inclui identidade/contexto, purpose e generation; `binding_hash` referencia a representação canônica desse binding. Chaves e IVs reais não entram no Git. A autenticação do envelope será provada no adapter Web Crypto.
- `functional_sessions.generation`/`journey_transactions.generation` representam o contexto. `identity_generation` captura o fence da identidade. Refresh muda a generation do contexto sem redefinir o fence de conta; revogação de identidade invalida contextos cuja captura diverge. Fencing token do lease é outro contador monotônico.
- Refresh ciphertext possui `refresh_purpose='PROVIDER_REFRESH'`, `refresh_binding_hash` e `refresh_key_version` próprios; não reutiliza automaticamente a key version do cookie.
- IDs RMC seguem ADR-001 (UUID v4). `provider_subject` continua ID externo; Units usa `(source_system, external_unit_key)` opaco. UUID nunca autentica.
- `result_payload` genérico permanece NULL ou objeto vazio até existir schema específico de resultado sanitizado na fase consumidora. `result_code` representa o resultado durável; request/status continuam sujeitos à autorização do BFF.
- Reason codes de audit são os códigos públicos F01 e outcomes fechados de persistência. Eventos, capabilities e versão do contrato têm allowlists; novos valores requerem migration revisada. Metadados gerados pelo servidor ainda exigem redaction no adapter.
- Grants atuais correspondem somente às RPCs presentes. `UPDATE(id)` viabiliza row locks em invoker e triggers impedem mudar a chave. Nenhum grant é criado antecipadamente para mutation de identidade, assignments ou audit.
- Migrations são a fonte evolutiva. Dumps são derivados, normalizados somente quanto a whitespace e referenciados por SHA-256. O hardening F02 pressupõe reconstrução local vazia; não inventa secret hashes para linhas existentes.

Referências: [Web Crypto](https://www.w3.org/TR/WebCryptoAPI/), [CHECK/FK PostgreSQL](https://www.postgresql.org/docs/17/ddl-constraints.html), [row locks](https://www.postgresql.org/docs/17/sql-select.html) e [funções invoker Supabase](https://supabase.com/docs/guides/database/functions).

<a id="c3"></a>

## Precedência e limites

Obrigação aplicável/decisão explícita posterior → contrato vigente → decisão derivada → implementação/evidência. Mudança material exige versão/supersessão; código não altera contrato. Crypto/Queue/Audit são ampliação deliberada do plano mestre como portas puras: não são adapters ou prova operacional. [Contrato](contract-v1.0.md#c01), [matriz](plan-and-requirements.md#c5).

<a id="c4"></a>

## ADR-003 — Transporte e runtime F03

Aceito conforme plano aprovado em 01/10/2026; não altera contrato v1.0. Respostas Auth limitadas a 16 KiB e RPC a 64 KiB incluindo erro. Budget browser total 30 s, tentativa 15 s, jitter 100–500 ms; Worker 12 s, upstream 5 s são parâmetros canônicos. POST nunca repete automaticamente; GET no máximo uma repetição elegível. Retry-After superior ao budget é informado, nunca truncado.

Workspace npm privado worker compartilha lockfile raiz; Vitest app 5.0.3 e Worker 4.1.11 coexistem porque plugin 1.3.4 exige ^4.1.0. Wrangler 4.145.0 gera Env/runtime com compatibility_date 2026-10-01. Não usar force/legacy-peer-deps ou downgrade global.

Adapter Worker usa redirect manual e rejeita todo 3xx, pois runtime não implementa error; nenhuma Location é seguida ou repassada. Browser usa redirect error nativo. A diferença mantém a mesma política de negar redirects, comprovada no runtime e no HTTPS real.

F03 habilita somente PREAUTH local com Auth disabled, origem fixa HTTPS localhost:8787, banco 127.0.0.1:55321 e listener loopback. Rate local: 60 criações/min por chave HMAC loopback confiável e 600/min global; headers IP do caller não são autoridade. Reentrega não conta criação. Falha de limiter retorna indisponibilidade. Limpeza limitada a lotes de 100 por tabela em RPC durante criação; scheduler e capacidade target continuam pendentes.

Segredos de 256 bits base64url canônico; cookie e CSRF usam domínios/chaves distintos. AES-256-GCM nonce aleatório 96 bits/tag 128 bits; AAD JSON canônico [purpose,binding,keyVersion], onde binding é JSON [1,contextId,purpose,generation]. Binding hash corresponde ao binding UTF-8; comparação timing-safe no runtime. Material não gira em GET. Preparação de vínculo session não habilita NORMAL; promoção/expiração/logout completos exigem fases posteriores.

Headers HTML mantêm hashes originais e style-src-attr unsafe-inline por posicionamento Base UI. HSTS includeSubDomains anteriormente estático foi removido até prova do domínio/subdomínios; sem preload. Integração HTTPS não equivale a deploy, PASS_LOCAL global ou PASS_TARGET.

`worker/worker-env.d.ts` preserva a saída integral de Wrangler/workerd 1.20260930.2, incluindo cinco espaços finais emitidos pelo gerador. `.gitattributes` dispensa somente blank-at-eol nesse arquivo gerado; demais regras e arquivos escritos manualmente permanecem estritos. O diff completo da branch é revisado além do working diff, e `types --check` continua comparando o output nativo sem normalização manual.

<a id="c5"></a>

## ADR-004 — Revisão normativa v1.1

Aceita como revisão solicitada pelo responsável após confronto do dossiê v2.0; não é mera derivação da v1.0. [Texto vigente](contract-v1.1.md) identifica substituições, matriz de cookies e fases responsáveis. A base, snapshots e evidências históricas permanecem intactos.

F03 altera versão dos DTOs para 1.1, explicita codec CSRF 1/A256GCM sem alterar ciphertext/AAD e adiciona migration incremental que preserva audit 1.0. Validação HTTP nega Host/URL divergentes e subresource/navigation de contexto; problemas 401 incluem desafio específico RMCSession. Vetor criptográfico independente e contraprovas runtime/SQL/HTTPS sustentam esses ajustes.

Seletores técnicos, UUID provider reservado, CPF recuperável cifrado, enrollment exclusivo e step-up consumido no commit ficam nas fases responsáveis, não são funcionalidades concluídas. S/A obrigatórios antes de NORMAL é mudança normativa explícita; política adicional R/M exige decisão antes de target. Verificação JWT local não substitui revogação provider sem protocolo provado. TLS/pooler direto permanece condicional à arquitetura, não requisito do adapter HTTP.

Alternativas rejeitadas: editar bytes da v1.0; copiar 125 IDs como nova autoridade duplicada; remover verificação online por otimização; criar endpoint bootstrap sem necessidade; impor JSON ao envelope binário; afirmar CSP sem exceção de styles; transformar evidências de outros SHAs em prova v1.1. Nenhum desses ajustes habilita Auth ou F04.

<a id="c6"></a>

## ADR-005 — Fundamentos pré-F04 e rotação CPF

Implementação autorizada em 01/10/2026 após a reauditoria; gate/aceite próprios, sem iniciar F04. Migrations anteriores e fontes integrais são imutáveis. As novas RPCs são infraestrutura privada, não autorização de negócio nem endpoints HTTP. SDK provider/day-zero/compensação, scope/unit/step-up e writers públicos continuam fases futuras.

CPF codec 1: A256GCM, IV aleatório de 12 bytes + CPF canônico cifrado (11 bytes) + tag de 16 bytes = 39 bytes. AAD UTF-8 JSON [1,"A256GCM","CPF",identityId,generation,keyVersion], preservando o purpose normativo v1.1. Keyring CPF próprio separa source AES e lookup HMAC; configuração deve negar reutilização de todas as chaves de outras finalidades, incluindo históricas. Adapter não é conectado a Env/rota; F04 deve injetar conjunto completo de chaves proibidas. HMAC-SHA-256 sobre UTF-8 JSON ["CPF_LOOKUP",keyVersion,CPF]. Não aplicar esse formato a hashes históricos sem comprovar sua origem. DB recebe somente hashes/envelope; não recebe CPF, senha ou OTP. Buffer/string de CPF fica transitoriamente na fronteira crypto autorizada, nunca no ledger/log/audit.

Policy singleton fixa active_version e pending_version com generation monotônica. Todo writer toma lock compartilhado da policy, depois identidade/source; exige as duas versões durante rotação e CAS da revisão. Controle administrativo toma lock exclusivo, sem EXECUTE para service_role. Begin exige fontes recuperáveis para lookups existentes; backfill calcula novos hashes no boundary crypto. Finish exige cobertura integral antes de trocar current; rollback não apaga hashes nem reduz generation. Aliases staged diferem explicitamente de retired: só staged da versão pendente pode ser ativado. Retired não revive. Legacy sem hash na versão ativa é negado, não reinterpretado.

Envelope só pode ser regravado por CAS, preservando hashes da pessoa. Rotação de chave AES é independente da rotação HMAC: manter versões de decrypt necessárias até reseal/backfill/restore e retenção comprovados. Retirar chave somente após inventário de envelopes/backups e drill; esta rodada não destrói chaves nem dados. Fontes antigas sem envelope exigem procedimento controlado, nunca adivinhação ou preenchimento automático. Não é possível provar no PostgreSQL que hashes de chaves diferentes pertencem ao mesmo CPF: responsabilidade do crypto boundary; política dual-write fecha a lacuna de unicidade no acesso autorizado.

Generation atual da identidade é precondição para ler o envelope privado; generation persistida no envelope é o binding usado para decrypt. Alteração de lifecycle não destrói recuperabilidade: reseal controlado pode atualizar binding/revision por CAS. A leitura cifrada não concede reveal ou qualquer authority; decryption continua restrita ao boundary autorizado. Fontes de identidades DELETED não são expostas por essa RPC; retenção/purge/restore administrativos precisam de procedimento específico antes de dados reais.

Reserva provider aloca UUID e ownership binding no banco, vinculados ao commandId, target e generation. Lease 30 s, fence monotônico; outcome UNKNOWN não é ABSENT. Lease expirada permite um novo claimant, não uma transação SQL mantida durante chamada externa. Associação só aceita UUID/binding reservados e proof confirmado; lifecycle permanece PENDING. Ledger, associação, audit e audit_outbox confirmam na mesma transação; falha audit desfaz tudo. Actor lifecycle é revalidado quando vinculado, mas sessão/capability/scope e exceção day-zero exigem boundary F04/F10; essa RPC não autoriza invocação por browser.

Event schema v1.1 é estrito: tipos/outcomes/reasons/capabilities/purposes/deployments allowlisted, request/event IDs UUID v4, sem texto livre. Histórico audit v1.0 permanece permitido no banco; não é reemitido como evento v1.1. Resultado de command ledger só amplia o schema para identityId exato do target em PROVISION_IDENTITY COMMITTED; nenhum payload genérico. RLS permanece defesa adicional, não contenção de service_role BYPASSRLS.

Fontes verificadas: [locks PostgreSQL17](https://www.postgresql.org/docs/17/explicit-locking.html), [funções Supabase](https://supabase.com/docs/guides/database/functions) e [Web Crypto Workers](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/). Runtime do projeto prevalece sobre exemplos antigos de integração Vitest da skill: manter plugin atual pinado, não retornar ao antigo pool Workers.

<a id="c7"></a>

## ADR-006 — Admissão persistida de dispatch

**Data:** 01/10/2026. **Escopo:** F04 local em implementação, sem endpoint público. Reserva idempotente não impede dois callers da mesma lease de executar create. Uma RPC invoker consome atomicamente uma permissão irreversível por comando, sob locks command → reservation → identities ordenadas. Revalida owner, fence, UUID/binding, generation, prazo e lifecycle; leituras não consomem a permissão. Grants não transformam service_role BYPASSRLS em papel contido por RLS.

Não é exactly-once: crash após admissão e antes do POST deixa pendência durável. Timeout não prova rollback; GET404 posterior pode preceder confirmação de uma criação ainda em execução. O reconciler só consulta o UUID reservado, nunca repete create ou aborta por esse 404. Prova OWNED permite confirmação e commit atomicamente auditado; conflito não permite adoção/deleção. Replay terminal retorna resultado persistido sem novo efeito.

Admissão de reserva não é autorização completa de capability/scope/AAL. Day-zero, backoff/limite persistido de reconciliação e compensação segura continuam gates da F04. Adapter e saga não estão conectados ao Worker produtivo. Transporte RPC limitado é compartilhado com contexto F03, mantendo allowlists separadas e clientes request-scoped.

Continuação técnica local: até oito claims lookup-only em 24 horas, backoff 60/120/240/480/960/1920/3600/3600 segundos, lease de 30 s. Claims consumidos antes do GET, inclusive se o worker morrer; contador/prazo não reiniciam e lease expirada não ignora backoff. Esgotamento preserva pendência para resolução controlada, sem abort/recreate automático. Valores são política inicial de implementação, não números atribuídos ao contrato nem capacidade target validada. Agendamento/batches/circuit breaker e runbook de resolução ainda não comprovados.

Runner local: bootstrap PostgreSQL antes dos resets e API depois de schema reconstruído. Causa observada do startup anterior: PostgREST 503/SQLSTATE3F000 por schema exposto ausente no volume restaurado; não falha de internet demonstrada. Health checks não foram desabilitados e nenhum volume/outro stack foi removido.

Contraprova DB adicional: ABSENT não pode tornar ABORTED uma reserva cujo dispatch já foi consumido. Mesmo se um caller invocar diretamente a RPC de outcome, trigger rejeita esse abort; apenas ausência pré-dispatch continua elegível. Compensação posterior exige protocolo próprio de fencing/revogação, não reutilização de ABSENT. Migration incremental preserva as anteriores.

Fontes: [locks PostgreSQL17](https://www.postgresql.org/docs/17/explicit-locking.html), [funções Supabase](https://supabase.com/docs/guides/database/functions), [consulta administrativa por UUID](https://supabase.com/docs/reference/javascript/auth-admin-getuserbyid) e [Fetch Workers](https://developers.cloudflare.com/workers/runtime-apis/fetch/). Fontes consultadas em 01/10/2026; prova real de composição Workers/DB/provider ainda pendente.
