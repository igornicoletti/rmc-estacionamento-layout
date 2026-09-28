# Uso

Crie um helper com `createDataTableColumnHelper<Row>()` e defina as colunas na página. Use `meta.visibilityLabel` para cada coluna que pode ser ocultada. Accessors devem expor os valores usados por busca, filtros e ordenação; células cuidam da apresentação.

Na composição da feature, carregue os dados com TanStack Query e crie a tabela com `useDataTable({ data, columns, getRowId, initialState })`. Passe a instância aos controles e ao renderer compartilhados. Para exportação e gerenciamento de colunas, use `DataTableActions` em `DataTableToolbar.actions`, informando `table`, `csvColumns`, `filename` e `isBusy={query.isPending || query.isFetching}`. A composição exporta o modelo filtrado e ordenado antes da paginação e explica ações bloqueadas por tooltip.

Preserve `caption`, `aria-sort` no cabeçalho ordenado e um botão dentro do `<th>`. Evite regras de domínio em `src/components/data-table`.
