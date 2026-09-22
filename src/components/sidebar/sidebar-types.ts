import type { LucideIcon } from "lucide-react"

export interface SidebarNavigationItem {
  routeId: string
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface SidebarNavigationSection {
  id: string
  label: string
  items: readonly SidebarNavigationItem[]
}
