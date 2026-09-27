# Toast

Documentação ativa das notificações transitórias da aplicação.

## Estrutura

```text
src/components/ui/toast.tsx
src/components/toast/toast-contract.ts
src/components/toast/toast-notify.ts
src/index.css
<scope>/content/<scope>-notify.ts
```

- `ui/toast.tsx`: componente nativo instalado pelo shadcn para Base UI. Não recebe customizações da aplicação.
- `toast-contract.ts`: tipos aceitos pela aplicação.
- `toast-notify.ts`: API de despacho usada pelos consumidores e única camada de produção autorizada a importar `toast`.
- `src/index.css`: aplica somente a cor semântica dos ícones por seletores públicos `data-type` e `data-slot`.
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

## Montagem

Seguindo a documentação oficial do shadcn, `AppProviders` importa `Toaster` diretamente de `@/components/ui/toast` e o monta como componente global:

```tsx
{children}
<Toaster />
```

Não existe `AppToaster` nem outro wrapper visual sobre o componente nativo.

## Cores dos ícones

Base UI documenta `data-type` no `Toast.Root`, e o componente shadcn expõe `data-slot="toast-icon"`. A aplicação usa esses atributos no CSS global, sem editar `ui/toast.tsx`:

```css
[data-slot="toast"][data-type="success"] [data-slot="toast-icon"] > svg {
  color: var(--success);
}
```

O mesmo padrão é usado para `info`, `warning` e `error`.

## Regras principais

- features não importam `ui/toast` diretamente;
- `AppProviders` pode importar somente `Toaster`;
- `toast-notify.ts` pode importar somente `toast`;
- o código nativo do shadcn não recebe customizações de produto;
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
- https://ui.shadcn.com/docs/cli
- https://base-ui.com/react/components/toast
