# Decisões derivadas de Auth

**Natureza:** referência vigente. **Escopo:** ADRs aceitas, sem alteração normativa.
**Revisão:** 01/10/2026. **Baseline:** `74c7b24e647691e28df7935871c1b9afb6e34826` + F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [ADR-001 — Identificadores opacos](#c1)
- [ADR-002 — Perfil de persistência](#c2)
- [Precedência e limites](#c3)
- [ADR-003 — Transporte e runtime F03](#c4)

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
