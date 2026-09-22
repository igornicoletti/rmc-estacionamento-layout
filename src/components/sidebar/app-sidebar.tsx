import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import type { SidebarNavigationItem, SidebarNavigationSection } from "@/components/sidebar/sidebar-types"

import { SidebarNavGroup } from "@/components/sidebar/sidebar-nav-group"
import { SidebarPrimaryNavigation } from "@/components/sidebar/sidebar-primary-navigation"
import {
  SidebarUnitsSwitcher,
  type SidebarUnitOption,
  type SidebarUnitsStatus,
} from "@/components/sidebar/sidebar-units-switcher"

interface AppSidebarProps {
  primaryItems: readonly SidebarNavigationItem[]
  sections: readonly SidebarNavigationSection[]
  activeUnitId: string | undefined
  onActiveUnitChange: (unitId: string) => void
  profile: string
  units: readonly SidebarUnitOption[]
  unitsStatus?: SidebarUnitsStatus
}

export function AppSidebar({
  primaryItems,
  sections,
  activeUnitId,
  onActiveUnitChange,
  profile,
  units,
  unitsStatus = "ready",
}: AppSidebarProps) {
  const { state } = useSidebar()
  const resolvedActiveUnitId = units.some((unit) => unit.id === activeUnitId)
    ? activeUnitId
    : units[0]?.id
  const triggerLabel =
    state === "expanded" ? "Recolher menu lateral" : "Expandir menu lateral"

  return (
    <Sidebar className="border-r-0!" collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-(--shell-header-height) shrink-0 border-b bg-background p-1 transition-[padding] ease-linear group-data-[collapsible=icon]:p-2">
        <SidebarUnitsSwitcher
          onValueChange={onActiveUnitChange}
          status={unitsStatus}
          units={units}
          value={resolvedActiveUnitId}
        />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <nav aria-label="Navegação principal">
          <SidebarPrimaryNavigation
            items={primaryItems}
            profile={profile}
          />

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
