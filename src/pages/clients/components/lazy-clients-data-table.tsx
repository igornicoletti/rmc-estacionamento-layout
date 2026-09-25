import { lazy, Suspense } from "react"

import { DataTableLazyFallback } from "@/components/data-table/components/data-table-state"

const ClientsDataTable = lazy(() =>
  import("@/pages/clients/components/clients-data-table").then((module) => ({
    default: module.ClientsDataTable,
  })),
)

export function LazyClientsDataTable() {
  return (
    <Suspense fallback={<DataTableLazyFallback />}>
      <ClientsDataTable />
    </Suspense>
  )
}
