import type { ReactNode } from "react"
import { Header } from "@/components/header/header"
import {
  HeaderNotifications,
  type HeaderNotificationItem,
  type HeaderNotificationsStatus,
} from "@/components/header/header-notifications"
import { HeaderUserMenu } from "@/components/header/header-user-menu"
import { SidebarApp } from "@/components/sidebar/sidebar-app"
import type {
  SidebarNavigationItem,
  SidebarNavigationSection,
} from "@/components/sidebar/sidebar-navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface LayoutShellUser {
  avatarSrc?: string
  email?: string
  name: string
  profile: string
}

interface LayoutShellProps {
  primaryItems: readonly SidebarNavigationItem[]
  sections: readonly SidebarNavigationSection[]
  notificationsTo: string
  profileTo: string
  children: ReactNode
  currentUser: LayoutShellUser
  isMarkingAllAsRead?: boolean
  isSigningOut?: boolean
  notificationsStatus?: HeaderNotificationsStatus
  onLogout: () => void
  onMarkAllAsRead: () => void
  onNotificationRead: (notificationId: string) => void
  readingNotificationId?: string
  unreadNotifications: readonly HeaderNotificationItem[]
}

export function LayoutShell({
  primaryItems,
  sections,
  notificationsTo,
  profileTo,
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
}: LayoutShellProps) {
  return (
    <SidebarProvider>
      <SidebarApp
        primaryItems={primaryItems}
        profile={currentUser.profile}
        sections={sections}
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
            viewAllTo={notificationsTo}
          />

          <HeaderUserMenu
            avatarSrc={currentUser.avatarSrc}
            email={currentUser.email}
            isSigningOut={isSigningOut}
            name={currentUser.name}
            onLogout={onLogout}
            profileTo={profileTo}
          />
        </Header>

        <div className="flex min-w-0 flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
