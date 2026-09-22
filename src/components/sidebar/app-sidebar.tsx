import { useState } from "react";
import { matchPath, useLocation } from "react-router";

import rmcLogoBlack from "@/assets/rmc-logo-black.webp";
import rmcLogoWhite from "@/assets/rmc-logo-white.webp";
import rmcSymbol from "@/assets/rmc-simbolo.svg";
import { appCopy } from "@/app/config/app-copy";
import { SidebarNavGroup } from "@/components/sidebar/sidebar-nav-group";
import { SidebarMain } from "@/components/sidebar/sidebar-main";
import type {
  SidebarNavigationItem,
  SidebarNavigationSection,
} from "@/components/sidebar/sidebar-types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  primaryItems: readonly SidebarNavigationItem[];
  profile: string;
  sections: readonly SidebarNavigationSection[];
}

interface SidebarSectionsProps {
  sections: readonly SidebarNavigationSection[];
}

function SidebarSections({ sections }: SidebarSectionsProps) {
  const { pathname } = useLocation();
  const activeSectionId = sections.find((section) =>
    section.items.some(
      (item) =>
        matchPath({ path: item.to, end: item.end ?? false }, pathname) !== null,
    ),
  )?.id;
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    activeSectionId ?? null,
  );

  return sections.map((section) => (
    <SidebarNavGroup
      items={section.items}
      key={section.id}
      label={section.label}
      onOpenChange={(open) => setOpenSectionId(open ? section.id : null)}
      open={openSectionId === section.id}
    />
  ));
}

export function AppSidebar({
  primaryItems,
  profile,
  sections,
}: AppSidebarProps) {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const triggerLabel =
    state === "expanded" ? appCopy.sidebar.collapse : appCopy.sidebar.expand;

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
          <SidebarMain items={primaryItems} profile={profile} />

          <SidebarSections key={pathname} sections={sections} />
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarTrigger
          aria-label={triggerLabel}
          className="hidden md:inline-flex"
        />
      </SidebarFooter>
    </Sidebar>
  );
}
