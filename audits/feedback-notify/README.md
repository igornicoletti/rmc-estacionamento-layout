# Auditoria e implementação — Feedback transitório `notify()`

**Projeto:** `rmc-estacionamento-layout`  
**Base original auditada:** `main@32d6cae6a9fe31a744fc9f042c91fe0d1f4d6818`  
**Última revisão:** 26/09/2026  
**Status:** arquitetura v1 implementada no escopo atual; merge bloqueado até validação local final.

## Objetivo

Centralizar feedback transitório em uma API semântica e tipada:

```ts
notify(SCOPE_FEEDBACK.event)
```

ou, para conteúdo dinâmico:

```ts
notify(SCOPE_FEEDBACK.event({ namedData }))
```

O catálogo pertence ao menor domínio/escopo semanticamente proprietário. `notify()` somente adapta a definição ao manager existente. Operações técnicas reutilizáveis não incorporam política visual.

## Implementado

- contrato TypeScript e adapter `notify()`;
- `type` e `priority` controlados pela definição;
- Session/logout migrado com prioridade acessível preservada;
- enforcement ESLint contra acesso direto ao manager;
- Clipboard desacoplada de feedback visual;
- ação/catálogo reutilizáveis para cópia de registros da DataTable;
- primeiro feedback dinâmico real em Clients;
- testes das fronteiras próprias;
- documentação arquitetural e de rollout.

## Fora da v1

Permanecem deliberadamente fora: timeout customizado, actions, dedupe, lifecycle/promise, observabilidade e automação global de TanStack Query.

## Gate de merge

O HEAD final deve passar localmente:
1. `git diff --check`;
2. testes focados;
3. lint e typecheck;
4. build;
5. `check:full`;
6. revisão do diff final.

O GitHub Actions não é evidência confiável enquanto jobs forem encerrados sem runner (`runner_id: 0`, `steps: []`).
