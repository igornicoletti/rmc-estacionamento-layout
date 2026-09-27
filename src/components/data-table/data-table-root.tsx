import type { ReactNode } from "react"

export function DataTableRoot({ children, isBusy }: { children: ReactNode; isBusy: boolean }) {
  return <div aria-busy={isBusy} className="flex min-w-0 flex-col gap-4" data-slot="data-table-root">{children}</div>
}
