import { useState, type ReactNode } from "react"

import { appPages } from "@/app/app-config"
import { navigationSections, primaryNavigation } from "@/app/app-navigation"
import { shellPreviewData } from "@/app/app-preview"
import { useSession } from "@/app/session/session-context"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarHeaderBar } from "@/components/sidebar/sidebar-header"
import {
  SidebarNotifications,
  type SidebarNotificationItem,
} from "@/components/sidebar/sidebar-notifications"
import { SidebarUserMenu } from "@/components/sidebar/sidebar-user-menu"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
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

  return (
    <SidebarProvider className="[--shell-header-height:3rem]">
      <AppSidebar
        activeUnitId={activeUnitId}
        onActiveUnitChange={setActiveUnitId}
        primaryItems={primaryNavigation}
        profile={shellPreviewData.currentUser.profile}
        sections={navigationSections}
        units={shellPreviewData.units}
      />

      <SidebarInset>
        <SidebarHeaderBar>
          <SidebarNotifications
            onMarkAllAsRead={() => setUnreadNotifications([])}
            onNotificationRead={handleNotificationRead}
            unreadNotifications={unreadNotifications}
            viewAllTo={appPages.notifications.path}
          />

          <SidebarUserMenu
            email={shellPreviewData.currentUser.email}
            isSigningOut={isSigningOut}
            name={shellPreviewData.currentUser.name}
            onLogout={() => void signOut().catch(() => undefined)}
            profileTo={appPages.profile.path}
          />
        </SidebarHeaderBar>

        <main className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
