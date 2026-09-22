import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { PageHistorySyncActions } from "@/components/common/page-history-sync-actions"
import { LazyClientsDataTable } from "@/pages/clients/components/lazy-clients-data-table"

export function ClientsPage() {
  return (
    <AppPageLayout
      actions={<PageHistorySyncActions />}
      page={appPages["clients"]}
    >
      <LazyClientsDataTable />
    </AppPageLayout>
  )
}
