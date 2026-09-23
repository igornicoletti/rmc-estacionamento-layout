import { describe, expect, it } from "vitest"

import {
  loadPreviewClients,
  loadPreviewClientVehicles,
} from "@/pages/clients/data/client-preview-data"

describe("client preview data", () => {
  it("fornece uma coleção sintética determinística sem metadados internos", () => {
    const clients = loadPreviewClients()
    const vehicles = loadPreviewClientVehicles()

    expect(clients).toHaveLength(24)
    expect(vehicles).toHaveLength(48)
    expect(clients[0]).not.toHaveProperty("sourceHash")
    expect(vehicles[0]).not.toHaveProperty("sourceHash")
    expect(JSON.stringify({ clients, vehicles })).not.toMatch(/192\.168\.|10\.\d+\.|nom_banco_dados/u)
  })
})
