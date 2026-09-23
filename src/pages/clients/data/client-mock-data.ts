import { mapLegacyClientVehicles } from "@/pages/clients/model/client-vehicle-mapper"
import { mapLegacyClients } from "@/pages/clients/model/client-mapper"

export const clientMockQueryKeys = {
  clients: ["mock-data", "erp-clients"] as const,
  vehicles: ["mock-data", "erp-client-vehicles"] as const,
}

function mockAssetUrl(fileName: string) {
  return `${import.meta.env.BASE_URL}mock-data/${fileName}`
}

async function fetchMockJson(fileName: string) {
  const response = await fetch(mockAssetUrl(fileName), {
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw response
  }

  return response.json() as Promise<unknown>
}

export async function loadMockClients() {
  return mapLegacyClients(await fetchMockJson("erp-clients.json"))
}

export async function loadMockClientVehicles() {
  return mapLegacyClientVehicles(
    await fetchMockJson("erp-client-vehicles.json"),
  )
}
