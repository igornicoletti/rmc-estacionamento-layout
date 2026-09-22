import { ShieldCheckIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { SidebarNavigationItem } from "@/components/sidebar/sidebar-types"

import { SidebarNavItems } from "@/components/sidebar/sidebar-nav-items"

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
      <SidebarGroupContent className="flex flex-col gap-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary group-data-[collapsible=icon]:justify-center"
              render={<div />}
              title={`Perfil: ${profileLabel}`}
            >
              <ShieldCheckIcon aria-hidden="true" />
              <span className="group-data-[collapsible=icon]:hidden">
                {profileLabel}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarNavItems items={items} />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
