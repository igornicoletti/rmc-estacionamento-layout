import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyDataTablePreview } from "@/components/data-table/components/lazy-data-table-preview"

export function ClientsPage() {
  return (
    <AppPageLayout page={appPages["clients"]}>
      <LazyDataTablePreview
        caption="Lista de clientes"
        idPrefix="cli"
        itemLabel={{ singular: "cliente", plural: "clientes" }}
      />
    </AppPageLayout>
  )
}
