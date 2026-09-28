import type { ReactNode } from "react";

import { headerContent } from "@/components/header/header-content";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function Header({ children }: { children: ReactNode }) {
  const { isMobile, openMobile, state } = useSidebar();
  const isOpen = isMobile ? openMobile : state === "expanded";

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger
        aria-label={
          isOpen ? headerContent.sidebar.close : headerContent.sidebar.open
        }
        className="md:hidden"
      />
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
