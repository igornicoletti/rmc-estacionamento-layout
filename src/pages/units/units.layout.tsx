import { HistoryIcon, RefreshCwIcon } from "lucide-react"

import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { Button } from "@/components/ui/button"
import { LazyUnitsDataTable } from "@/pages/units/components/lazy-units-data-table"

export function UnitsPage() {
  return (
    <AppPageLayout
      actions={
        <>
          <Button type="button" variant="outline">
            <HistoryIcon aria-hidden="true" data-icon="inline-start" />
            Histórico
          </Button>
          <Button type="button">
            <RefreshCwIcon aria-hidden="true" data-icon="inline-start" />
            Sincronizar
          </Button>
        </>
      }
      page={appPages["units"]}
    >
      <LazyUnitsDataTable />
    </AppPageLayout>
  )
}
