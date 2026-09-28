import { clientsContent } from "@/features/clients/clients-content"
import { LayoutPage } from "@/components/layout/layout-page"
import { ClientsDataTable } from "@/features/clients/clients-data-table"

export function ClientsPage() {
  return (
    <LayoutPage page={clientsContent.page}>
      <ClientsDataTable />
    </LayoutPage>
  )
}
