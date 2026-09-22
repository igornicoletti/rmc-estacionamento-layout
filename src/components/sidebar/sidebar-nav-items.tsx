import { NavLink, useMatch } from "react-router"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { SidebarNavigationItem } from "@/components/sidebar/sidebar-types"

interface SidebarNavItemsProps {
  items: readonly SidebarNavigationItem[]
  onNavigate?: () => void
}

interface SidebarNavItemProps {
  item: SidebarNavigationItem
  onNavigate: () => void
}

function SidebarNavItem({ item, onNavigate }: SidebarNavItemProps) {
  const end = item.end ?? false
  const active = useMatch({ path: item.to, end }) !== null
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="rounded-full data-active:bg-sidebar-primary! data-active:text-sidebar-primary-foreground! data-active:hover:bg-sidebar-primary!"
        isActive={active}
        render={<NavLink end={end} onClick={onNavigate} to={item.to} />}
        tooltip={item.label}
      >
        <Icon
          aria-hidden="true"
          className={
            active
              ? "text-sidebar-primary-foreground"
              : "text-muted-foreground group-hover/menu-button:text-inherit"
          }
        />

        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function SidebarNavItems({ items, onNavigate }: SidebarNavItemsProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  const handleNavigation = () => {
    onNavigate?.()

    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarNavItem
          item={item}
          key={item.routeId}
          onNavigate={handleNavigation}
        />
      ))}
    </SidebarMenu>
  )
}
