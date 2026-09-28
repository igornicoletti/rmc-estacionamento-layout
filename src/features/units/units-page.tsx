import { unitsContent } from "@/features/units/units-content"
import { LayoutPage } from "@/components/layout/layout-page"
import { UnitsDataTable } from "@/features/units/units-data-table"

export function UnitsPage() {
  return (
    <LayoutPage page={unitsContent.page}>
      <UnitsDataTable />
    </LayoutPage>
  )
}
