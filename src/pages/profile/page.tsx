import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function ProfilePage() {
  return <AppPage page={getAppPage("profile")} />
}
