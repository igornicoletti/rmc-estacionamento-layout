import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function ClientsPage() {
  return <AppPage page={getAppPage("clients")} />
}
