import type { ReactNode } from "react"

import { SidebarTrigger } from "@/components/ui/sidebar"

export function SidebarHeaderBar({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-(--shell-header-height) shrink-0 items-center gap-2 border-b bg-background px-4">
      <img alt="Rede Monte Carlo" className="size-8 md:hidden" src="/favicon.svg" />
      <SidebarTrigger aria-label="Abrir menu lateral" className="md:hidden" />
      <div className="ml-auto flex min-w-0 items-center gap-1">{children}</div>
    </header>
  )
}
