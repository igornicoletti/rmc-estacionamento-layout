import { ShieldCheckIcon } from "lucide-react"

import { SidebarNavItems } from "@/components/sidebar/sidebar-nav-items"
import type { SidebarNavigationItem } from "@/components/sidebar/sidebar-types"
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

interface SidebarPrimaryNavigationProps {
  items: readonly SidebarNavigationItem[]
  profile: string
}

export function SidebarPrimaryNavigation({
  items,
  profile,
}: SidebarPrimaryNavigationProps) {
  const profileLabel = profile.toLocaleUpperCase("pt-BR")

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <div className="flex h-9 items-center gap-2 px-3 text-sm text-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <ShieldCheckIcon aria-hidden="true" className="shrink-0 size-4" />
          <span className="truncate group-data-[collapsible=icon]:sr-only">
            {profileLabel}
          </span>
        </div>

        <SidebarNavItems items={items} />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
