import { describe, expect, it } from "vitest"

import contracts from "../../../../docs/contracts/hub-erp.openapi.json"
import { clientErpFixture } from "@/mocks/mock-clients-fixtures"
import { clientVehicleErpFixture } from "@/mocks/mock-vehicles-fixtures"
import { unitErpFixture } from "@/mocks/mock-units-fixtures"
import { mapErpClient } from "@/features/clients/mapping/clients-mapper"
import { mapErpClientVehicle } from "@/features/clients/vehicles/mapping/vehicles-mapper"
import { mapErpUnit } from "@/features/units/mapping/units-mapper"

describe("Hub ERP response contracts", () => {
  it.each([
    [
      "clientes",
      clientErpFixture,
      contracts.components.schemas.ClienteCadastroResponse.properties,
    ],
    [
      "veículos",
      clientVehicleErpFixture,
      contracts.components.schemas.ClienteVeiculoResponse.properties,
    ],
    [
      "unidades",
      unitErpFixture,
      contracts.components.schemas.CapturaCadEmpresasResponse.properties,
    ],
  ])("não inventa campos ERP nos mocks de %s", (_name, fixture, properties) => {
    expect(Array.isArray(fixture)).toBe(true)
    for (const row of fixture as Record<string, unknown>[]) {
      expect(Object.keys(row).filter((key) => !(key in properties))).toEqual([])
      for (const [key, value] of Object.entries(row)) {
        if (key.startsWith("cod_"))
          expect(Number.isSafeInteger(value)).toBe(true)
      }
    }
  })

  it("aceita campos opcionais ausentes e não fabrica quantidade zero", () => {
    const client = mapErpClient({ cod_pessoa: 123, qtd_veiculos: null })
    expect(client).toMatchObject({
      id: "123",
      taxId: "",
      stateCode: "",
      vehicleCount: null,
    })
    const unit = mapErpUnit({ cod_empresa: 46, cod_bandeira: null })
    expect(unit).toMatchObject({
      id: "46",
      cnpj: "",
      brandCode: null,
      cityCode: null,
    })
    expect(
      mapErpClientVehicle({ cod_veiculo: 9, cod_pessoa: 123 }),
    ).toMatchObject({ id: "9", clientId: "123", plate: "" })
  })

  it("mantém códigos de veículo e cliente distintos e ignora metadados fora da resposta", () => {
    const vehicle = mapErpClientVehicle({
      cod_veiculo: 9,
      cod_pessoa: 123,
      synced_at: "inventado",
      client_is_active_120d: true,
    })
    expect(vehicle.id).toBe("9")
    expect(vehicle.clientId).toBe("123")
    expect(vehicle).not.toHaveProperty("synchronizedAt")
    expect(vehicle).not.toHaveProperty("clientActiveWithin120Days")
    expect(() =>
      mapErpClientVehicle({ cod_veiculo: null, cod_pessoa: 123 }),
    ).toThrow("cod_veiculo")
  })
})
