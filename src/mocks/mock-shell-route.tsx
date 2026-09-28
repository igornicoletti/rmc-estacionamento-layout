import { useState } from "react"
import { Outlet } from "react-router"

import { appRoutes } from "@/app/app-routes"
import {
  navigationSections,
  primaryNavigation,
} from "@/components/sidebar/sidebar-items"
import { mockShellFixtures } from "@/mocks/mock-shell-fixtures"
import { sessionNotify } from "@/features/auth/auth-notify"
import { useSession } from "@/features/auth/auth-context"
import type { HeaderNotificationItem } from "@/components/header/header-notifications"
import { LayoutShell } from "@/components/layout/layout-shell"
import { notify } from "@/components/toast/toast-notify"

// Transitional demo integration; mock identity is not authenticated authority.
export function MockShellRoute() {
  const { isSigningOut, signOut } = useSession()
  const [unreadNotifications, setUnreadNotifications] = useState<
    HeaderNotificationItem[]
  >(() => [...mockShellFixtures.notifications])

  const handleNotificationRead = (notificationId: string) => {
    setUnreadNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    )
  }

  const handleLogout = () => {
    void signOut().catch(() => {
      notify(sessionNotify.signOutFailed)
    })
  }

  return (
    <LayoutShell
      primaryItems={primaryNavigation}
      sections={navigationSections}
      notificationsTo={appRoutes.notifications.path}
      profileTo={appRoutes.profile.path}
      currentUser={mockShellFixtures.currentUser}
      isSigningOut={isSigningOut}
      onLogout={handleLogout}
      onMarkAllAsRead={() => setUnreadNotifications([])}
      onNotificationRead={handleNotificationRead}
      unreadNotifications={unreadNotifications}
    >
      <Outlet />
    </LayoutShell>
  )
}
