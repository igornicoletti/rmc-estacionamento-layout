import { NavLink, useMatch } from "react-router"

import type { SidebarNavigationItem } from "@/components/sidebar/sidebar-types"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

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
        className="data-active:bg-transparent! data-active:text-primary! data-active:hover:bg-sidebar-accent! data-active:hover:text-primary!"
        isActive={active}
        render={<NavLink end={end} onClick={onNavigate} to={item.to} />}
        tooltip={item.label}
      >
        <Icon
          aria-hidden="true"
          className={
            active
              ? "text-primary"
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
