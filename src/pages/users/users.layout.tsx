import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyDataTablePreview } from "@/components/data-table/components/lazy-data-table-preview"

export function UsersPage() {
  return (
    <AppPageLayout page={appPages["users"]}>
      <LazyDataTablePreview
        caption="Lista de usuários"
        idPrefix="usr"
        itemLabel={{ singular: "usuário", plural: "usuários" }}
      />
    </AppPageLayout>
  )
}
