import { appPages } from "@/app/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"

export function PermissionsPage() {
  return <AppPageLayout page={appPages["permissions"]} />
}
