import {
  createRecordCsvColumns,
  type RecordSectionDefinition,
} from "@/lib/format-record-fields"
import type { Client } from "@/pages/clients/model/client"
import {
  formatCityName,
  formatDate,
  formatDateTime,
  formatErpName,
  formatPhone,
  formatYesNo,
  splitEmails,
} from "@/pages/clients/model/client-presentation"

function optionalFormatted(
  value: string,
  formatter: (value: string) => string,
) {
  return value.trim() === "" ? null : formatter(value)
}

function formatEmails(value: string) {
  const emails = splitEmails(value)
  return emails.length === 0 ? null : emails.join(", ")
}

export const clientRecordSections = [
  {
    key: "identification",
    title: "Identificação",
    fields: [
      { key: "id", label: "Código", getValue: (client) => client.id },
      {
        key: "name",
        label: "Nome",
        getValue: (client) => formatErpName(client.name),
      },
      {
        key: "tradeName",
        label: "Nome fantasia",
        getValue: (client) =>
          optionalFormatted(client.tradeName, formatErpName),
      },
      { key: "taxId", label: "CPF/CNPJ", getValue: (client) => client.taxId },
    ],
  },
  {
    key: "contact",
    title: "Contato",
    fields: [
      {
        key: "email",
        label: "E-mail",
        getValue: (client) => formatEmails(client.email),
      },
      {
        key: "phone",
        label: "Telefone",
        getValue: (client) => optionalFormatted(client.phone, formatPhone),
      },
    ],
  },
  {
    key: "location",
    title: "Localização",
    fields: [
      {
        key: "city",
        label: "Cidade",
        getValue: (client) => formatCityName(client.city),
      },
      { key: "state", label: "Estado", getValue: (client) => client.state },
      { key: "stateCode", label: "UF", getValue: (client) => client.stateCode },
    ],
  },
  {
    key: "status",
    title: "Status e atividade",
    fields: [
      {
        key: "registeredAt",
        label: "Cadastro",
        getValue: (client) =>
          client.registeredAt ? formatDate(client.registeredAt) : null,
      },
      {
        key: "personActiveStatus",
        label: "Pessoa ativa",
        getValue: (client) => formatYesNo(client.personActiveStatus),
      },
      {
        key: "financialBlockStatus",
        label: "Bloqueio financeiro",
        getValue: (client) => formatYesNo(client.financialBlockStatus),
      },
      {
        key: "vehicleCount",
        label: "Veículos",
        getValue: (client) => client.vehicleCount,
      },
      {
        key: "lastPurchaseAt",
        label: "Última compra",
        getValue: (client) =>
          client.lastPurchaseAt ? formatDate(client.lastPurchaseAt) : null,
      },
      {
        key: "activeWithin120Days",
        label: "Ativo em 120 dias",
        getValue: (client) => formatYesNo(client.activeWithin120Days),
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
        getValue: (client) => formatDateTime(client.synchronizedAt),
      },
      {
        key: "createdAt",
        label: "Criação",
        getValue: (client) => formatDateTime(client.createdAt),
      },
      {
        key: "updatedAt",
        label: "Atualização",
        getValue: (client) => formatDateTime(client.updatedAt),
      },
    ],
  },
] satisfies readonly RecordSectionDefinition<Client>[]

export const clientRecordCsvColumns =
  createRecordCsvColumns(clientRecordSections)
