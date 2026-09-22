import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function AccountSecurityPage() {
  return <AppPage page={getAppPage("account-security")} />
}
