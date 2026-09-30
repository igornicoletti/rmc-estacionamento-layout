# ADR-001 — Identificadores opacos de Auth

## Estado

Aceito para F01/F02. Esta decisão não habilita Auth nem substitui os gates de banco, BFF ou target.

## Contexto

O contrato exige identificadores internos opacos e imutáveis, mas não define formato. A F01 anterior aplicava um alfabeto e comprimento arbitrários, enquanto a F02 precisa de chaves reproduzíveis e constraints explícitas. Segredos autenticadores são outra categoria e não podem ser confundidos com IDs públicos.

## Decisão

- `identityId`, `contextId`, `commandId`, `challengeId`, session ID interno, journey ID interno e IDs de eventos usam UUID v4.
- UUID é representação técnica, não prova de autorização, ownership, existência ou aleatoriedade suficiente para autenticar.
- Cookies, CSRF, OTP, idempotency secrets e demais autenticadores usam o número de bits definido na política própria; nunca reutilizam UUID como segredo.
- Chaves externas de Units permanecem texto opaco canônico, com `sourceSystem`; não são convertidas para UUID. O contrato ERP observado usa `cod_empresa`, mas a autoridade dessa identidade só será comprovada na F10.
- DTOs podem expor apenas IDs explicitamente previstos. A posse de um ID nunca concede leitura, retry, resultado de comando ou acesso a sessão.

## Consequências

- Schemas runtime rejeitam UUID que não seja v4 para IDs criados pelo RMC.
- PostgreSQL 17 usará `uuid` e geração aleatória suportada pelo stack local escolhido na F02.
- Migração futura de formato exige ADR de supersessão e não altera IDs existentes silenciosamente.
