import { unitsContent } from "@/features/units/content/units-content"
import { LayoutPage } from "@/components/layout/layout-page"
import { UnitsDataTable } from "@/features/units/components/units-data-table"

export function UnitsPage() {
  return (
    <LayoutPage page={unitsContent.page}>
      <UnitsDataTable />
    </LayoutPage>
  )
}
