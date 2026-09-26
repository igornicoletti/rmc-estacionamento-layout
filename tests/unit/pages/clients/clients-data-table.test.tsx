import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { notify } from "@/app/feedback/notify"
import { CLIENTS_FEEDBACK } from "@/pages/clients/content/clients-feedback"
import { getClientDetailsPath } from "@/pages/clients/client-routes"
import { ClientsDataTable } from "@/pages/clients/components/clients-data-table"
import { clientErpFixture } from "@/pages/clients/data/client-erp.fixture"
import { mapErpClients } from "@/pages/clients/model/client-mapper"
import {
  formatCityName,
  formatErpName,
  formatPhone,
  splitEmails,
} from "@/pages/clients/model/client-presentation"
import { renderWithProviders } from "@tests/support/render"

vi.mock("@/app/feedback/notify", () => ({
  notify: vi.fn(),
}))

const showFeedback = vi.mocked(notify)
const previewClients = mapErpClients(clientErpFixture)
const firstClient = previewClients[0]

if (!firstClient) {
  throw new Error("Fixture de clientes vazia.")
}

const firstClientEmails = splitEmails(firstClient.email)
const primaryEmail = firstClientEmails[0]
const additionalEmail = firstClientEmails[1]

if (!primaryEmail || !additionalEmail) {
  throw new Error("Fixture principal precisa conter e-mails adicionais.")
}

async function renderClientsDataTable() {
  renderWithProviders(
    <MemoryRouter>
      <ClientsDataTable />
    </MemoryRouter>,
  )

  const table = screen.getByRole("table")
  const root = table.closest<HTMLElement>('[data-slot="data-table-root"]')

  if (!root) {
    throw new Error("DataTableRoot não encontrado.")
  }

  await waitFor(() => {
    expect(root).toHaveAttribute("aria-busy", "false")
  })

  return table
}

function getFirstDataRow(table: HTMLElement) {
  const rows = within(table).getAllByRole("row")
  const row = rows[1]

  if (!row) {
    throw new Error("Primeira linha de cliente não encontrada.")
  }

  return row
}

function getRowActionTrigger(row: HTMLElement) {
  const buttons = within(row).getAllByRole("button")
  const trigger = buttons.at(-1)

  if (!trigger) {
    throw new Error("Ação da linha não encontrada.")
  }

  return trigger
}

describe("ClientsDataTable", () => {
  beforeEach(() => {
    showFeedback.mockReset()
  })

  it("renderiza dados do domínio e mantém colunas configuradas como ocultas", async () => {
    const table = await renderClientsDataTable()
    const rows = within(table).getAllByRole("row")
    const firstRow = getFirstDataRow(table)
    const link = within(firstRow).getByRole("link")

    expect(rows).toHaveLength(Math.min(previewClients.length, 10) + 1)

    expect(link).toHaveAttribute(
      "href",
      getClientDetailsPath(firstClient.id),
    )

    expect(firstRow).toHaveTextContent(formatErpName(firstClient.name))
    expect(firstRow).toHaveTextContent(primaryEmail)
    expect(firstRow).not.toHaveTextContent(formatPhone(firstClient.phone))
  })

  it("copia um e-mail adicional e usa feedback dinâmico do domínio", async () => {
    const user = userEvent.setup()
    const table = await renderClientsDataTable()
    const firstRow = getFirstDataRow(table)
    const buttons = within(firstRow).getAllByRole("button")
    const emailTrigger = buttons[0]

    if (!emailTrigger) {
      throw new Error("Trigger de e-mails adicionais não encontrado.")
    }

    expect(emailTrigger).toHaveAccessibleName()

    await user.hover(emailTrigger)

    const emailText = await screen.findByText(additionalEmail)
    const emailContainer = emailText.parentElement

    if (!emailContainer) {
      throw new Error("Container do e-mail adicional não encontrado.")
    }

    const copyButton = within(emailContainer).getByRole("button")

    expect(copyButton).toHaveAccessibleName()

    await user.click(copyButton)

    await expect(navigator.clipboard.readText()).resolves.toBe(
      additionalEmail,
    )
    await waitFor(() => {
      expect(showFeedback).toHaveBeenCalledWith(
        CLIENTS_FEEDBACK.emailCopied({ email: additionalEmail }),
      )
    })
  })

  it("abre os detalhes do cliente selecionado", async () => {
    const user = userEvent.setup()
    const table = await renderClientsDataTable()
    const firstRow = getFirstDataRow(table)

    await user.click(getRowActionTrigger(firstRow))

    const menuItems = await screen.findAllByRole("menuitem")
    const detailsAction = menuItems[0]

    if (!detailsAction) {
      throw new Error("Ação de detalhes não encontrada.")
    }

    await user.click(detailsAction)

    const dialog = await screen.findByRole("dialog")

    expect(dialog).toHaveAccessibleName()
    expect(dialog).toHaveTextContent(firstClient.taxId)
    expect(dialog).toHaveTextContent(primaryEmail)
  })

  it("copia os dados funcionais do cliente selecionado", async () => {
    const user = userEvent.setup()
    const table = await renderClientsDataTable()
    const firstRow = getFirstDataRow(table)

    await user.click(getRowActionTrigger(firstRow))

    const menuItems = await screen.findAllByRole("menuitem")
    const copyAction = menuItems[1]

    if (!copyAction) {
      throw new Error("Ação de cópia não encontrada.")
    }

    await user.click(copyAction)

    const copied = await navigator.clipboard.readText()

    expect(copied).toContain(firstClient.id)
    expect(copied).toContain(firstClient.taxId)
    expect(copied).toContain(primaryEmail)
  })

  it("expõe as opções de cidade derivadas dos dados", async () => {
    const user = userEvent.setup()
    const table = await renderClientsDataTable()
    const root = table.closest<HTMLElement>('[data-slot="data-table-root"]')
    const toolbar = root?.querySelector<HTMLElement>('[data-slot="data-table-toolbar"]')

    if (!toolbar) {
      throw new Error("Toolbar não encontrada.")
    }

    const cityFilter = within(toolbar).getByRole("combobox")

    expect(cityFilter).toHaveAccessibleName()

    const cityLabel = formatCityName(firstClient.city)

    await user.click(cityFilter)
    await user.type(cityFilter, cityLabel)

    expect(await screen.findAllByRole("option")).toHaveLength(1)
  })
})
