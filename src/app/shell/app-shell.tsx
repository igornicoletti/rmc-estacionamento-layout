import { useState, type ReactNode } from "react"
import { Outlet } from "react-router"

import { appPages } from "@/app/config/app-config"
import { navigationSections, primaryNavigation } from "@/app/shell/app-navigation"
import { shellPreviewData } from "@/app/shell/app-preview"
import { sessionNotify } from "@/app/session/content/session-notify"
import { useSession } from "@/app/session/session-context"
import { Header } from "@/components/header/header"
import {
  HeaderNotifications,
  type HeaderNotificationItem,
  type HeaderNotificationsStatus,
} from "@/components/header/header-notifications"
import { HeaderUserMenu } from "@/components/header/header-user-menu"
import { SidebarApp } from "@/components/sidebar/sidebar-app"
import { notify } from "@/components/toast/toast-notify"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface AppShellUser {
  avatarSrc?: string
  email?: string
  name: string
  profile: string
}

interface AppShellProps {
  children: ReactNode
  currentUser: AppShellUser
  isMarkingAllAsRead?: boolean
  isSigningOut?: boolean
  notificationsStatus?: HeaderNotificationsStatus
  onLogout: () => void
  onMarkAllAsRead: () => void
  onNotificationRead: (notificationId: string) => void
  readingNotificationId?: string
  unreadNotifications: readonly HeaderNotificationItem[]
}

function AppShell({
  children,
  currentUser,
  isMarkingAllAsRead = false,
  isSigningOut = false,
  notificationsStatus = "ready",
  onLogout,
  onMarkAllAsRead,
  onNotificationRead,
  readingNotificationId,
  unreadNotifications,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <SidebarApp
        primaryItems={primaryNavigation}
        profile={currentUser.profile}
        sections={navigationSections}
      />

      <SidebarInset>
        <Header>
          <HeaderNotifications
            isMarkingAllAsRead={isMarkingAllAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onNotificationRead={onNotificationRead}
            readingNotificationId={readingNotificationId}
            status={notificationsStatus}
            unreadNotifications={unreadNotifications}
            viewAllTo={appPages.notifications.path}
          />

          <HeaderUserMenu
            avatarSrc={currentUser.avatarSrc}
            email={currentUser.email}
            isSigningOut={isSigningOut}
            name={currentUser.name}
            onLogout={onLogout}
            profileTo={appPages.profile.path}
          />
        </Header>

        <div className="flex min-w-0 flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AppShellRoute() {
  const { isSigningOut, signOut } = useSession()
  const [unreadNotifications, setUnreadNotifications] = useState<
    HeaderNotificationItem[]
  >(() => [...shellPreviewData.notifications])

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
    <AppShell
      currentUser={shellPreviewData.currentUser}
      isSigningOut={isSigningOut}
      onLogout={handleLogout}
      onMarkAllAsRead={() => setUnreadNotifications([])}
      onNotificationRead={handleNotificationRead}
      unreadNotifications={unreadNotifications}
    >
      <Outlet />
    </AppShell>
  )
}
