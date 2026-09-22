import { appPages } from "@/app/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"

export function AuditPage() {
  return <AppPageLayout page={appPages["audit"]} />
}
