import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyDataTablePreview } from "@/components/data-table/components/lazy-data-table-preview"

export function NotificationsPage() {
  return (
    <AppPageLayout page={appPages["notifications"]}>
      <LazyDataTablePreview
        caption="Lista de notificações"
        idPrefix="ntf"
        itemLabel={{ singular: "notificação", plural: "notificações" }}
      />
    </AppPageLayout>
  )
}
