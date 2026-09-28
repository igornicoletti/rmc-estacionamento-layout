import { unitsCopy } from "@/pages/units/units.copy"
import { LayoutPage } from "@/components/layout/layout-page"
import { LazyUnitsDataTable } from "@/pages/units/components/lazy-units-data-table"

export function UnitsPage() {
  return (
    <LayoutPage page={unitsCopy.page}>
      <LazyUnitsDataTable />
    </LayoutPage>
  )
}
