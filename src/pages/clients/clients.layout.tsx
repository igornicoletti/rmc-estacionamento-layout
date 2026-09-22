import { appPages } from "@/app/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"

export function ClientsPage() {
  return <AppPageLayout page={appPages["clients"]} />
}
