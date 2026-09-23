import { lazy, Suspense } from "react"

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
    <Suspense fallback={null}>
      <ClientVehiclesDataTable clientId={clientId} />
    </Suspense>
  )
}
