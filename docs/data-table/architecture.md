# Arquitetura

`src/components/data-table/data-table-features.ts` registra uma única factory `createTableHook` com filtering, faceting, sorting, pagination e visibility. Os row models do TanStack processam o conjunto completo carregado pela página. Cada página cria seu helper de colunas tipado e fornece `getRowId`.

O estado local de sorting, filtros, paginação e visibilidade pertence à tabela. Um slice só deve ser controlado externamente quando query de servidor, URL ou persistência precisar dele. Flags `manual*` são restritas a tabelas que processam os dados no servidor.

As colunas definem accessors, filtering, sorting, rótulos de visibilidade e células. A camada compartilhada apresenta tabela HTML nativa, controles e estados visuais, sem importar TanStack Query nem conhecer entidades de domínio. As features possuem query, ações, CSV e formatação.

## Lifecycle

A feature traduz o estado da consulta para o contrato visual:

- `isPending`: enquanto ainda não existe resultado, mantém Skeleton e controles dependentes dos dados desabilitados, inclusive quando o fetch está pausado/offline;
- `isFetching`: estado ocupado do `DataTableRoot` enquanto a query function está executando;
- `isRefetching`: indicador de atualização sem remover dados válidos;
- `isLoadingError`: erro persistente com retry;
- `isRefetchError`: mantém o último resultado válido e usa feedback não destrutivo;
- `errorUpdatedAt`: identifica uma nova falha de refetch; o valor já presente no cache ao montar a feature é considerado previamente observado para não repetir feedback histórico.

`isLoading` continua útil para identificar o primeiro fetch efetivamente em execução, mas não governa sozinho o estado visual inicial porque uma query pode estar `pending` e `paused` sem dados.

O Skeleton usa por padrão o `pageSize` atual da tabela. A paginação não é renderizada enquanto a consulta inicial está pendente nem quando o modelo pré-paginado possui zero linhas.

O CSV usa `getPrePaginatedRowModel()` para exportar todos os registros filtrados e ordenados. A busca local aplica o filtro a cada alteração do input, sem debounce.
