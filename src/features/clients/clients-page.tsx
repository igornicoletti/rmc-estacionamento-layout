import { clientsContent } from "@/features/clients/content/clients-content"
import { LayoutPage } from "@/components/layout/layout-page"
import { ClientsDataTable } from "@/features/clients/components/clients-data-table"

export function ClientsPage() {
  return (
    <LayoutPage page={clientsContent.page}>
      <ClientsDataTable />
    </LayoutPage>
  )
}
