import { lazy, Suspense } from "react"

const UnitsDataTable = lazy(() =>
  import("@/pages/units/components/units-data-table").then((module) => ({
    default: module.UnitsDataTable,
  })),
)

export function LazyUnitsDataTable() {
  return (
    <Suspense fallback={null}>
      <UnitsDataTable />
    </Suspense>
  )
}
