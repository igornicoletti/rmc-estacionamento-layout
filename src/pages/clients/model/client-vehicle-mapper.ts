import type { ClientVehicle } from "@/pages/clients/model/client-vehicle"
import {
  formatCpfCnpj,
  readErpBoolean,
  readErpDateTime,
  readErpIdentifier,
  readErpString,
  type ErpRecord,
} from "@/pages/clients/model/erp-record"

export function mapErpClientVehicle(input: unknown): ClientVehicle {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Veículo de cliente inválido: registro deve ser um objeto.")
  }

  const record = input as ErpRecord

  return {
    id: readErpIdentifier(record, "cod_veiculo"),
    clientId: readErpIdentifier(record, "cod_pessoa"),
    clientName: readErpString(record, "nom_pessoa"),
    clientTradeName: readErpString(record, "nom_fantasia", {
      allowEmpty: true,
    }),
    clientTaxId: formatCpfCnpj(readErpString(record, "num_cnpj_cpf")),
    plate: readErpString(record, "num_placa"),
    description: readErpString(record, "des_veiculo", { allowEmpty: true }),
    driverName: readErpString(record, "nom_motorista", { allowEmpty: true }),
    clientActiveWithin120Days: readErpBoolean(
      record,
      "client_is_active_120d",
    ),
    synchronizedAt: readErpDateTime(record, "synced_at") as string,
    createdAt: readErpDateTime(record, "created_at") as string,
    updatedAt: readErpDateTime(record, "updated_at") as string,
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
