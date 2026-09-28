import type { ErpClientVehicle } from "@/features/clients/vehicles/contracts/vehicles-erp-types"
import { createMockCnpj } from "@/mocks/mock-tax-id"

export const clientVehicleErpFixture: unknown = Array.from(
  { length: 48 },
  (_, index) => {
    const clientIndex = Math.floor(index / 2)
    const clientId = 1001 + clientIndex
    const vehicleNumber = index + 1

    return {
      cod_veiculo: 5001 + index,
      cod_pessoa: clientId,
      nom_pessoa: `CLIENTE DEMONSTRACAO ${String(clientIndex + 1).padStart(2, "0")} LTDA`,
      nom_fantasia: `CLIENTE ${String(clientIndex + 1).padStart(2, "0")}`,
      num_cnpj_cpf: createMockCnpj(clientIndex),
      num_placa: `DEM${String(vehicleNumber).padStart(4, "0")}`,
      des_veiculo: vehicleNumber % 2 === 0 ? "UTILITARIO" : "AUTOMOVEL",
      nom_motorista:
        clientIndex === 0 || vehicleNumber % 3 === 0
          ? ""
          : `MOTORISTA ${vehicleNumber}`,
    } satisfies ErpClientVehicle
  },
)
