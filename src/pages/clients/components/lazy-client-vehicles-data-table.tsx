import { lazy, Suspense } from "react"

import { DataTableLazyFallback } from "@/components/data-table/components/data-table-state"

const ClientVehiclesDataTable = lazy(() =>
  import("@/pages/clients/components/client-vehicles-data-table").then(
    (module) => ({ default: module.ClientVehiclesDataTable }),
  ),
)

interface LazyClientVehiclesDataTableProps {
  clientId: string
}

export function LazyClientVehiclesDataTable({
  clientId,
}: LazyClientVehiclesDataTableProps) {
  return (
    <Suspense fallback={<DataTableLazyFallback />}>
      <ClientVehiclesDataTable clientId={clientId} />
    </Suspense>
  )
}
