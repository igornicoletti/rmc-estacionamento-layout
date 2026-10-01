# ADR-002 — Perfil de persistência Auth

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
