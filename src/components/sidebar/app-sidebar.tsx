import rmcLogoBlack from "@/assets/rmc-logo-black.webp"
import rmcLogoWhite from "@/assets/rmc-logo-white.webp"
import rmcSymbol from "@/assets/rmc-simbolo.svg"
import { appCopy } from "@/app/app-copy"
import { SidebarNavGroup } from "@/components/sidebar/sidebar-nav-group"
import { SidebarPrimaryNavigation } from "@/components/sidebar/sidebar-primary-navigation"
import type {
  SidebarNavigationItem,
  SidebarNavigationSection,
} from "@/components/sidebar/sidebar-types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  primaryItems: readonly SidebarNavigationItem[]
  profile: string
  sections: readonly SidebarNavigationSection[]
}

export function AppSidebar({
  primaryItems,
  profile,
  sections,
}: AppSidebarProps) {
  const { state } = useSidebar()
  const triggerLabel =
    state === "expanded" ? appCopy.sidebar.collapse : appCopy.sidebar.expand

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 items-center justify-center border-b bg-background p-1">
        <div className="group-data-[collapsible=icon]:hidden">
          <img
            alt={appCopy.brand.name}
            className="h-9 w-auto dark:hidden"
            src={rmcLogoBlack}
          />
          <img
            alt={appCopy.brand.name}
            className="hidden h-9 w-auto dark:block"
            src={rmcLogoWhite}
          />
        </div>

        <img
          alt={appCopy.brand.name}
          className="hidden size-8 group-data-[collapsible=icon]:block"
          src={rmcSymbol}
        />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <nav aria-label={appCopy.sidebar.navigation}>
          <SidebarPrimaryNavigation items={primaryItems} profile={profile} />

          {sections.map((section) => (
            <SidebarNavGroup
              items={section.items}
              key={section.id}
              label={section.label}
            />
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarTrigger
          aria-label={triggerLabel}
          className="hidden md:inline-flex"
        />
      </SidebarFooter>
    </Sidebar>
  )
}
