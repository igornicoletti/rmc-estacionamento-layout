import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { LazyDataTablePreview } from "@/components/data-table/components/lazy-data-table-preview"

export function PricesPage() {
  return (
    <AppPageLayout page={appPages["prices"]}>
      <LazyDataTablePreview
        caption="Lista de preços"
        idPrefix="prc"
        itemLabel={{ singular: "preço", plural: "preços" }}
      />
    </AppPageLayout>
  )
}
