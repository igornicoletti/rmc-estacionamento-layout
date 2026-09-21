import type { ReactNode } from "react"

interface DataTableRootProps {
  children: ReactNode
  isBusy: boolean
}

export function DataTableRoot({ children, isBusy }: DataTableRootProps) {
  return (
    <div
      data-slot="data-table-root"
      className="flex min-w-0 flex-col gap-4"
      aria-busy={isBusy}
    >
      {children}
    </div>
  )
}
