import {
  createRecordCsvColumns,
  type RecordSectionDefinition,
} from "@/lib/records/records-fields"
import type { ClientVehicle } from "@/features/clients/vehicles/contracts/vehicles-types"
import { formatErpName } from "@/features/clients/presentation/clients-format"
import {
  formatLicensePlate,
  formatVehicleDescription,
} from "@/features/clients/vehicles/presentation/vehicles-format"

function optionalFormatted(
  value: string,
  formatter: (value: string) => string,
) {
  return value.trim() === "" ? null : formatter(value)
}

export const clientVehicleRecordSections = [
  {
    key: "vehicle",
    title: "Veículo",
    fields: [
      {
        key: "id",
        label: "Código do veículo",
        getValue: (vehicle) => vehicle.id,
      },
      {
        key: "plate",
        label: "Placa",
        getValue: (vehicle) => formatLicensePlate(vehicle.plate),
      },
      {
        key: "description",
        label: "Veículo",
        getValue: (vehicle) =>
          optionalFormatted(vehicle.description, formatVehicleDescription),
      },
      {
        key: "driverName",
        label: "Motorista",
        getValue: (vehicle) =>
          optionalFormatted(vehicle.driverName, formatErpName),
      },
    ],
  },
  {
    key: "client",
    title: "Cliente",
    fields: [
      {
        key: "clientId",
        label: "Código do cliente",
        getValue: (vehicle) => vehicle.clientId,
      },
      {
        key: "clientName",
        label: "Nome do cliente",
        getValue: (vehicle) => formatErpName(vehicle.clientName),
      },
      {
        key: "clientTradeName",
        label: "Nome fantasia do cliente",
        getValue: (vehicle) =>
          optionalFormatted(vehicle.clientTradeName, formatErpName),
      },
      {
        key: "clientTaxId",
        label: "CPF/CNPJ do cliente",
        getValue: (vehicle) => vehicle.clientTaxId,
      },
    ],
  },
] satisfies readonly RecordSectionDefinition<ClientVehicle>[]

export const clientVehicleRecordCsvColumns = createRecordCsvColumns(
  clientVehicleRecordSections,
)
