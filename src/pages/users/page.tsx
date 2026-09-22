import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function UsersPage() {
  return <AppPage page={getAppPage("users")} />
}
