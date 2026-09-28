import {
  asErpRecord,
  readErpIdentifier,
  readErpOptionalText,
} from "@/lib/erp/erp-record"
import { formatCpfCnpj } from "@/lib/erp/tax-id"
import type { ClientVehicle } from "@/features/clients/vehicles/contracts/vehicles-types"

export function mapErpClientVehicle(input: unknown): ClientVehicle {
  const record = asErpRecord(input, "Veículo de cliente")
  const taxId = readErpOptionalText(record, "num_cnpj_cpf")

  return {
    id: readErpIdentifier(record, "cod_veiculo"),
    clientId: readErpIdentifier(record, "cod_pessoa"),
    clientName: readErpOptionalText(record, "nom_pessoa"),
    clientTradeName: readErpOptionalText(record, "nom_fantasia"),
    clientTaxId: taxId ? formatCpfCnpj(taxId) : "",
    plate: readErpOptionalText(record, "num_placa"),
    description: readErpOptionalText(record, "des_veiculo"),
    driverName: readErpOptionalText(record, "nom_motorista"),
  }
}

export function mapErpClientVehicles(input: unknown): ClientVehicle[] {
  if (!Array.isArray(input)) {
    throw new TypeError(
      "Resposta inválida: a lista de veículos de clientes deve ser um array.",
    )
  }

  return input.map(mapErpClientVehicle)
}
