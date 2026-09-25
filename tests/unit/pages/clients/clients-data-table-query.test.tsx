import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { clientErpFixture } from "@/pages/clients/data/client-erp.fixture"
import type { Client } from "@/pages/clients/model/client"
import { mapErpClients } from "@/pages/clients/model/client-mapper"

const { loadPreviewClientsMock } = vi.hoisted(() => ({
  loadPreviewClientsMock: vi.fn(),
}))

vi.mock("@/pages/clients/data/client-preview-data", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/pages/clients/data/client-preview-data")
    >()

  return {
    ...actual,
    loadPreviewClients: loadPreviewClientsMock,
  }
})

import { ClientsDataTable } from "@/pages/clients/components/clients-data-table"

const previewClients = mapErpClients(clientErpFixture)

function renderClientsDataTable() {
  renderWithProviders(
    <MemoryRouter>
      <ClientsDataTable />
    </MemoryRouter>,
  )
}

function getDataTableRoot(table: HTMLElement) {
  const root = table.closest('[data-slot="data-table-root"]')

  if (!root) {
    throw new Error("DataTableRoot não encontrado.")
  }

  return root
}

describe("ClientsDataTable query boundary", () => {
  beforeEach(() => {
    loadPreviewClientsMock.mockReset()
  })

  it("mantém o boundary ocupado até a carga inicial concluir", async () => {
    let resolveClients: ((clients: Client[]) => void) | undefined

    loadPreviewClientsMock.mockReturnValue(
      new Promise<Client[]>((resolve) => {
        resolveClients = resolve
      }),
    )

    renderClientsDataTable()

    const table = screen.getByRole("table")
    const root = getDataTableRoot(table)

    expect(root).toHaveAttribute("aria-busy", "true")

    act(() => {
      resolveClients?.(previewClients)
    })

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
    })

    expect(within(table).getAllByRole("row").length).toBeGreaterThan(1)
  })

  it("isola a falha e permite refazer a consulta", async () => {
    const user = userEvent.setup()

    loadPreviewClientsMock
      .mockImplementationOnce(() => {
        throw new TypeError("transformação inválida")
      })
      .mockReturnValueOnce(previewClients)

    renderClientsDataTable()

    const alert = await screen.findByRole("alert")
    const retry = within(alert).getByRole("button")

    expect(retry).toHaveAccessibleName()

    await user.click(retry)

    const table = await screen.findByRole("table")
    const root = getDataTableRoot(table)

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
    })

    expect(loadPreviewClientsMock).toHaveBeenCalledTimes(2)
  })
})
