# Toast

Documentação ativa das notificações transitórias da aplicação.

## Estrutura

```text
src/components/ui/toast.tsx
src/components/common/app-toast.tsx
src/components/toast/toast-contract.ts
src/components/toast/toast-notify.ts
<scope>/content/<scope>-notify.ts
```

- `ui/toast.tsx`: primitive shadcn/Base UI protegido. Feature work não altera esse arquivo.
- `app-toast.tsx`: wrapper da aplicação. Centraliza renderer customizado, idioma e tokens visuais.
- `toast-contract.ts`: tipos aceitos pela aplicação.
- `toast-notify.ts`: API de despacho usada pelos consumidores.
- `<scope>-notify.ts`: conteúdo e semântica pertencentes ao escopo.

O projeto está configurado com `style: "base-luma"` em `components.json`. O tema base é carregado por `shadcn/tailwind.css`; tokens adicionais da aplicação permanecem em `src/index.css`.

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

- código de aplicação não importa `ui/toast` diretamente;
- `AppToast` é a única fronteira autorizada sobre o primitive;
- `AppProviders` monta `AppToaster`;
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
