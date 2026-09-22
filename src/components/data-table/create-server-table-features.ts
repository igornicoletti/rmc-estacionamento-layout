import {
  columnFilteringFeature,
  columnVisibilityFeature,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
} from "@tanstack/react-table"

import type { DataTableColumnMeta } from "@/components/data-table/data-table.types"

export function createServerTableFeatures<TMeta extends object>() {
  return tableFeatures({
    columnFilteringFeature,
    filterFns: { includesString: filterFn_includesString },
    columnVisibilityFeature,
    globalFilteringFeature,
    rowPaginationFeature,
    rowSortingFeature,
    sortFns: { alphanumeric: sortFn_alphanumeric },
    columnMeta: metaHelper<DataTableColumnMeta>(),
    tableMeta: metaHelper<TMeta>(),
  })
}

export type ServerTableFeatures<TMeta extends object> = ReturnType<
  typeof createServerTableFeatures<TMeta>
>
