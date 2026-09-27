# Uso

## Escolha rápida

| Necessidade | Use | Contrato relevante |
| --- | --- | --- |
| Estado vazio de página ou lista | `AppEmpty` | `title` obrigatório; mídia opcional com `icon` ou configuração de `avatar`; ações em `children`. |
| Lista pesquisável de seleção simples | `AppCombobox` | Itens `{label, value, group?}`; `onValueChange` recebe `undefined` ao limpar. |
| Confirmação explícita | `AppAlertDialog` | `action` usa `AlertDialogAction`; cancelamento nativo padrão “Cancelar”. |
| Dialog de conteúdo rolável | `AppDialog` | `DialogClose` padrão “Cancelar”; altere com `closeLabel` ou omita com `null`. |
| Painel lateral direito | `AppSheet` | `SheetClose` padrão “Cancelar”; altere com `closeLabel` ou omita com `null`. |
| Badge de status semântico | `AppBadge` | `tone` entre primary, info, success, warning e error. |
| Calendário com fuso local | `AppCalendar` | `timeZone` explícito prevalece sobre o fuso do navegador. |

Para `AppCombobox`, forneça um `value` presente em `items`; se os itens filtrados mudarem, preserve o item selecionado. O filtro da DataTable faz isso antes de passá-los ao componente. Grupos parciais são exibidos como lista plana. `showClear` é nativo do input; `children` personaliza a linha da opção, sem substituir sua identificação textual.

Overlays são controlados pelo consumidor: ele decide quando abrir, fechar, salvar ou navegar. O wrapper fornece estrutura visual e semântica; não implementa esse fluxo. Quando a composição exigir opções fora desses contratos, use `ui/*` diretamente em vez de estender `App*` para um único caso.

No `AppAlertDialog`, personalize comportamento e aparência por `actionProps` e `cancelProps`. Em `AppEmpty`, o wrapper cria o avatar a partir de `src`, `alt` e `fallback`; `render` permite envolver esse avatar em uma interação sem transferir sua composição ao consumidor.

## Exemplo

```tsx
<AppEmpty
  headingLevel={2}
  media={{ icon: UserRoundXIcon }}
  title="Cliente não encontrado"
  description="O cliente solicitado não está disponível."
/>
```

Veja as APIs de base em [Empty](https://ui.shadcn.com/docs/components/base/empty), [Combobox](https://ui.shadcn.com/docs/components/base/combobox) e [Alert Dialog](https://ui.shadcn.com/docs/components/base/alert-dialog).
