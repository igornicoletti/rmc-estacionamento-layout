import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function UnitsPage() {
  return <AppPage page={getAppPage("units")} />
}
