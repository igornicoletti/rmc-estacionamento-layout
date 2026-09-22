import { appPages } from "@/app/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"

export function NotificationsPage() {
  return <AppPageLayout page={appPages["notifications"]} />
}
