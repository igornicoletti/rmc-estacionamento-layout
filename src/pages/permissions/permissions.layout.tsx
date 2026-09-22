import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyDataTablePreview } from "@/components/data-table/components/lazy-data-table-preview"

export function PermissionsPage() {
  return (
    <AppPageLayout page={appPages["permissions"]}>
      <LazyDataTablePreview
        caption="Lista de permissões"
        idPrefix="prm"
        itemLabel={{ singular: "permissão", plural: "permissões" }}
      />
    </AppPageLayout>
  )
}
