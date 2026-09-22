import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyUnitsDataTable } from "@/pages/units/components/lazy-units-data-table"

export function UnitsPage() {
  return (
    <AppPageLayout page={appPages["units"]}>
      <LazyUnitsDataTable />
    </AppPageLayout>
  )
}
