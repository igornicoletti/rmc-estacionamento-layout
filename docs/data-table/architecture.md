# Arquitetura

`src/components/data-table/data-table-features.ts` registra uma única factory `createTableHook` com filtering, faceting, sorting, pagination e visibility. Os row models do TanStack processam o conjunto completo carregado pela página. Cada página cria seu helper de colunas tipado e fornece `getRowId`.

O estado local de sorting, filtros, paginação e visibilidade pertence à tabela. Um slice só deve ser controlado externamente quando query de servidor, URL ou persistência precisar dele. Flags `manual*` são restritas a tabelas que processam os dados no servidor.

As colunas definem accessors, filtering, sorting, rótulos de visibilidade e células. A camada compartilhada apresenta tabela HTML nativa, controles e estados visuais, sem importar TanStack Query nem conhecer entidades de domínio. As features possuem query, ações, CSV e formatação.

## Lifecycle

A feature traduz o estado da consulta para o contrato visual:

- `isLoading`: Skeleton e controles dependentes dos dados desabilitados;
- `isFetching`: estado ocupado do `DataTableRoot`;
- `isRefetching`: indicador de atualização sem remover dados válidos;
- `isLoadingError`: erro persistente com retry;
- `isRefetchError`: mantém o último resultado válido e usa feedback não destrutivo.

O Skeleton usa por padrão o `pageSize` atual da tabela. A paginação não é renderizada quando o modelo pré-paginado possui zero linhas.

O CSV usa `getPrePaginatedRowModel()` para exportar todos os registros filtrados e ordenados. A busca local aplica o filtro a cada alteração do input, sem debounce.
