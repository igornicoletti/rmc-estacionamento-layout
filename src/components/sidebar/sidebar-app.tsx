import { useState } from "react"
import { ChevronRightIcon, ShieldCheckIcon } from "lucide-react"
import { NavLink, useLocation } from "react-router"

import rmcLogoBlack from "@/assets/rmc-logo-black.webp"
import rmcLogoWhite from "@/assets/rmc-logo-white.webp"
import rmcSymbol from "@/assets/rmc-simbolo.svg"
import { appCopy } from "@/app/config/app-copy"
import {
  findActiveSidebarSectionId,
  matchesSidebarNavigationItem,
  type SidebarNavigationItem,
  type SidebarNavigationSection,
} from "@/components/sidebar/sidebar-navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

interface SidebarAppProps {
  primaryItems: readonly SidebarNavigationItem[]
  profile: string
  sections: readonly SidebarNavigationSection[]
}

interface SidebarItemsProps {
  items: readonly SidebarNavigationItem[]
  pathname: string
}

interface SidebarSectionsProps {
  pathname: string
  sections: readonly SidebarNavigationSection[]
}

interface SidebarSectionOverride {
  pathname: string
  sectionId: string | null
}

function SidebarItems({ items, pathname }: SidebarItemsProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        const active = matchesSidebarNavigationItem(item, pathname)

        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              className="data-active:bg-background data-active:text-primary data-active:hover:bg-background data-active:hover:text-primary [&_svg]:opacity-60 [&_svg]:transition-opacity hover:[&_svg]:opacity-100 data-active:[&_svg]:opacity-100 motion-reduce:[&_svg]:transition-none"
              isActive={active}
              render={
                <NavLink
                  end={item.end}
                  onClick={handleNavigation}
                  to={item.to}
                />
              }
              tooltip={item.label}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

function SidebarSections({ pathname, sections }: SidebarSectionsProps) {
  const { isMobile, state } = useSidebar()
  const activeSectionId = findActiveSidebarSectionId(sections, pathname)
  const [sectionOverride, setSectionOverride] =
    useState<SidebarSectionOverride | null>(null)
  const openSectionId =
    sectionOverride?.pathname === pathname
      ? sectionOverride.sectionId
      : activeSectionId

  if (!isMobile && state === "collapsed") {
    return sections.map((section) => (
      <SidebarGroup className="py-1" key={section.id}>
        <SidebarGroupContent>
          <SidebarItems items={section.items} pathname={pathname} />
        </SidebarGroupContent>
      </SidebarGroup>
    ))
  }

  return sections.map((section) => (
    <Collapsible
      className="group/collapsible"
      key={section.id}
      onOpenChange={(open) =>
        setSectionOverride({
          pathname,
          sectionId: open ? section.id : null,
        })
      }
      open={openSectionId === section.id}
    >
      <SidebarGroup className="py-1">
        <SidebarGroupLabel render={<CollapsibleTrigger />}>
          {section.label}
          <ChevronRightIcon
            aria-hidden="true"
            className="ml-auto transition-transform group-data-open/collapsible:rotate-90 motion-reduce:transition-none"
          />
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarItems items={section.items} pathname={pathname} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  ))
}

export function SidebarApp({
  primaryItems,
  profile,
  sections,
}: SidebarAppProps) {
  const { pathname } = useLocation()
  const { state } = useSidebar()
  const profileLabel = profile.toLocaleUpperCase("pt-BR")
  const triggerLabel =
    state === "expanded" ? appCopy.sidebar.collapse : appCopy.sidebar.expand

  return (
    <Sidebar className="border-r-0!" collapsible="icon">
      <SidebarHeader className="h-16 items-center justify-center border-b bg-background">
        <div className="group-data-[collapsible=icon]:hidden">
          <img
            alt={appCopy.brand.name}
            className="h-11 w-auto dark:hidden"
            src={rmcLogoBlack}
          />
          <img
            alt={appCopy.brand.name}
            className="hidden h-11 w-auto dark:block"
            src={rmcLogoWhite}
          />
        </div>

        <img
          alt={appCopy.brand.name}
          className="hidden size-10 group-data-[collapsible=icon]:block"
          src={rmcSymbol}
        />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <nav aria-label={appCopy.sidebar.navigation}>
          <SidebarGroup className="pt-4 pb-2">
            <SidebarGroupContent className="flex flex-col gap-2">
              <div className="flex h-9 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 text-sm text-primary group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!">
                <ShieldCheckIcon
                  aria-hidden="true"
                  className="size-4 shrink-0"
                />
                <span className="truncate group-data-[collapsible=icon]:sr-only">
                  {profileLabel}
                </span>
              </div>

              <SidebarItems items={primaryItems} pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSections pathname={pathname} sections={sections} />
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
