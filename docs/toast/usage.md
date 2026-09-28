# Uso

## Notificação estática

```ts
import { notify } from "@/components/toast/toast-notify"
import { sessionNotify } from "@/features/auth/notifications/auth-notify"

notify(sessionNotify.signOutFailed)
```

## Conteúdo dinâmico

```ts
import { notify } from "@/components/toast/toast-notify"
import { clientsNotify } from "@/features/clients/notifications/clients-notify"

notify(clientsNotify.emailCopied({ email }))
```

Factories recebem apenas os valores necessários à mensagem. Não recebem `Error`, `Response`, QueryClient ou DTO amplo quando dados escalares bastam.

## Tratamento de erro

A operação seleciona uma definição pública controlada:

```ts
try {
  await operation()
} catch {
  notify(scopeNotify.operationFailed)
}
```

Não usar:

```ts
notify(error.message)
```

nem:

```ts
toast.add(...)
```

fora de `src/components/toast/toast-notify.ts`.

A outra importação permitida de `@/components/ui/toast` em produção é `Toaster`, exclusivamente na composição global de `AppProviders`.

## DataTable

A ação reutilizável da DataTable recebe uma operação assíncrona. A página decide o que copiar; `DataTableRowActions` comunica sucesso ou falha uma única vez.

```tsx
<DataTableRowActions
  accessibleLabel="Ações do registro"
  onCopyData={() => copyToClipboard(serializedRecord)}
/>
```

## Escolha do componente

Use Toast para resultado ou informação transitória após uma ação.

Prefira:

- erro de campo/formulário: feedback contextual do campo;
- confirmação destrutiva: AlertDialog;
- erro persistente de página/lista: estado de erro da página/componente;
- ausência de conteúdo: Empty;
- informação persistente: Alert ou estado próprio da interface.

## Prioridade

`priority: "high"` é reservada a mensagens que precisam de anúncio urgente. Não aplicar automaticamente a todo `type: "error"`.

Referências:

- https://ui.shadcn.com/docs/components/base/toast
- https://base-ui.com/react/components/toast
- https://www.w3.org/TR/wai-aria/
