import { describe, expect, it } from "vitest"

import { clientVehicleErpFixture } from "@/pages/clients/data/client-erp.fixture"
import { mapErpClientVehicles } from "@/pages/clients/model/client-vehicle-mapper"
import { clientVehicleRecordSections } from "@/pages/clients/model/client-vehicle-record-presentation"

describe("clientVehicleRecordSections", () => {
  it("mantém todos os campos do veículo no contrato de apresentação", () => {
    const vehicle = mapErpClientVehicles(clientVehicleErpFixture).at(0)

    if (!vehicle) {
      throw new Error("Fixture de veículo vazia.")
    }

    const sectionKeys: string[] = []

    for (const section of clientVehicleRecordSections) {
      for (const field of section.fields) {
        sectionKeys.push(field.key)
      }
    }

    expect(sectionKeys.sort()).toEqual(Object.keys(vehicle).sort())
  })
})
