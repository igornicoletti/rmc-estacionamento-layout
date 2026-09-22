import { getAppPage } from "@/app/routing/route-catalog"
import { AppPage } from "@/components/common/app-page"

export function NotificationsPage() {
  return <AppPage page={getAppPage("notifications")} />
}
