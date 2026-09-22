import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyDataTablePreview } from "@/components/data-table/components/lazy-data-table-preview"

export function RulesPage() {
  return (
    <AppPageLayout page={appPages["rules"]}>
      <LazyDataTablePreview
        caption="Lista de regras"
        idPrefix="rul"
        itemLabel={{ singular: "regra", plural: "regras" }}
      />
    </AppPageLayout>
  )
}
