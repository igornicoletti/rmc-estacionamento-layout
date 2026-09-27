import type { LucideIcon } from "lucide-react"
import { matchPath } from "react-router"

export interface SidebarNavigationItem {
  readonly id: string
  readonly label: string
  readonly to: string
  readonly icon: LucideIcon
  readonly end: boolean
}

export interface SidebarNavigationSection {
  readonly id: string
  readonly label: string
  readonly items: readonly SidebarNavigationItem[]
}

export function matchesSidebarNavigationItem(
  item: SidebarNavigationItem,
  pathname: string,
) {
  return matchPath({ path: item.to, end: item.end }, pathname) !== null
}

export function findActiveSidebarSectionId(
  sections: readonly SidebarNavigationSection[],
  pathname: string,
) {
  return (
    sections.find((section) =>
      section.items.some((item) =>
        matchesSidebarNavigationItem(item, pathname),
      ),
    )?.id ?? null
  )
}
