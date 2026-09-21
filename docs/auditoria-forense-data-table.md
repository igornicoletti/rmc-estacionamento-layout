# Revisão crítica do núcleo Data Table

Data: 21 de setembro de 2026

Escopo: `src/components/data-table`, sem alterações em `src/components/ui`.

## Resultado

O conteúdo demonstrativo de domínio foi removido. O projeto mantém somente o
núcleo reutilizável da Data Table e uma tela inicial neutra, pronta para receber
uma integração real.

## Conformidade com as documentações oficiais

- A Data Table usa os primitivos `Table` do shadcn/ui e as features opt-in do
  TanStack Table v9. A separação entre colunas de domínio e componentes
  reutilizáveis segue a recomendação oficial de não transformar todas as
  variações de tabela em um único componente rígido.
- Busca, filtros, ordenação e paginação são configurados como manuais no hook
  de tabela de servidor. O estado controlado e a contagem total continuam
  disponíveis para integrações reais.
- `DataTableError` usa a composição oficial `Alert`, ícone, `AlertTitle`,
  `AlertDescription` e `AlertAction`. A ação não fica mais aninhada na
  descrição.
- Estados vazios usam `Empty`; carregamento usa `Skeleton`; atualização usa
  `Spinner`; separação visual usa `Separator`; busca usa `InputGroup`; opções
  de seleção e menus permanecem dentro dos respectivos grupos.
- Ícones dentro de `Button` usam `data-icon` e não recebem dimensões locais.
- Cores e tipografia usam tokens semânticos. O layout usa `gap` e classes de
  dimensão abreviadas quando largura e altura são iguais.

## Limites

Sem um domínio e uma fonte de dados reais, não há fluxo de consulta para
validar ponta a ponta. Os testes preservados cobrem o contrato do núcleo
reutilizável; o E2E atual verifica apenas que a aplicação inicia sem reintroduzir
conteúdo demonstrativo.

## Referências oficiais

- [shadcn/ui — Alert](https://ui.shadcn.com/docs/components/base/alert)
- [shadcn/ui — Data Table](https://ui.shadcn.com/docs/components/base/data-table)
- [TanStack Table — Pagination](https://tanstack.com/table/latest/docs/guide/pagination)
- [TanStack Table — Sorting](https://tanstack.com/table/latest/docs/guide/sorting)
- [TanStack Table — Column Filtering](https://tanstack.com/table/latest/docs/guide/column-filtering)
