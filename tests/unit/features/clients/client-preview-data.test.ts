import { describe, expect, it } from "vitest"

import { loadDemoClients } from "@/features/clients/queries/clients-query"
import { loadDemoVehicles } from "@/features/clients/vehicles/queries/vehicles-query"

describe("client preview data", () => {
  it("fornece uma coleção sintética determinística sem metadados internos", () => {
    const clients = loadDemoClients()
    const vehicles = loadDemoVehicles()

    expect(clients).toHaveLength(24)
    expect(vehicles).toHaveLength(48)
    expect(clients[0]).not.toHaveProperty("sourceHash")
    expect(vehicles[0]).not.toHaveProperty("sourceHash")
    expect(JSON.stringify({ clients, vehicles })).not.toMatch(
      /192\.168\.|10\.\d+\.|nom_banco_dados/u,
    )
  })
})
