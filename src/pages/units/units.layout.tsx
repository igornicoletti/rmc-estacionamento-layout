import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { PageHistorySyncActions } from "@/components/common/page-history-sync-actions"
import { LazyUnitsDataTable } from "@/pages/units/components/lazy-units-data-table"

export function UnitsPage() {
  return (
    <AppPageLayout
      actions={<PageHistorySyncActions />}
      page={appPages["units"]}
    >
      <LazyUnitsDataTable />
    </AppPageLayout>
  )
}
