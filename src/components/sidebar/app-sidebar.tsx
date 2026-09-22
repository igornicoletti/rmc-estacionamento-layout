import rmcLogoWhite from "@/assets/rmc-logo-white.webp"
import rmcSymbolMono from "@/assets/rmc-simbolo-mono.svg"
import { SidebarNavGroup } from "@/components/sidebar/sidebar-nav-group"
import { SidebarPrimaryNavigation } from "@/components/sidebar/sidebar-primary-navigation"
import type {
  SidebarNavigationItem,
  SidebarNavigationSection,
} from "@/components/sidebar/sidebar-types"
import {
  SidebarUnitsSwitcher,
  type SidebarUnitOption,
  type SidebarUnitsStatus,
} from "@/components/sidebar/sidebar-units-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  activeUnitId: string | undefined
  onActiveUnitChange: (unitId: string) => void
  primaryItems: readonly SidebarNavigationItem[]
  profile: string
  sections: readonly SidebarNavigationSection[]
  units: readonly SidebarUnitOption[]
  unitsStatus?: SidebarUnitsStatus
}

export function AppSidebar({
  activeUnitId,
  onActiveUnitChange,
  primaryItems,
  profile,
  sections,
  units,
  unitsStatus = "ready",
}: AppSidebarProps) {
  const { state } = useSidebar()
  const triggerLabel =
    state === "expanded" ? "Recolher menu lateral" : "Expandir menu lateral"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center">
        <img
          alt="Rede Monte Carlo"
          className="h-8 w-auto group-data-[collapsible=icon]:hidden"
          src={rmcLogoWhite}
        />
        <img
          alt=""
          className="hidden size-8 group-data-[collapsible=icon]:block"
          src={rmcSymbolMono}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarUnitsSwitcher
              onValueChange={onActiveUnitChange}
              status={unitsStatus}
              units={units}
              value={activeUnitId}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <nav aria-label="Navegação principal">
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
