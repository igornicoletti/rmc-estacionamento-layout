# Uso

Crie um helper com `createDataTableColumnHelper<Row>()` e defina as colunas na feature. Use `meta.visibilityLabel` para cada coluna que pode ser ocultada. Accessors devem expor os valores usados por busca, filtros e ordenação; células cuidam da apresentação.

Na composição da feature, carregue os dados com TanStack Query e crie a tabela com `useDataTable({ data, columns, getRowId, initialState })`. Passe a instância aos controles e ao renderer compartilhados.

Mapeie o lifecycle da consulta da seguinte forma:

- derive `isInitialPending = query.isPending` para decisões que dependem de ainda não existir resultado;
- `DataTableRoot.isBusy={query.isFetching}`;
- `DataTable.isLoading={isInitialPending}`;
- `DataTableUpdating.active={query.isRefetching}`;
- busca e filtros recebem `disabled={isInitialPending}`;
- `DataTableActions.isBusy={isInitialPending}`, preservando exportação dos dados atuais durante refetch;
- esconda a paginação enquanto `isInitialPending` for verdadeiro;
- `query.isLoadingError` usa `DataTableError` com retry;
- `query.isRefetchError` mantém a tabela e emite feedback não destrutivo;
- inicialize o identificador local do último erro observado com `query.errorUpdatedAt`, evitando repetir um erro de refetch já cacheado após remontagem.

Não use `query.isLoading` sozinho para representar “ainda não existe resultado”: ele só é verdadeiro quando a consulta está simultaneamente `pending` e `fetching`, e portanto fica falso se o primeiro fetch estiver pausado/offline.

Para exportação e gerenciamento de colunas, use `DataTableActions` em `DataTableToolbar.actions` com `table`, `csvColumns` e `filename`. A exportação usa o modelo filtrado e ordenado antes da paginação.

Preserve `caption`, `aria-sort` no cabeçalho ordenado e um botão dentro do `<th>`. Evite regras de domínio e dependência de TanStack Query em `src/components/data-table`.
