import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function AuditPage() {
  return <AppPage page={getAppPage("audit")} />
}
