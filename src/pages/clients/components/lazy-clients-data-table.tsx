import { lazy, Suspense } from "react"

const ClientsDataTable = lazy(() =>
  import("@/pages/clients/components/clients-data-table").then((module) => ({
    default: module.ClientsDataTable,
  })),
)

export function LazyClientsDataTable() {
  return (
    <Suspense fallback={null}>
      <ClientsDataTable />
    </Suspense>
  )
}
