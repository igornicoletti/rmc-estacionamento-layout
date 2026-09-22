import { appPages } from "@/app/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"

export function PricesPage() {
  return <AppPageLayout page={appPages["prices"]} />
}
