# Registro de decisões

**Status:** decisões v1 aprovadas e implementadas no escopo atual.

## Decisões consolidadas

- API pública: `notify(FeedbackDefinition): void`.
- `notify()` é função normal, não Hook.
- Catálogo pertence ao menor domínio/escopo semanticamente proprietário.
- Referência TypeScript real; sem token string.
- `type` pertence à definição: `success | info | warning | error`.
- `priority` é opcional: `low | high`; `error` não implica `high`.
- `title` obrigatório; `description` opcional.
- conteúdo restrito a string; sem HTML/JSX/ReactNode.
- conteúdo dinâmico por factory pura com um objeto nomeado.
- catálogos usam `as const satisfies FeedbackCatalog`.
- definição inline em `notify()` permanece proibida por contrato.
- adapter seleciona campos explicitamente, não usa spread, não expõe ID e não captura exceções do manager.
- erro técnico não é conteúdo público.
- sem sanitizer/redactor/parser universal na v1.
- timeout customizado, lifecycle/promise, dedupe, actions e observabilidade permanecem fora da v1.
- TanStack Query não é dependência do dispatcher e não existe política global de Toast.
- acesso direto ao manager é restringido por ESLint, preservando `Toaster`.

## Pilotos implementados

### Session

Validou catálogo de domínio, erro público controlado e preservação de `priority: "high"` quando já existia necessidade acessível.

### Clients

Validou factory dinâmica real:

```ts
CLIENTS_FEEDBACK.emailCopied({ email })
```

O parâmetro é mínimo/tipado e a definição permanece no domínio.

### DataTable / Clipboard

A operação técnica de Clipboard foi desacoplada do feedback visual.

A cópia genérica de registros é orquestrada pelo escopo DataTable, com catálogo compartilhado para evitar duplicação entre Clients, Units e outros consumidores.

O `catch` classifica somente a Clipboard API; falha do próprio manager não é convertida em feedback de falha da cópia.

## Alternativas rejeitadas

- `t()` por ambiguidade com i18n;
- `useNotify()` sem Hook real;
- `notify.success/error` por duplicar `type`;
- tokens string/registry runtime;
- objetos inline em `notify()`;
- catálogo global único;
- Provider/Context/store/event bus sem necessidade;
- sanitizer HTML;
- parser universal de erros;
- Toast automático para toda mutation/query;
- callbacks dentro de catálogo;
- feedback visual dentro de utilitário técnico como `copyToClipboard`;
- mapear todo `error` para prioridade alta.

## Gate para novas expansões

Novos catálogos/capacidades só entram mediante evento real. Mudanças no contrato exigem nova revisão documental antes da implementação.
