# Arquitetura

```text
operação → definição do escopo → notify() → toast.add() → Toaster
```

| Responsável | Contrato |
| --- | --- |
| `<scope>/content/<scope>-notify.ts` | Texto e semântica da operação; factories recebem apenas valores necessários. |
| `toast-contract.ts` | `ToastDefinition`: título, descrição opcional, tipo e prioridade opcional. |
| `toast-notify.ts` | Único adaptador de produção para `toast.add`; não classifica erros nem decide regras de domínio. |
| `app-providers.tsx` | Monta `Toaster` uma vez. |
| `ui/toast.tsx` | Renderer instalado pelo shadcn/Base UI. |

`loading` existe no primitive, mas não representa um resultado no contrato da aplicação. `priority: "high"` é escolhido por urgência, independentemente de `type: "error"`.

## Aparência

A aplicação não edita `ui/toast.tsx` para dar cor ao status. `src/index.css` combina `data-type` da raiz com `data-slot="toast-icon"` do código instalado e colore somente o SVG. Os tokens `success`, `info`, `warning` e `error` pertencem ao tema da aplicação. Se o primitive for atualizado, confira esses atributos antes de manter o seletor.

Toast não é canal para detalhes técnicos de `Error` nem substitui feedback contextual persistente.

Fontes: [shadcn Toast](https://ui.shadcn.com/docs/components/base/toast) · [Base UI Toast](https://base-ui.com/react/components/toast).
