# Uso

Crie um helper com `createDataTableColumnHelper<Row>()` e defina as colunas na página. Use `meta.visibilityLabel` para cada coluna que pode ser ocultada. Accessors devem expor os valores usados por busca, filtros e ordenação; células cuidam da apresentação.

Na composição da página, carregue os dados com TanStack Query e crie a tabela com `useDataTable({ data, columns, getRowId, initialState })`. Passe a instância aos controles e ao renderer compartilhados. Use `getPrePaginatedRowModel().rows.map(row => row.original)` para exportar.

Preserve `caption`, `aria-sort` no cabeçalho ordenado e um botão dentro do `<th>`. Evite regras de domínio em `src/components/data-table`.
