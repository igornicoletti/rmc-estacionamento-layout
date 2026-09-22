import { appPages } from "@/app/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"

export function UsersPage() {
  return <AppPageLayout page={appPages["users"]} />
}
