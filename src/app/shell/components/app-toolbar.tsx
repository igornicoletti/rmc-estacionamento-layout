import type { ReactNode } from "react";

import { appCopy } from "@/app/config/app-copy";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function AppToolbar({ children }: { children: ReactNode }) {
  const { isMobile, openMobile, state } = useSidebar();
  const isOpen = isMobile ? openMobile : state === "expanded";

  return (
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger
        aria-label={
          isOpen ? appCopy.toolbar.closeSidebar : appCopy.toolbar.openSidebar
        }
        className="md:hidden"
      />
      <div className="ml-auto flex items-center gap-1">{children}</div>
    </div>
  );
}
