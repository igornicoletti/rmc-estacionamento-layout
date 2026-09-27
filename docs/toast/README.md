# Toast

Notificações transitórias usam `notify(ToastDefinition)` de `src/components/toast/toast-notify.ts`. O conteúdo pertence ao escopo que o produz; `AppProviders` monta o `Toaster` nativo de `src/components/ui/toast.tsx`.

```ts
import { notify } from "@/components/toast/toast-notify"
import { sessionNotify } from "@/app/session/content/session-notify"

notify(sessionNotify.signOutFailed)
```

O contrato aceita `title`, `description?`, `type` e `priority?`. A prioridade controla urgência do anúncio e não é inferida do tipo. Erros técnicos devem ser convertidos em mensagem pública antes de chamar `notify`.

Use Toast para resultado transitório; erros persistentes ficam no estado da página e erros de campo junto ao campo. A DataTable comunica o resultado da ação reutilizável de cópia, sem duplicar Toast nas páginas.

Detalhes: [arquitetura](architecture.md) · [uso](usage.md) · [testes](testing.md). Referências: [shadcn Toast](https://ui.shadcn.com/docs/components/base/toast) e [Base UI Toast](https://base-ui.com/react/components/toast).
