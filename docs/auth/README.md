# Autenticação

Esta pasta registra a implementação incremental do **Contrato canônico de autenticação, sessão, autorização e acesso — v1.0**. O contrato permanece a fonte normativa; estes documentos registram apenas o estado do checkout e a rastreabilidade da implementação.

## Estado atual

O bloco **F00 — baseline e ameaça** foi encerrado como baseline local no merge `b10043a7b516a9056a86c694679a1a453bef90a5` (PR #28). Esse encerramento não é `PASS_LOCAL`, `PASS_TARGET` nem autorização de release.

O próximo bloco de implementação é **F01 — contratos puros**. Nenhum fluxo real de autenticação foi habilitado pela F00: não há BFF de Auth, adapter Supabase, persistência Auth, Queue/DLQ, SMS, MFA, sessão funcional ou endpoint privado implementado por esse bloco.

O shell e as fixtures já existentes continuam sendo demonstração visual e não representam sessão autenticada nem autorização de produção.

A ordem seguinte permanece a definida pelo contrato: F01 contratos puros, F02 persistência e F03 fronteira BFF. O Worker, o roteamento `/api/*`, os adapters de provider e os contratos HTTP serão introduzidos somente nos respectivos blocos.

- [Registro do contrato e baseline F00](contract-registry.md)
- [Plano de implementação F01–F14](implementation-plan.md)
- [Matriz viva de requisitos](requirements-matrix.md)
- [Contrato de evidências](evidence/README.md)

## Configuração pública

`src/features/auth/config/auth-runtime-config.ts` valida apenas `VITE_AUTH_STAGE`.

Valores aceitos:

- `disabled` — padrão; nenhum fluxo Auth é habilitado;
- `candidate` — identifica configuração candidata para auditoria; não habilita Auth nem seleciona upstream.

`validated` não é aceito pelo bundle como feature stage público. Esse estado depende de manifesto e evidência das fases de prova.

A aplicação futura acessará o BFF por caminhos **same-origin** (`/api/*`). Não existe `VITE_AUTH_API_ORIGIN`, nem SDK Supabase no browser, neste baseline.

Nunca inclua chaves, tokens, cookies, URLs privilegiadas ou outros segredos em variáveis `VITE_*`.
