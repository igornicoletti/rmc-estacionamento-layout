import { useState, type ReactNode } from "react"
import { Outlet } from "react-router"

import { appPages } from "@/app/app-config"
import { navigationSections, primaryNavigation } from "@/app/app-navigation"
import { shellPreviewData } from "@/app/app-preview"
import { useSession } from "@/app/session/session-context"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarHeaderBar } from "@/components/sidebar/sidebar-header"
import {
  SidebarNotifications,
  type SidebarNotificationItem,
  type SidebarNotificationsStatus,
} from "@/components/sidebar/sidebar-notifications"
import { SidebarUserMenu } from "@/components/sidebar/sidebar-user-menu"
import type {
  SidebarUnitOption,
  SidebarUnitsStatus,
} from "@/components/sidebar/sidebar-units-switcher"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { toast } from "@/components/ui/toast"

interface AppShellUser {
  avatarSrc?: string
  email?: string
  name: string
  profile: string
}

export interface AppShellProps {
  activeUnitId: string | undefined
  children: ReactNode
  currentUser: AppShellUser
  isMarkingAllAsRead?: boolean
  isSigningOut?: boolean
  notificationsStatus?: SidebarNotificationsStatus
  onActiveUnitChange: (unitId: string) => void
  onLogout: () => void
  onMarkAllAsRead: () => void
  onNotificationRead: (notificationId: string) => void
  readingNotificationId?: string
  unreadNotifications: readonly SidebarNotificationItem[]
  units: readonly SidebarUnitOption[]
  unitsStatus?: SidebarUnitsStatus
}

export function AppShell({
  activeUnitId,
  children,
  currentUser,
  isMarkingAllAsRead = false,
  isSigningOut = false,
  notificationsStatus = "ready",
  onActiveUnitChange,
  onLogout,
  onMarkAllAsRead,
  onNotificationRead,
  readingNotificationId,
  unreadNotifications,
  units,
  unitsStatus = "ready",
}: AppShellProps) {
  return (
    <SidebarProvider className="[--shell-header-height:3rem]">
      <AppSidebar
        activeUnitId={activeUnitId}
        onActiveUnitChange={onActiveUnitChange}
        primaryItems={primaryNavigation}
        profile={currentUser.profile}
        sections={navigationSections}
        units={units}
        unitsStatus={unitsStatus}
      />

      <SidebarInset>
        <SidebarHeaderBar>
          <SidebarNotifications
            isMarkingAllAsRead={isMarkingAllAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onNotificationRead={onNotificationRead}
            readingNotificationId={readingNotificationId}
            status={notificationsStatus}
            unreadNotifications={unreadNotifications}
            viewAllTo={appPages.notifications.path}
          />

          <SidebarUserMenu
            avatarSrc={currentUser.avatarSrc}
            email={currentUser.email}
            isSigningOut={isSigningOut}
            name={currentUser.name}
            onLogout={onLogout}
            profileTo={appPages.profile.path}
          />
        </SidebarHeaderBar>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AppShellRoute() {
  const { isSigningOut, signOut } = useSession()
  const [activeUnitId, setActiveUnitId] = useState<string | undefined>(
    shellPreviewData.units[0]?.id,
  )
  const [unreadNotifications, setUnreadNotifications] = useState<
    SidebarNotificationItem[]
  >(() => [...shellPreviewData.notifications])

  const handleNotificationRead = (notificationId: string) => {
    setUnreadNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    )
  }

  const handleLogout = () => {
    void signOut().catch(() => {
      toast.add({
        description: "Tente novamente.",
        priority: "high",
        title: "Não foi possível sair",
        type: "error",
      })
    })
  }

  return (
    <AppShell
      activeUnitId={activeUnitId}
      currentUser={shellPreviewData.currentUser}
      isSigningOut={isSigningOut}
      onActiveUnitChange={setActiveUnitId}
      onLogout={handleLogout}
      onMarkAllAsRead={() => setUnreadNotifications([])}
      onNotificationRead={handleNotificationRead}
      unreadNotifications={unreadNotifications}
      units={shellPreviewData.units}
    >
      <Outlet />
    </AppShell>
  )
}
