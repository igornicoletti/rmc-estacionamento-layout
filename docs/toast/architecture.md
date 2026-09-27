# Arquitetura

## Responsabilidades

### `src/components/ui/toast.tsx`

Primitive shadcn/Base UI protegido. É tratado como código gerado/fornecido pela camada `ui` e não recebe customizações de feature ou de produto.

O projeto usa `style: "base-luma"` em `components.json`. A atualização desse primitive, quando necessária, deve ocorrer em um bloco próprio de atualização do shadcn, não misturada à arquitetura de notificações.

### `src/components/common/app-toast.tsx`

Wrapper da aplicação sobre o primitive. É a única fronteira autorizada a importar `ui/toast`.

Responsável por:
- montar o renderer usado pela aplicação;
- aplicar o rótulo acessível em PT-BR;
- aplicar cores semânticas somente aos ícones usando `success`, `info`, `warning` e `error` já definidos no tema;
- expor o manager utilizado pelo dispatcher.

Não altera cor de fundo, borda, título ou descrição do Toast.

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

Adapta `ToastDefinition` para o manager exposto por `AppToast`. Não interpreta erros, não navega, não faz retry, não persiste dados e não decide regras de domínio.

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
AppToast
    ↓
ui/toast.tsx / Base UI
    ↓
usuário
```

## Fronteiras

- O primitive não conhece aplicação ou domínio.
- Somente `AppToast` importa `ui/toast`.
- O domínio não conhece o manager Base UI.
- `AppProviders` monta `AppToaster`, não o primitive diretamente.
- Erros técnicos são classificados antes de selecionar uma definição pública.
- `priority` expressa urgência de anúncio; não é derivada automaticamente de `type`.

## Conteúdo reutilizável

Quando um componente reutilizável possui o comportamento, o conteúdo genérico pertence a ele. Exemplo: a ação genérica de copiar da DataTable usa `data-table/content/data-table-notify.ts`; páginas consumidoras apenas fornecem a operação de cópia.

## Tema

- preset: `base-luma` em `components.json`;
- base shadcn: `@import "shadcn/tailwind.css"` em `src/index.css`;
- tokens semânticos da aplicação: `success`, `info`, `warning` e `error` em `src/index.css`;
- os tokens semânticos são aplicados pelo wrapper apenas aos ícones do Toast.

## Referências oficiais

- shadcn Toast: https://ui.shadcn.com/docs/components/base/toast
- Base UI Toast: https://base-ui.com/react/components/toast
- WAI-ARIA: https://www.w3.org/TR/wai-aria/
