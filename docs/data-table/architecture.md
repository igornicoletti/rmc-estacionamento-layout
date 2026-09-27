# Arquitetura

`src/components/data-table/data-table-features.ts` registra uma única factory `createTableHook` com filtering, faceting, sorting, pagination e visibility. Os row models do TanStack processam o conjunto completo carregado pela página. Cada página cria seu helper de colunas tipado e fornece `getRowId`.

O estado local de sorting, filtros, paginação e visibilidade pertence à tabela. Um slice só deve ser controlado externamente quando query de servidor, URL ou persistência precisar dele. Flags `manual*` são restritas a tabelas que processam os dados no servidor.

As colunas definem accessors, filtering, sorting, rótulos de visibilidade e células. A camada compartilhada apresenta uma tabela HTML nativa e controles, sem conhecer TanStack Query ou entidades de domínio. As páginas possuem query, ações, CSV e formatação.

O CSV usa `getPrePaginatedRowModel()` para exportar todos os registros filtrados e ordenados. A busca local aplica o filtro a cada alteração do input, sem debounce.
