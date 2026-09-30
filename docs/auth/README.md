# Autenticação

Esta pasta registra a implementação incremental do **Contrato canônico de autenticação, sessão, autorização e acesso — v1.0**. O contrato permanece a fonte normativa; estes documentos registram apenas o estado do checkout e a rastreabilidade da implementação.

## Estado atual

O bloco em andamento é **F00 — baseline e ameaça**. Nenhum fluxo real de autenticação foi habilitado por esta fase: não há BFF de Auth, adapter Supabase, persistência Auth, Queue/DLQ, SMS, MFA, sessão funcional ou endpoint privado implementado por este bloco.

O shell e as fixtures já existentes continuam sendo demonstração visual e não representam sessão autenticada nem autorização de produção.

A ordem seguinte permanece a definida pelo contrato: F01 contratos puros, F02 persistência e F03 fronteira BFF. O Worker, o roteamento `/api/*`, os adapters de provider e os contratos HTTP serão introduzidos somente nos respectivos blocos.

- [Registro do contrato e baseline F00](contract-registry.md)

## Configuração pública

`src/features/auth/config/auth-runtime-config.ts` valida apenas `VITE_AUTH_STAGE`.

Valores aceitos:

- `disabled` — padrão; nenhum fluxo Auth é habilitado;
- `candidate` — identifica configuração candidata para auditoria; não habilita Auth nem seleciona upstream.

`validated` não é aceito pelo bundle como feature stage público. Esse estado depende de manifesto e evidência das fases de prova.

A aplicação futura acessará o BFF por caminhos **same-origin** (`/api/*`). Não existe `VITE_AUTH_API_ORIGIN`, nem SDK Supabase no browser, neste baseline.

Nunca inclua chaves, tokens, cookies, URLs privilegiadas ou outros segredos em variáveis `VITE_*`.
