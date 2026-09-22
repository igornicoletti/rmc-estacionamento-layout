import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"

export function DashboardPage() {
  return <AppPageLayout page={appPages["dashboard"]} />
}
