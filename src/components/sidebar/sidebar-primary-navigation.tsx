import { ShieldCheckIcon } from "lucide-react";

import { SidebarNavItems } from "@/components/sidebar/sidebar-nav-items";
import type { SidebarNavigationItem } from "@/components/sidebar/sidebar-types";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";

interface SidebarPrimaryNavigationProps {
  items: readonly SidebarNavigationItem[];
  profile: string;
}

export function SidebarPrimaryNavigation({
  items,
  profile,
}: SidebarPrimaryNavigationProps) {
  const profileLabel = profile.toLocaleUpperCase("pt-BR");

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-3">
        <div
          className="flex h-9 w-full items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 text-sm text-primary group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2!"
          title={`Perfil: ${profileLabel}`}
        >
          <ShieldCheckIcon aria-hidden="true" className="shrink-0" />
          <span className="group-data-[collapsible=icon]:sr-only">
            {profileLabel}
          </span>
        </div>

        <SidebarNavItems items={items} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
