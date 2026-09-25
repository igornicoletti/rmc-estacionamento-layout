import { lazy, Suspense } from "react"

import { DataTableLoadingFallback } from "@/components/data-table/components/data-table-state"

import { DataTableLazyFallback } from "@/components/data-table/components/data-table-state"

const UnitsDataTable = lazy(() =>
  import("@/pages/units/components/units-data-table").then((module) => ({
    default: module.UnitsDataTable,
  })),
)

export function LazyUnitsDataTable() {
  return (
    <Suspense fallback={<DataTableLazyFallback />}>
      <UnitsDataTable />
    </Suspense>
  )
}
