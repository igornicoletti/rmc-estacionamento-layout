# Arquitetura

## Responsabilidades

### `src/components/ui/toast.tsx`

Componente nativo shadcn/Base UI instalado pelo CLI e mantido sem customizações da aplicação.

O projeto usa `style: "base-luma"` em `components.json`. Quando for necessário atualizar o componente, a atualização deve ocorrer pelo shadcn CLI em um bloco próprio, por exemplo:

```bash
npx shadcn@latest add toast --overwrite
```

A arquitetura de notificações não altera o renderer, os ícones, as classes, o texto acessível ou qualquer outra implementação interna desse arquivo.

### `src/index.css`

Único ponto de estilização adicional do Toast neste escopo.

Base UI expõe `data-type` no `Toast.Root`. O componente shadcn expõe `data-slot="toast"` e `data-slot="toast-icon"`. Esses atributos permitem aplicar cor somente ao SVG do ícone sem modificar o arquivo nativo:

```css
[data-slot="toast"][data-type="success"] [data-slot="toast-icon"] > svg {
  color: var(--success);
}
```

O mesmo padrão é aplicado a `info`, `warning` e `error`.

Não são alterados fundo, borda, raio, tipografia, espaçamento, animação, posição ou comportamento do Toast.

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

- preset: `base-luma` em `components.json`;
- base shadcn: `@import "shadcn/tailwind.css"` em `src/index.css`;
- tokens semânticos da aplicação: `success`, `info`, `warning` e `error` em `src/index.css`;
- as cores são aplicadas externamente somente aos SVGs do slot de ícone via `data-type` + `data-slot`.

## Referências oficiais

- shadcn Toast: https://ui.shadcn.com/docs/components/base/toast
- shadcn CLI: https://ui.shadcn.com/docs/cli
- Base UI Toast: https://base-ui.com/react/components/toast
- WAI-ARIA: https://www.w3.org/TR/wai-aria/
