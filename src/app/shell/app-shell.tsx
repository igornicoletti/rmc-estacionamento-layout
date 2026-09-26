import { useState, type ReactNode } from "react"
import { Outlet } from "react-router"

import { appPages } from "@/app/config/app-config"
import { notify } from "@/app/feedback/notify"
import { navigationSections, primaryNavigation } from "@/app/shell/app-navigation"
import { shellPreviewData } from "@/app/shell/app-preview"
import {
  AppNotifications,
  type AppNotificationItem,
  type AppNotificationsStatus,
} from "@/app/shell/components/app-notifications"
import { AppToolbar } from "@/app/shell/components/app-toolbar"
import { AppUserMenu } from "@/app/shell/components/app-user-menu"
import { SESSION_FEEDBACK } from "@/app/session/content/session-feedback"
import { useSession } from "@/app/session/session-context"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
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
  notificationsStatus?: AppNotificationsStatus
  onLogout: () => void
  onMarkAllAsRead: () => void
  onNotificationRead: (notificationId: string) => void
  readingNotificationId?: string
  unreadNotifications: readonly AppNotificationItem[]
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
      <AppSidebar
        primaryItems={primaryNavigation}
        profile={currentUser.profile}
        sections={navigationSections}
      />

      <SidebarInset>
        <AppToolbar>
          <AppNotifications
            isMarkingAllAsRead={isMarkingAllAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onNotificationRead={onNotificationRead}
            readingNotificationId={readingNotificationId}
            status={notificationsStatus}
            unreadNotifications={unreadNotifications}
            viewAllTo={appPages.notifications.path}
          />

          <AppUserMenu
            avatarSrc={currentUser.avatarSrc}
            email={currentUser.email}
            isSigningOut={isSigningOut}
            name={currentUser.name}
            onLogout={onLogout}
            profileTo={appPages.profile.path}
          />
        </AppToolbar>

        <div className="flex min-w-0 flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AppShellRoute() {
  const { isSigningOut, signOut } = useSession()
  const [unreadNotifications, setUnreadNotifications] = useState<
    AppNotificationItem[]
  >(() => [...shellPreviewData.notifications])

  const handleNotificationRead = (notificationId: string) => {
    setUnreadNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    )
  }

  const handleLogout = () => {
    void signOut().catch(() => {
      notify(SESSION_FEEDBACK.signOutFailed)
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
