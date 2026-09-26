# Feedback transitório `notify()` — v1

**Status:** arquitetura implementada no escopo atual; merge condicionado à validação local final.

## Implementado

- contrato tipado e adapter `notify()`;
- catálogos pelo menor domínio/escopo proprietário;
- Session/logout com prioridade acessível preservada;
- enforcement ESLint do manager de Toast;
- Clipboard técnica desacoplada de feedback;
- DataTable com ação/catálogo compartilhados;
- Clients com primeiro feedback dinâmico real;
- testes das fronteiras implementadas.

## Princípios

```ts
notify(SCOPE_FEEDBACK.event)
notify(SCOPE_FEEDBACK.event({ namedData }))
```

Operações técnicas não incorporam política visual. Erros técnicos não são conteúdo público. TanStack Query não possui política global de Toast.

## Fora da v1

Timeout customizado, actions, dedupe, lifecycle/promise, observabilidade e automação global de mutations.

## Gate

O HEAD final deve passar testes focados, lint, typecheck, build e `check:full` localmente antes do merge.
