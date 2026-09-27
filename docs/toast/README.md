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
- `src/index.css`: aplica somente a cor semântica dos ícones por seletores de estado/slot, sem alterar o componente nativo.
- `<scope>-notify.ts`: conteúdo e semântica pertencentes ao escopo.

O projeto está configurado com `style: "base-luma"` e `iconLibrary: "lucide"` em `components.json`. A fonte Inter é carregada em `src/index.css`. Os tokens `success`, `info`, `warning` e `error` são tokens semânticos da aplicação/brand, não do tema Luma.

O `rounded-2xl` presente no Toast instalado no projeto faz parte da escolha visual Luma. No registry atual do shadcn essa mesma decisão é aplicada por `.cn-toast { @apply rounded-2xl; }`; essa diferença de implementação não justifica reescrever o primitive durante mudanças de Notify.

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

A documentação do Base UI define `data-type` no `Toast.Root`. O componente shadcn instalado expõe `data-slot="toast"` e `data-slot="toast-icon"`. A aplicação combina esses atributos no CSS global para colorir somente o SVG, sem editar `ui/toast.tsx`:

```css
[data-slot="toast"][data-type="success"] [data-slot="toast-icon"] > svg {
  color: var(--success);
}
```

O mesmo padrão é usado para `info`, `warning` e `error`.

O Toast Base UI não usa a antiga configuração visual do Sonner baseada em `toastOptions` no `Toaster`. O tipo é exposto no próprio Toast por `data-type`, que é a superfície usada para a estilização externa.

## Regras principais

- features não importam `ui/toast` diretamente;
- `AppProviders` pode importar somente `Toaster`;
- `toast-notify.ts` pode importar somente `toast`;
- o código nativo do shadcn não recebe customizações de produto;
- atualizações dos primitives `ui/` são manutenção separada e explícita;
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
- https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/styles/style-luma.css
