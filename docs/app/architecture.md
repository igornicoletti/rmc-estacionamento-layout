# Arquitetura

## Fronteira

```text
components/ui (código instalado pelo shadcn)
      ↓
components/app (políticas visuais reutilizáveis)
      ↓
app, componentes e páginas (estado, conteúdo e domínio)
```

Os wrappers recebem valores e callbacks prontos. Não fazem consultas, classificam erros, navegam ou decidem acesso. Alterações no primitive instalado são manutenção própria; uma necessidade da aplicação entra nesta camada somente se for compartilhada e estável.

O diretório simples `app` identifica composições próprias da aplicação. Os arquivos instalados pelo registry permanecem em `ui`, e o prefixo `App` deixa essa fronteira explícita no ponto de importação.

## Decisões que os tipos protegem

- `AppDialog`, `AppAlertDialog` e `AppSheet` exigem `open`, `onOpenChange` e título. Os fechamentos de Dialog e Sheet usam os primitives nativos e aceitam outro texto ou `null` para omissão.
- `AppAlertDialog` exige descrição e ação. O cancelamento nativo usa “Cancelar” por padrão e pode ser omitido com `cancelLabel={null}`.
- `AppCombobox` aceita um valor string ou `undefined`, não seleção múltipla. Só agrupa quando **todos** os itens informam `group`.
- `AppEmpty` oferece `headingLevel`; ícones são decorativos, enquanto avatares exigem texto alternativo e fallback. O wrapper compõe `Avatar`, `AvatarImage` e `AvatarFallback` dentro de `EmptyMedia`.
- `AppBadge` usa tokens semânticos da aplicação. `AppCalendar` resolve o fuso no navegador, pois este projeto é uma SPA cliente.

Um novo `AppX` precisa registrar aqui a decisão que centraliza e ter um consumidor real. Se apenas repassar props, importe `ui/X` diretamente.

## Fontes

- [Alert Dialog](https://ui.shadcn.com/docs/components/base/alert-dialog)
- [Dialog](https://ui.shadcn.com/docs/components/base/dialog)
- [Empty](https://ui.shadcn.com/docs/components/base/empty)
- [Sheet](https://ui.shadcn.com/docs/components/base/sheet)
- [Base UI](https://base-ui.com/react/overview/quick-start)
