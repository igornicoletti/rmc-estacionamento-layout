import {
  createRecordCsvColumns,
  type RecordSectionDefinition,
} from "@/lib/format-record-fields"
import type { ClientVehicle } from "@/pages/clients/model/client-vehicle"
import {
  formatDateTime,
  formatErpName,
  formatLicensePlate,
  formatVehicleDescription,
  formatYesNo,
} from "@/pages/clients/model/client-presentation"

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
      { key: "id", label: "Código", getValue: (vehicle) => vehicle.id },
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
      {
        key: "clientActiveWithin120Days",
        label: "Cliente ativo em 120 dias",
        getValue: (vehicle) =>
          formatYesNo(vehicle.clientActiveWithin120Days),
      },
    ],
  },
  {
    key: "system",
    title: "Sistema",
    fields: [
      {
        key: "synchronizedAt",
        label: "Sincronização",
        getValue: (vehicle) => formatDateTime(vehicle.synchronizedAt),
      },
      {
        key: "createdAt",
        label: "Criação",
        getValue: (vehicle) => formatDateTime(vehicle.createdAt),
      },
      {
        key: "updatedAt",
        label: "Atualização",
        getValue: (vehicle) => formatDateTime(vehicle.updatedAt),
      },
    ],
  },
] satisfies readonly RecordSectionDefinition<ClientVehicle>[]

export const clientVehicleRecordCsvColumns =
  createRecordCsvColumns(clientVehicleRecordSections)
