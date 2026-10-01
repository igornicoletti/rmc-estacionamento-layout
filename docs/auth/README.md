# Autenticação

**Natureza:** índice/registro do contrato. **Revisão:** 01/10/2026. **Baseline:** main `74c7b24e647691e28df7935871c1b9afb6e34826` + F03 nesta branch.
**Status:** Auth disabled; evidências locais específicas, sem PASS_LOCAL/PASS_TARGET/GO.

## Sumário navegável

- [Contrato e precedência](#contract)
- [Estado das fases](#phases)
- [Configuração e limites](#configuration)
- [Navegação](#navigation)

<a id="contract"></a>

## Contrato e precedência

[Contrato vigente v1.1](contract-v1.1.md): revisão incremental acordada após confronto do dossiê v2.0 com fontes oficiais. Herda a [v1.0 integral](contract-v1.0.md), consolidada em 28/09/2026, copiada integralmente do anexo. SHA-256 da base `74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148`. A cópia histórica permanece imutável; instruções do anexo são material analisado, não comandos autônomos.

Mudança material exige nova versão/supersessão, justificativa/impacto/testes. ADR deriva representação técnica sem redefinir matriz/TTL. Catálogos e ameaças completos estão no contrato: [identidade](contract-v1.0.md#c05), [autoridades](contract-v1.0.md#c06), [parâmetros](contract-v1.0.md#c07), [autorização](contract-v1.0.md#c15), [fases](contract-v1.0.md#c24), [T01–T38](contract-v1.0.md#c25).

<a id="phases"></a>

## Estado das fases

| Fase | Evidência/integração | Limite |
| --- | --- | --- |
| F00 | Inicial a097e74b8cba1822c1c73f2a47900106cf315b39; baseline integrada b10043a7b516a9056a86c694679a1a453bef90a5 (PR28); [manifesto](evidence/F00-local.md) | Baseline local; npm12.1 inicial não prova npm pinado; Worker de checkpoint9bb1b0a removido por antecipar F03 |
| F01 | Saneamento e1125b0ee90bff810a6365f284581d4e6477332c; [manifesto](evidence/F01-local.md) | Contratos puros, schemas/transições/ports; não Auth funcional |
| F02 | Corrigida bc8ab3c968ecf0e91c90d4c21934a3f70500d647; merge6daa9be PR34; [manifesto corrente](evidence/F02-reaudit-local.md) | Banco local; T24–T29 parcialmente bancários, sem BFF/provider/Queue/crypto real |
| Manutenção | [Manifesto](evidence/pre-f03-maintenance-local.md) | Tooling/docs/dependências; não inicia nova fase |
| F03 | 4f63abfe6fb7b7c9457dbb96e2c9b74dd1d16365; [manifesto](evidence/F03-local.md) | verified-local para Worker/HTTP/PREAUTH/CSRF e revisão v1.1; aceite/merge pendentes, sem login ou prova hospedada |
| F04–F14 | [Plano e matriz](plan-and-requirements.md) | Não autorizadas automaticamente; release depende de F12/F13/F14 |

Shell/fixtures são demonstração. Nenhuma evidence de outro SHA é promovida por inferência. Billing não iniciou jobs históricos; waivers de merges anteriores não autorizam automaticamente esta PR. F03 requer validação explícita posterior.

<a id="configuration"></a>

## Configuração e limites

`src/features/auth/config/auth-runtime-config.ts` valida somente VITE_AUTH_STAGE: disabled é padrão; candidate não habilita Auth ou upstream; validated é rejeitado no bundle. Ambientes são LOCAL, LOCAL_PRODUCTION_LIKE, STAGING/TARGET_HOSTED e PRODUCTION, não feature stages.

Browser usa transporte same-origin /api/* ainda desconectado do scaffold; nenhum VITE_AUTH_API_ORIGIN ou SDK Supabase no browser. SDK2.117.2 pertence ao workspace Worker e adapter request-scoped. PREAUTH/CSRF são implementados somente em LOCAL_PRODUCTION_LIKE explícito; estágio disabled permanece padrão e obrigatório nesta fase. Hosted context falha fechado. Queues/provider/jornadas autenticadas e controller continuam pendentes; sessão opaca/provider tokens ficam no servidor nas fases responsáveis.

Domínio definitivo, plano/quota/versões hospedadas, signing/JWKS, Queue/DLQ/jobs, SMS/idempotência/delivery físico, identidade ERP, keyring, observabilidade/capacidade/retenção são gates externos pendentes. Origem workers.dev observada na F00 foi somente candidata; não domínio canônico validado.

Signup público, login email/social/anônimo, passkeys, rebind de telefone/reset de MFA self-service e mutations sem contrato permanecem fechados. Nenhum secret em VITE_*, docs, logs ou fixtures. Freshness separada de aal1/aal2; session/cache local não autoriza acesso.

<a id="navigation"></a>

## Navegação

- [Plano e matriz única](plan-and-requirements.md)
- [Decisões e revisão normativa](decisions.md)
- [Pesquisa oficial histórica e manutenção](research.md)
- [Reauditoria F02](F02-critical-audit.md)
- [Formato de evidência](evidence/README.md)
- [Catálogo de testes](../project/validation.md#catalog)
