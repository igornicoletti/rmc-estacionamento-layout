import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function PermissionsPage() {
  return <AppPage page={getAppPage("permissions")} />
}
