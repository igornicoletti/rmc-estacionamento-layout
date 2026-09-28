import { clientErpFixture } from "@/mocks/mock-clients-fixtures"

import { mapErpClients } from "@/features/clients/mapping/clients-mapper"

// Explicit demo reader; real API and cache policy await their own contract.
export const clientsQueryKeys = {
  clients: ["preview-data", "erp-clients"] as const,
}
export function loadDemoClients() {
  return mapErpClients(clientErpFixture)
}
