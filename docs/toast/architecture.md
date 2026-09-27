# Arquitetura

## Responsabilidades

### `src/components/ui/toast.tsx`

Primitive visual baseado em shadcn/Base UI. Responsável por renderer, viewport, animações, swipe, ícones e integração com o manager Base UI.

A aplicação mantém o visual nativo do preset configurado. As únicas cores semânticas adicionais ficam nos ícones de `success`, `info`, `warning` e `error`, usando tokens existentes do tema.

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

Adapta `ToastDefinition` para o manager Base UI. Não interpreta erros, não navega, não faz retry, não persiste dados e não decide regras de domínio.

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
ui/toast.tsx / Base UI
    ↓
usuário
```

## Fronteiras

- O primitive não importa conteúdo de domínio.
- O domínio não importa o manager Base UI.
- `toast-notify.ts` é o único adapter autorizado a acessar o manager.
- `AppProviders` é o único consumidor autorizado de `Toaster`.
- Erros técnicos são classificados antes de selecionar uma definição pública.
- `priority` expressa urgência de anúncio; não é derivada automaticamente de `type`.

## Conteúdo reutilizável

Quando um componente reutilizável possui o comportamento, o conteúdo genérico pertence a ele. Exemplo: a ação genérica de copiar da DataTable usa `data-table/content/data-table-notify.ts`; páginas consumidoras apenas fornecem a operação de cópia.

## Referências oficiais

- shadcn Toast: https://ui.shadcn.com/docs/components/base/toast
- Base UI Toast: https://base-ui.com/react/components/toast
- WAI-ARIA: https://www.w3.org/TR/wai-aria/
