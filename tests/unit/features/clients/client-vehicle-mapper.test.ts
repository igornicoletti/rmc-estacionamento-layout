import { describe, expect, it } from "vitest"

import {
  mapErpClientVehicle,
  mapErpClientVehicles,
} from "@/features/clients/vehicles/mapping/vehicles-mapper"

const validVehicle = {
  cod_veiculo: 44425,
  cod_pessoa: 363,
  nom_pessoa: "ASSOCIACAO ECO VILLAGE I",
  nom_fantasia: "",
  num_cnpj_cpf: "08218781000105",
  num_placa: "FSL8590",
  des_veiculo: "VEICULO",
  nom_motorista: "",
}

describe("client vehicle mapper", () => {
  it("normaliza os campos existentes no ERP", () => {
    expect(mapErpClientVehicle(validVehicle)).toMatchObject({
      id: "44425",
      clientId: "363",
      clientName: "ASSOCIACAO ECO VILLAGE I",
      clientTradeName: "",
      clientTaxId: "08.218.781/0001-05",
      plate: "FSL8590",
      description: "VEICULO",
      driverName: "",
    })
  })

  it("aceita veículo e motorista vazios quando o ERP envia texto vazio", () => {
    expect(
      mapErpClientVehicle({
        ...validVehicle,
        des_veiculo: "",
        nom_motorista: "",
      }),
    ).toMatchObject({
      description: "",
      driverName: "",
    })
  })

  it("rejeita uma resposta que não seja lista", () => {
    expect(() => mapErpClientVehicles({})).toThrow("deve ser um array")
  })
})
