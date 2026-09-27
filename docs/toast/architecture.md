# Arquitetura

## Responsabilidades

### `src/components/ui/toast.tsx`

Componente nativo shadcn/Base UI já instalado no projeto. É tratado como primitive protegido e não recebe customizações da aplicação.

O projeto usa `style: "base-luma"` e `iconLibrary: "lucide"` em `components.json`. O Toast instalado mantém `rounded-2xl`, coerente com o estilo Luma. No registry atual do shadcn, a mesma decisão visual é aplicada por `.cn-toast { @apply rounded-2xl; }` em `style-luma.css`.

Mudanças estruturais do registry não são aplicadas automaticamente durante feature work. Atualizações de arquivos em `src/components/ui` são manutenção separada e explícita.

A arquitetura de notificações não altera renderer, ícones, classes, texto acessível ou outra implementação interna de `ui/toast.tsx`.

### `src/index.css`

Único ponto de estilização adicional do Toast neste escopo.

A documentação do Base UI expõe `data-type` no `Toast.Root`. O componente shadcn instalado marca a raiz e o ícone com `data-slot="toast"` e `data-slot="toast-icon"`. A aplicação combina esses atributos no CSS global para aplicar cor somente ao SVG:

```css
[data-slot="toast"][data-type="success"] [data-slot="toast-icon"] > svg {
  color: var(--success);
}
```

O mesmo padrão é aplicado a `info`, `warning` e `error`.

Não são alterados fundo, borda, raio, tipografia, espaçamento, animação, posição ou comportamento do Toast. Os tokens `success`, `info`, `warning` e `error` pertencem ao tema/brand da aplicação e são independentes do preset Luma.

O Toast atual baseado em Base UI não depende da antiga API visual do Sonner (`toastOptions` no `Toaster`). O tipo é parte do estado de cada Toast e é exposto pelo atributo `data-type`.

### `src/components/toast/toast-contract.ts`

Define a superfície aceita pela aplicação:

```ts
interface ToastDefinition {
  title: string
  description?: string
  priority?: "low" | "high"
  type: "success" | "info" | "warning" | "error"
}
```

`loading` não faz parte do contrato de resultado da aplicação.

### `src/components/toast/toast-notify.ts`

Adapta `ToastDefinition` para o manager `toast` exportado pelo componente nativo. Não interpreta erros, não navega, não faz retry, não persiste dados e não decide regras de domínio.

### `<scope>/content/<scope>-notify.ts`

Possui texto e semântica do escopo. Pode conter definições estáticas ou factories puras para conteúdo dinâmico.

## Fluxo

```text
ação/operação
    ↓
<scope>-notify.ts
    ↓
notify(ToastDefinition)
    ↓
toast.add(...)
    ↓
ui/toast.tsx / Base UI
    ↓
usuário
```

## Montagem global

Seguindo a documentação oficial do shadcn, `AppProviders` monta diretamente:

```tsx
<Toaster />
```

importado de `@/components/ui/toast`. Não existe wrapper `AppToaster`.

## Fronteiras

- O componente nativo não conhece aplicação ou domínio.
- Features não importam `ui/toast` diretamente.
- `toast-notify.ts` é a única camada de produção autorizada a importar `toast`.
- `AppProviders` é a única camada de produção autorizada a importar `Toaster`.
- O domínio não conhece o manager Base UI.
- Erros técnicos são classificados antes de selecionar uma definição pública.
- `priority` expressa urgência de anúncio; não é derivada automaticamente de `type`.

## Conteúdo reutilizável

Quando um componente reutilizável possui o comportamento, o conteúdo genérico pertence a ele. Exemplo: a ação genérica de copiar da DataTable usa `data-table/content/data-table-notify.ts`; páginas consumidoras apenas fornecem a operação de cópia.

## Tema

- preset shadcn: `base-luma` em `components.json`;
- primitive: Base UI;
- ícones: Lucide;
- fonte da aplicação: Inter Variable via `src/index.css`;
- base shadcn: `@import "shadcn/tailwind.css"`;
- tokens semânticos de brand: `success`, `info`, `warning` e `error` em `src/index.css`;
- as cores são aplicadas externamente somente aos SVGs do slot de ícone via `data-type` + `data-slot`.

## Referências oficiais

- shadcn Toast: https://ui.shadcn.com/docs/components/base/toast
- Base UI Toast: https://base-ui.com/react/components/toast
- Luma style: https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/styles/style-luma.css
- WAI-ARIA: https://www.w3.org/TR/wai-aria/
