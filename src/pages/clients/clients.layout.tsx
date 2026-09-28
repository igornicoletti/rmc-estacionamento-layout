import { clientsCopy } from "@/pages/clients/clients.copy"
import { LayoutPage } from "@/components/layout/layout-page"
import { LazyClientsDataTable } from "@/pages/clients/components/lazy-clients-data-table"

export function ClientsPage() {
  return (
    <LayoutPage page={clientsCopy.page}>
      <LazyClientsDataTable />
    </LayoutPage>
  )
}
