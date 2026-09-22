import { ChevronRightIcon } from "lucide-react"
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

type SidebarNavGroupProps = Pick<SidebarNavigationSection, "items" | "label"> & {
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function SidebarNavGroup({
  label,
  items,
  onOpenChange,
  open,
}: SidebarNavGroupProps) {
  const { isMobile, state } = useSidebar()

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
      onOpenChange={onOpenChange}
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
