import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyClientsDataTable } from "@/pages/clients/components/lazy-clients-data-table"

export function ClientsPage() {
  return (
    <AppPageLayout page={appPages.clients}>
      <LazyClientsDataTable />
    </AppPageLayout>
  )
}
