# Data Table

**Natureza:** referência vigente. **Escopo:** src/components/data-table.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Arquitetura e contrato](#c1)
- [Lifecycle e uso](#c2)
- [Testes](#c3)
- [Limites e fontes](#c4)

<a id="c1"></a>

## Arquitetura e contrato

Uma factory createTableHook em `src/components/data-table/data-table-features.ts` registra row models oficiais TanStack Table v9: filtering/faceting/sorting/pagination/visibility. Feature cria helper tipado de colunas, fornece getRowId, dados, query, ações, CSV e formatadores. Compartilhado não importa Query nem domínio.

Sorting/filtros/página/visibilidade são estado local; controlar externamente somente quando URL, servidor ou persistência exigirem contrato. Não há manual* para processamento local. Busca imediata sem debounce; facetas exatas usam equals; export usa getPrePaginatedRowModel, mantendo filtros e ordenação de todas as páginas. Visibilidade não muda colunas CSV.

<a id="c2"></a>

## Lifecycle e uso

| Query | Projeção |
| --- | --- |
| isPending | Skeleton pelo pageSize; busca/filtros/ações dependentes disabled; sem empty/paginação inicial, inclusive paused/offline |
| isFetching | DataTableRoot ocupado |
| isRefetching | Indicador de atualização; dados válidos preservados |
| isLoadingError | Erro persistente com retry |
| isRefetchError | Dados preservados e feedback único |
| errorUpdatedAt | Deduplicação; valor cacheado inicial já observado |

Não usar isLoading sozinho para falta de resultado. Features atuais passam isBusy=isPending a DataTableActions: exportação permanece disponível durante refetch. A afirmação antiga de bloqueio durante toda atualização foi corrigida por inspeção do código.

Use meta.visibilityLabel em colunas ocultáveis; accessors expõem valores pesquisáveis/ordenáveis, cells apresentam. caption, botão em th e aria-sort preservam HTML semântico. Combobox mantém seleção presente quando facetas mudam. Filtros cidade/bandeira compõem interseção.

<a id="c3"></a>

## Testes

`tests/integration/data-table.test.tsx` cobre renderização, filtros/faceting/sorting, visibilidade, CSV, paginação e lifecycle. `tests/unit/components/data-table/data-table-actions.test.tsx` cobre ações/exportação; features cobrem queries/retry/filtros/IDs/cópia/CSV. E2E cobre mobile, detalhes/veículos e controles reais.

Thresholds existentes: statements/lines 95%, branches 85%, functions 90%. [Catálogo](../project/validation.md#catalog). Não listar suites inexistentes para combobox/row-actions: casos estão nas integrações atuais.

<a id="c4"></a>

## Limites e fontes

Server-side, persistência de filtros, seleção em lote, virtualização e pinning não estão implementados. Só introduzir com consumidor e testes próprios. Facetas semelhantes em Clientes/Unidades não autorizam acoplar queries/domínios.

[TanStack Table](https://tanstack.com/table/latest), [Query status](https://tanstack.com/query/latest/docs/framework/react/guides/queries), [Table shadcn](https://ui.shadcn.com/docs/components/base/table).
