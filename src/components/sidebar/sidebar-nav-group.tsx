import { ChevronRightIcon } from "lucide-react"
import { useState } from "react"
import { matchPath, useLocation } from "react-router"

import { SidebarNavItems } from "@/components/sidebar/sidebar-nav-items"
import type { SidebarNavigationSection } from "@/components/sidebar/sidebar-types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"

type SidebarNavGroupProps = Pick<SidebarNavigationSection, "items" | "label">

export function SidebarNavGroup({ label, items }: SidebarNavGroupProps) {
  const { pathname } = useLocation()
  const { isMobile, state } = useSidebar()
  const hasActiveItem = items.some(
    (item) =>
      matchPath({ path: item.to, end: item.end ?? false }, pathname) !== null,
  )
  const [manualOpen, setManualOpen] = useState(false)
  const open = hasActiveItem || manualOpen

  const handleOpenChange = (nextOpen: boolean) => {
    if (!hasActiveItem) {
      setManualOpen(nextOpen)
    }
  }

  if (!isMobile && state === "collapsed") {
    return (
      <SidebarGroup className="py-1">
        <SidebarGroupContent>
          <SidebarNavItems items={items} />
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <Collapsible
      className="group/collapsible"
      onOpenChange={handleOpenChange}
      open={open}
    >
      <SidebarGroup className="py-1">
        <SidebarGroupLabel render={<CollapsibleTrigger />}>
          {label}
          <ChevronRightIcon
            aria-hidden="true"
            className="ml-auto transition-transform group-data-open/collapsible:rotate-90 motion-reduce:transition-none"
          />
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarNavItems items={items} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
