import { useState } from "react"

import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { PageHistorySyncActions } from "@/components/common/page-history-sync-actions"
import { PageSyncHistorySheet } from "@/components/common/page-sync-history-sheet"
import { LazyClientsDataTable } from "@/pages/clients/components/lazy-clients-data-table"
import { clientSyncHistoryFixture } from "@/pages/clients/data/client-sync-history.fixture"

export function ClientsPage() {
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <>
      <AppPageLayout
        actions={
          <PageHistorySyncActions onHistory={() => setHistoryOpen(true)} />
        }
        page={appPages.clients}
      >
        <LazyClientsDataTable />
      </AppPageLayout>

      <PageSyncHistorySheet
        executions={clientSyncHistoryFixture}
        onOpenChange={setHistoryOpen}
        open={historyOpen}
        scopeLabel={appPages.clients.title}
      />
    </>
  )
}
