# Arquitetura

## Fronteira

`src/components/ui` contém os componentes instalados pelo shadcn/ui. `src/components/app` contém apenas políticas reutilizáveis da aplicação sobre esses primitives.

Um `App*` deve reduzir a superfície consumida, não reproduzi-la. Props nativas avançadas não são expostas preventivamente.

## Critério para existir

Manter ou criar wrapper quando houver pelo menos uma decisão compartilhada e estável:

- composição recorrente;
- semântica da aplicação;
- acessibilidade acrescentada pelo projeto;
- comportamento comum;
- eliminação comprovada de duplicação.

Se o primitive já resolver o caso sem repetição relevante, usar `ui/*` diretamente.

## Responsabilidades

`components/app` não conhece páginas, ERP, autenticação, Query, Supabase ou regras de domínio. Valores e callbacks chegam resolvidos pelo consumidor.

Import direto de `ui/*` não é uma violação por si só. `Badge` para contagem e `Item` com `render={<Link />}`, por exemplo, têm semântica diferente dos wrappers existentes.

## Estilos

Preservar o visual Base/Luma nativo. Classes extras ficam restritas a layout, overflow, responsividade estrutural, tokens semânticos existentes e acessibilidade.

Não criar paletas, shadows, radius ou animações locais apenas para personalização.

## Decisões atuais

- overlays `AppDialog`, `AppAlertDialog` e `AppSheet` permanecem controlados porque seus consumidores reagem ao estado externo;
- `AppCombobox` concentra a mecânica compartilhada de seleção simples;
- `AppCalendar` resolve o timezone no cliente porque a aplicação é uma SPA Vite sem SSR;
- `AppItem` foi removido: o primitive oficial já é a abstração adequada aos consumidores atuais.

## Referências oficiais

- https://ui.shadcn.com/docs/components/base/dialog
- https://ui.shadcn.com/docs/components/base/alert-dialog
- https://ui.shadcn.com/docs/components/base/combobox
- https://ui.shadcn.com/docs/components/base/item
- https://base-ui.com/react/components/dialog
