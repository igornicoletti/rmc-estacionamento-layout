import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyDataTablePreview } from "@/components/data-table/components/lazy-data-table-preview"

export function AuditPage() {
  return (
    <AppPageLayout page={appPages["audit"]}>
      <LazyDataTablePreview
        caption="Lista de eventos de auditoria"
        idPrefix="aud"
        itemLabel={{ singular: "evento", plural: "eventos" }}
      />
    </AppPageLayout>
  )
}
