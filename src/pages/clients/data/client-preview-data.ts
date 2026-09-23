import {
  clientErpFixture,
  clientVehicleErpFixture,
} from "@/pages/clients/data/client-erp.fixture"
import { mapErpClientVehicles } from "@/pages/clients/model/client-vehicle-mapper"
import { mapErpClients } from "@/pages/clients/model/client-mapper"

export const clientPreviewQueryKeys = {
  clients: ["preview-data", "erp-clients"] as const,
  vehicles: ["preview-data", "erp-client-vehicles"] as const,
}

export function loadPreviewClients() {
  return mapErpClients(clientErpFixture)
}

export function loadPreviewClientVehicles() {
  return mapErpClientVehicles(clientVehicleErpFixture)
}
