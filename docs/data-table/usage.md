# Uso

Crie um helper com `createDataTableColumnHelper<Row>()` e defina as colunas na feature. Use `meta.visibilityLabel` para cada coluna que pode ser ocultada. Accessors devem expor os valores usados por busca, filtros e ordenação; células cuidam da apresentação.

Na composição da feature, carregue os dados com TanStack Query e crie a tabela com `useDataTable({ data, columns, getRowId, initialState })`. Passe a instância aos controles e ao renderer compartilhados.

Mapeie o lifecycle da consulta da seguinte forma:

- `DataTableRoot.isBusy={query.isFetching}`;
- `DataTable.isLoading={query.isLoading}`;
- `DataTableUpdating.active={query.isRefetching}`;
- busca e filtros recebem `disabled={query.isLoading}`;
- `DataTableActions.isBusy={query.isLoading}`, preservando exportação dos dados atuais durante refetch;
- `query.isLoadingError` usa `DataTableError` com retry;
- `query.isRefetchError` mantém a tabela e emite feedback não destrutivo.

Para exportação e gerenciamento de colunas, use `DataTableActions` em `DataTableToolbar.actions` com `table`, `csvColumns` e `filename`. A exportação usa o modelo filtrado e ordenado antes da paginação.

Preserve `caption`, `aria-sort` no cabeçalho ordenado e um botão dentro do `<th>`. Evite regras de domínio e dependência de TanStack Query em `src/components/data-table`.
