import { useState } from "react"

import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { PageHistorySyncActions } from "@/components/common/page-history-sync-actions"
import { PageSyncHistorySheet } from "@/components/common/page-sync-history-sheet"
import { LazyUnitsDataTable } from "@/pages/units/components/lazy-units-data-table"
import { unitSyncHistoryFixture } from "@/pages/units/data/unit-sync-history.fixture"

export function UnitsPage() {
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <>
      <AppPageLayout
        actions={
          <PageHistorySyncActions onHistory={() => setHistoryOpen(true)} />
        }
        page={appPages.units}
      >
        <LazyUnitsDataTable />
      </AppPageLayout>

      <PageSyncHistorySheet
        executions={unitSyncHistoryFixture}
        onOpenChange={setHistoryOpen}
        open={historyOpen}
        scopeLabel={appPages.units.title}
      />
    </>
  )
}
