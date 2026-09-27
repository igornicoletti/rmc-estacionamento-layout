# Toast

Documentação ativa da infraestrutura de notificações transitórias da aplicação.

## Estrutura

```text
src/components/ui/toast.tsx
src/components/toast/toast-contract.ts
src/components/toast/toast-notify.ts
<scope>/content/<scope>-notify.ts
```

- `ui/toast.tsx`: primitive visual baseado em shadcn/Base UI.
- `toast-contract.ts`: tipos aceitos pela aplicação.
- `toast-notify.ts`: única API de despacho usada pelos consumidores.
- `<scope>-notify.ts`: conteúdo e semântica pertencentes ao escopo.

## Uso mínimo

```ts
import { notify } from "@/components/toast/toast-notify"
import { sessionNotify } from "@/app/session/content/session-notify"

notify(sessionNotify.signOutFailed)
```

Para conteúdo dinâmico:

```ts
notify(clientsNotify.emailCopied({ email }))
```

## Regras principais

- consumidores não importam o manager de `ui/toast`;
- `Toaster` é montado somente em `AppProviders`;
- mensagens técnicas de `Error` não são exibidas diretamente;
- `type: "error"` não implica `priority: "high"`;
- conteúdo específico permanece no escopo que o possui;
- comportamento reutilizável é testado uma vez na sua fronteira pública.

## Referências

- Arquitetura: `docs/toast/architecture.md`
- Uso: `docs/toast/usage.md`
- Testes: `docs/toast/testing.md`
- Evoluções: `docs/toast/roadmap.md`

Fontes oficiais:
- https://ui.shadcn.com/docs/components/base/toast
- https://base-ui.com/react/components/toast
