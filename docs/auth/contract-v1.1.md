# Contrato canônico de autenticação — v1.1

**Natureza:** revisão normativa incremental. **Data:** 01/10/2026. **Status:** revisão acordada; implementação/prova limitada às fases correspondentes, Auth disabled. **Baseline:** v1.0 imutável e F03 em revisão. **Responsável pelo aceite operacional:** mantenedor do projeto.

## Sumário navegável

- [Precedência e proveniência](#precedence)
- [Decisões da auditoria](#audit)
- [Identidade e persistência](#identity)
- [Autoridades, cookies e contexto](#context)
- [MFA, credenciais e revogação](#mfa)
- [HTTP e criptografia](#boundary)
- [Provas e gates](#proof)
- [Fontes verificadas](#sources)

<a id="precedence"></a>

## Precedência e proveniência

O contrato vigente é a composição da [v1.0 integral](contract-v1.0.md) com esta revisão. Disposições não substituídas permanecem obrigatórias; em divergência explícita, esta revisão prevalece. Não são duas autoridades concorrentes. Os IDs de requisitos existentes permanecem estáveis; o dossiê não os renumera nem autoriza comandos por si próprio.

SHA-256 da v1.0: `74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148`. Errata de inventário: existem 160 IDs únicos declarados, não os 157 indicados no fechamento da v1.0. Seus bytes históricos não são alterados.

Material analisado: Dossiê de auditoria v2.0, SHA-256 `C1204398809DC124314A07434A82DA532E237B359B8AA79A273303D0B4D3EA39`. A versão 2.0 identifica a auditoria, não uma versão integral substituta do contrato. A alegação de auditorias independentes não foi certificada nesta revisão.

DTOs atuais anunciam `contractVersion: "1.1"` e rejeitam versões desconhecidas. Eventos históricos v1.0 permanecem identificados como tal; novas gravações usam v1.1. Evidências anteriores não comprovam automaticamente esta revisão.

<a id="audit"></a>

## Decisões da auditoria

| Achado P0 do dossiê | Disposição desta revisão | Fase responsável |
| --- | --- | --- |
| 01–03: identificador, senha e ownership provider | Concretizar seletor técnico, credencial interna e UUID pré-alocado; não adotar usuário sem ownership | F04 |
| 04: transação | RPC estreita; definir isolamento/locks/CAS por comando, sem presumir snapshot único de múltiplas instruções READ COMMITTED | F02 e jornadas |
| 05: cookies | Matriz determinística abaixo; ambiguidades negadas | F03/F06–F09 |
| 06: step-up | Prova one-time consumida no commit e vinculada à intenção | F07/F10 |
| 07: enrollment | Claim exclusivo e pós-condição comprovada no provider | F07 |
| 08: JWT/JWKS | Verificação local não prova sessão provider ativa; preservar verificação online até protocolo de revogação comprovado | F07/F08 |
| 09–10: senha | NFC/bytes/blocklist já obrigatórios; não apresentar como omissão nova nem reavaliar blocklist no login | F06/F09 |
| 11: CPF/rotação | Fonte recuperável privada cifrada; rotação com unicidade entre versões | F02/F04 |
| 12–13: SMS/Units | Preservar gates externos existentes, não declarar defeito funcional já provado | F05/F10/F13 |
| 14: MFA privilegiado | S/A obrigatórios antes de NORMAL; alteração deliberada de MFA-01/02 | F07/F10 |
| 15: envelope | Codec versionado binário; JSON não é formato obrigatório | F03/F05/F08 |
| 16: bootstrap | Contexto coerente e CSRF da mesma autoridade; nenhum terceiro endpoint necessário | F03/F08/F11 |
| 17: supply chain | Inventário, secrets, lifecycle scripts e proveniência como gates proporcionais | F12–F14 |
| 18: rede | Origem/Host/edge e allowlist; TLS de driver PostgreSQL somente se essa arquitetura for adotada | F03/F13 |

As ampliações acima não habilitam fluxos futuros. O plano/matriz registra parcelas implementadas e pendências; as 18 classificações P0 não equivalem a 18 vulnerabilidades demonstradas na F03.

<a id="identity"></a>

## Identidade e persistência

O login funcional permanece CPF/senha. O adapter traduz o lookup privado para email técnico `u-<provider-uuid>@<domínio-controlado>`, nunca email pessoal, CPF ou telefone. UUID v4 provider é reservado no ledger antes da chamada externa. Domain real e comportamento da versão target devem ser provados antes de habilitar provisioning.

“Sem senha temporária” significa sem credencial comunicada ao usuário. O provider pode exigir/gerar credencial interna aleatória de alta entropia; ela não é OTP, não é entregue, não é registrada em plaintext e não autoriza NORMAL. A redação literal “sem senha” da saga é substituída por essa distinção.

Ownership depende do ledger e metadados server-only `app_metadata` vinculados ao comando; `user_metadata`, email técnico ou mera existência de usuário não são prova. Resposta perdida exige consulta por UUID reservado e reconciliação. Compensação só remove recurso cuja propriedade foi comprovada.

CPF recuperável fica exclusivamente em envelope autenticado privado, finalidade separada `CPF`, acesso restrito e sem plaintext em coluna/log/DTO. Lookup continua HMAC versionado. Antes de dados reais, migration e testes devem provar rotação/backfill e unicidade entre versões sob concorrência; não alterar a representação silenciosamente. F03 não introduz dados pessoais.

Toda mutation autoritativa define transação, precondições, CAS/fence, isolamento e locks apropriados. Chamada RPC é transacional, mas READ COMMITTED não promete um snapshot comum a todas as instruções. Nunca manter transação aberta durante chamadas de rede. Mesma chave/intenção recupera resultado persistido; intenção diferente conflita.

<a id="context"></a>

## Autoridades, cookies e contexto

Cookies reconhecidos: `__Host-rmc-preauth`, `__Host-rmc-journey`, `__Host-rmc-session`. Dois ou três cookies reconhecidos simultâneos, duplicação ou valor malformado são rejeitados com 403 antes do efeito; nunca escolher cookie dominante. Ausência não equivale a cookie inválido. Cookies desconhecidos não conferem autoridade.

| Endpoint/grupo canônico | Autoridade admitida quando implementado | Troca/invalidação |
| --- | --- | --- |
| GET context | Nenhuma: cria PREAUTH; exatamente uma: projeção da autoridade vigente e CSRF | Leitura não renova TTL, generation ou token |
| GET session | Exatamente NORMAL | Projeção, nunca bootstrap paralelo |
| login; activation/request; recovery/request | PREAUTH | Sucesso troca pela jornada restrita correspondente; apaga PREAUTH após commit |
| login/mfa/verify | Jornada MFA_PENDING | Sucesso promove e apaga journey após commit |
| activation/resend, verify | Jornada de ativação na etapa esperada | Verificação promove BOOTSTRAP; generation anterior invalidada |
| activation/password, complete | BOOTSTRAP na etapa esperada | Promoção só após condições; apaga journey após commit |
| recovery/resend, verify, password | Jornada recovery na etapa esperada | Fence/invalidação; não autentica nem remove MFA |
| journey; journey/cancel | Exatamente jornada restrita vigente | Cancelamento invalida somente a jornada e apaga journey |
| mfa/enroll, verify, cancel | BOOTSTRAP security setup ou NORMAL conforme policy e enrollment vinculado | Não amplia autoridade por mera criação de fator |
| step-up/challenge, verify; password/change; activity; logout | Exatamente NORMAL e precondições específicas | Logout invalida sessão, apaga session; não cancela outra autoridade por inferência |

Paths/métodos são os do [capítulo 19](contract-v1.0.md#c19), sem refresh/signup/bootstrap públicos novos. Etapa, identidade, generation e binding são verificados no servidor; label de jornada não é novo nível de AAL.

Na F03 somente GET context PREAUTH local explícito e health existem. Journey/NORMAL isolados retornam indisponibilidade, nunca conversão a PREAUTH; endpoints futuros retornam 404. Nenhuma combinação da matriz é sucesso simulado.

Contexto e CSRF devem corresponder à mesma observação transacional, generation e expiry. A extensão a NORMAL exige snapshot/locks definidos antes de F08/F11; compor dois GETs de gerações diferentes é proibido. Leituras concorrentes reentregam token estável. Corrida entre bootstraps distintos resulta em 403 sem efeito, sem retry automático de mutation.

Cookies usam Secure, HttpOnly, SameSite=Strict, Path=/, sem Domain; Max-Age limitado ao prazo restante. Apagamento preserva esses atributos e usa Max-Age=0 após commit. Epoch browser não impede sozinho Set-Cookie de resposta antiga: promoção e logout exigem fence/reconciliação servidor nas respectivas fases.

<a id="mfa"></a>

## MFA, credenciais e revogação

S/A não recebem NORMAL antes de fator TOTP confirmado. Após prova da senha, BOOTSTRAP security setup só permite configurar segurança; promoção atômica exige fator e policy atuais. Isso substitui a permissão v1.0 de S/A opt-in em aal1. Política adicional para R/M exige decisão do responsável antes de target; O conserva opt-in. Nenhuma configuração pendente autoriza acesso privilegiado.

Enrollment tem claim exclusivo por identidade, intenção/generation persistidas, consulta antes/depois e confirmação de ownership/cardinalidade no provider. Fator externo inesperado ou resultado ambíguo bloqueia promoção e exige reconciliação; não apagar fator alheio.

Step-up gera prova descartável vinculada a identidade, sessão/generation, commandId, capability, alvo/versão e hash da intenção. TTL máximo 300 s e tolerância futura máxima 30 s. Validar e consumir a prova na mesma transação do efeito; não basta endpoint verify retornar sucesso. Código TOTP e segredo do fator não entram no ledger.

JWT assimétrico pode ser verificado localmente com JWKS, issuer/audience/algoritmo/expiração allowlisted. JWT válido não prova sessão provider ativa. Remover consulta online exige protocolo comprovado de revogação/fences e janela residual explícita; até então ela permanece requisito do adapter. Mudanças administrativas controladas fecham fence BFF antes da chamada provider; revogação emergencial fora do BFF exige bloqueio/reconciliação antes de reabrir tráfego. Cache JWKS e rotação devem considerar cache upstream e SDK.

Preservar política de senha v1.0: NFC consistente, limites em code points e bytes, teto provider, bloqueio de comprometidas em cada escrita de senha e fail-closed se dependência obrigatória falhar. Login normaliza a representação, não reaplica política/blocklist de criação a cada tentativa. TOTP não é phishing-resistant; não alegar conformidade formal AAL2 NIST sem os requisitos adicionais da norma.

<a id="boundary"></a>

## HTTP e criptografia

Validar origem configurada, URL efetiva e Host disponível; headers encaminhados arbitrários não são autoridade. Hosted exige prova do edge/domínio. Contexto sensível rejeita cross-site/same-site, destino image/script/document e modo navigate; Fetch Metadata ausente não concede autoridade e segue controles de origem, cookie e limiter. Mutation sempre exige Origin exato e CSRF válido. Não habilitar CORS permissivo.

Requisição tem limite efetivo 8.192 bytes durante streaming, URL 2.048 bytes e Cookie 4.096 bytes. Content-Length não substitui contagem. Rejeitar encoding comprimido não suportado com 415. Limites derivados de implementação: resposta Auth 16 KiB e RPC 64 KiB, incluindo erros; onde Fetch decodifica automaticamente, o limite é aplicado aos bytes efetivamente entregues, sem alegar medição do wire comprimido.

Budget Worker 12 s, upstream 5 s, browser 15 s/tentativa e 30 s total; cancelar streams/fetch/timers/listeners e verificar deadline antes da resposta. Timeout não prova rollback. Mutation não repete automaticamente. GET no máximo uma repetição elegível; Retry-After superior ao budget restante informa espera, sem truncar para antecipar retry.

Problemas RFC 9457 têm status/code coerentes, título público, requestId e no-store, sem stack/SQL/secret. Resposta 401 inclui `WWW-Authenticate: RMCSession realm="rmc"`, desafio específico da aplicação para sessão opaca por cookie; não solicita Bearer JWT nem se apresenta como esquema HTTP padronizado.

Codec CSRF 1: algoritmo A256GCM, chave 256 bits, nonce aleatório 96 bits e tag 128 bits; bytes `IV || ciphertext || tag` (60 bytes para segredo de 32 bytes). AAD UTF-8 é `JSON.stringify([purpose,binding,keyVersion])`; binding é `JSON.stringify([1,contextId,authorityPurpose,generation])`. Metadados codecVersion/algorithm/keyVersion/purpose são explícitos; versão/algoritmo/purpose/shape desconhecidos são negados antes de decrypt. Mudança de codec exige nova versão, nunca reinterpretar bytes existentes.

Chaves COOKIE/CSRF/RATE são distintas inclusive entre versões, token/segredo aleatórios de 256 bits com base64url canônico, HMAC-SHA-256 e comparação segura no runtime. Retirada de chave exige prova de expiração/reconciliação das autoridades e compatibilidade de restore; backups não justificam descifração indefinida. Novas finalidades têm keyring/política próprios.

CSP scripts não usa unsafe-inline/unsafe-eval. Exceção documentada `style-src-attr 'unsafe-inline'` atende estilos dinâmicos dos componentes; não amplia script-src e deve ser testada. API nunca cai no HTML; HTML revalida e assets fingerprinted usam immutable. HSTS/preload dependem do domínio target. SQL direto/pooler não é requisito do adapter RPC HTTP; se adotado, TLS/hostname/pooling/prepared statements exigem ADR e provas próprias.

<a id="proof"></a>

## Provas e gates

Manter T01–T38 e associar propostas T39–T63 do dossiê ao requisito/phase antes de executá-las, sem duplicar IDs normativos. Na F03 provar parcelas de cookie/origem/contexto/codec/HTTP; provisioning, enrollment, revogação, step-up, SMS, Units e supply chain target continuam nas fases responsáveis.

T39 distingue senha provider já alterada de promoção funcional: resposta perdida não pode promover identidade PENDING para NORMAL sem commit. T43 deve declarar o caminho de verificação/revogação realmente escolhido. Concorrência deve usar conexões independentes e afirmar um resultado único, não “rejeitado ou cancelado”.

F12 registra inventário/SBOM, audit, análise de lifecycle scripts e varredura de secrets com ferramentas/limitações explícitas; F13/F14 provam artefato implantado, proveniência disponível, chaves, revogação, restore e operação. Dry-run, dados sintéticos e billing bloqueado não são prova target. Nada nesta revisão autoriza F04, merge, secrets ou release.

<a id="sources"></a>

## Fontes verificadas

Consulta em 01/10/2026; versões hospedadas não inferidas dessas páginas:

- [Supabase createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) e [fonte Auth fixada](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/api/admin.go): comportamento interno não equivale à versão target.
- [Sessões](https://supabase.com/docs/guides/auth/sessions), [signing keys](https://supabase.com/docs/guides/auth/signing-keys), [senha](https://supabase.com/docs/guides/auth/password-security) e [MFA](https://supabase.com/docs/guides/auth/auth-mfa).
- [PostgREST transactions](https://docs.postgrest.org/en/stable/references/transactions.html), [PostgreSQL RLS](https://www.postgresql.org/docs/17/ddl-rowsecurity.html) e [libpq TLS](https://www.postgresql.org/docs/17/libpq-ssl.html).
- [RFC 9110 §15.5.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2), [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html), [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) e [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).
- [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/) e [Queue at-least-once](https://developers.cloudflare.com/queues/reference/delivery-guarantees/).
