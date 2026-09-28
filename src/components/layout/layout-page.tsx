import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"

interface LayoutPageProps {
  actions?: ReactNode
  children?: ReactNode
  page: {
    title: string
    subtitle: string
  }
}

export function LayoutPage({ actions, children, page }: LayoutPageProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold">{page.title}</h1>
          <p className="text-sm text-muted-foreground">{page.subtitle}</p>
        </div>

        {actions ? (
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:items-center">
            {actions}
          </div>
        ) : null}
      </div>

      <Separator />

      {children}
    </div>
  )
}
