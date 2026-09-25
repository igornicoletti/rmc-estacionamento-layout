import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

describe("ClientsDataTable query boundary", () => {
  beforeEach(() => {
    loadPreviewClientsMock.mockReset()
  })

  it("mantém a tabela ocupada enquanto os dados iniciais estão pendentes", async () => {
    let resolveClients: ((clients: Client[]) => void) | undefined

    loadPreviewClientsMock.mockReturnValue(
      new Promise<Client[]>((resolve) => {
        resolveClients = resolve
      }),
    )

    renderWithProviders(<ClientsDataTable />)

    const table = screen.getByRole("table")
    expect(table.closest('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText("24 clientes")).not.toBeInTheDocument()

    act(() => {
      resolveClients?.(previewClients)
    })

    expect(await screen.findByText("24 clientes")).toBeInTheDocument()
    expect(table.closest('[aria-busy="false"]')).not.toBeNull()
  })

  it("isola falha de transformação e permite tentar novamente", async () => {
    const user = userEvent.setup()

    loadPreviewClientsMock
      .mockImplementationOnce(() => {
        throw new TypeError("transformação inválida")
      })
      .mockReturnValueOnce(previewClients)

    renderWithProviders(<ClientsDataTable />)

    const retry = await screen.findByRole("button", {
      name: "Tentar novamente",
    })

    await user.click(retry)

    expect(await screen.findByText("24 clientes")).toBeInTheDocument()
    expect(loadPreviewClientsMock).toHaveBeenCalledTimes(2)
  })
})
