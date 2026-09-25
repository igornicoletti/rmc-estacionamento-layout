import {
  columnVisibilityFeature,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table"

import type { DataTableColumnMeta } from "@/components/data-table/core/data-table.types"

export function createDataTableFeatures<TMeta extends object>() {
  return tableFeatures({
    columnVisibilityFeature,
    rowPaginationFeature,
    rowSortingFeature,
    columnMeta: metaHelper<DataTableColumnMeta>(),
    tableMeta: metaHelper<TMeta>(),
  })
}

export type DataTableFeatures<TMeta extends object> = ReturnType<
  typeof createDataTableFeatures<TMeta>
>
