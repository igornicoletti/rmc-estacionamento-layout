import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function ReportsPage() {
  return <AppPage page={getAppPage("reports")} />
}
