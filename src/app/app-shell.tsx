import { useState, type ReactNode } from "react"
import { Outlet } from "react-router"

import { appCopy } from "@/app/app-copy"
import { appPages } from "@/app/app-config"
import { navigationSections, primaryNavigation } from "@/app/app-navigation"
import { shellPreviewData } from "@/app/app-preview"
import {
  AppNotifications,
  type AppNotificationItem,
  type AppNotificationsStatus,
} from "@/app/components/app-notifications"
import { AppToolbar } from "@/app/components/app-toolbar"
import { AppUserMenu } from "@/app/components/app-user-menu"
import { useSession } from "@/app/session/session-context"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { toast } from "@/components/ui/toast"

interface AppShellUser {
  avatarSrc?: string
  email?: string
  name: string
  profile: string
}

export interface AppShellProps {
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

export function AppShell({
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

        <div className="flex flex-1 flex-col p-6">{children}</div>
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
      toast.add({
        description: appCopy.feedback.logoutFailure.description,
        priority: "high",
        title: appCopy.feedback.logoutFailure.title,
        type: "error",
      })
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
