import { clientVehicleErpFixture } from "@/mocks/mock-vehicles-fixtures"
import { mapErpClientVehicles } from "@/features/clients/vehicles/vehicles-mapper"

// Explicit demo reader; preserve the existing vehicle cache family.
export const vehiclesQueryKeys = {
  vehicles: ["preview-data", "erp-client-vehicles"] as const,
}
export function loadDemoVehicles() {
  return mapErpClientVehicles(clientVehicleErpFixture)
}
