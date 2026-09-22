import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function DashboardPage() {
  return <AppPage page={getAppPage("dashboard")} />
}
