import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function RulesPage() {
  return <AppPage page={getAppPage("rules")} />
}
