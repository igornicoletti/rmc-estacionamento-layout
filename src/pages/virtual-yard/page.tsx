import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function VirtualYardPage() {
  return <AppPage page={getAppPage("virtual-yard")} />
}
