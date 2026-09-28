import { useState } from "react"
import { act, screen, waitFor, within } from "@testing-library/react"
import { onlineManager, useQueryClient } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { clientErpFixture } from "@/mocks/mock-clients-fixtures"
import type { Client } from "@/features/clients/contracts/clients-types"
import { mapErpClients } from "@/features/clients/mapping/clients-mapper"

const { loadDemoClientsMock, notifyMock } = vi.hoisted(() => ({
  loadDemoClientsMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock("@/components/toast/toast-notify", () => ({
  notify: notifyMock,
}))

vi.mock("@/features/clients/queries/clients-query", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/clients/queries/clients-query")
    >()

  return {
    ...actual,
    loadDemoClients: loadDemoClientsMock,
  }
})

import { ClientsDataTable } from "@/features/clients/components/clients-data-table"
import { clientsQueryKeys } from "@/features/clients/queries/clients-query"

const previewClients = mapErpClients(clientErpFixture)

function RefetchClientsControl() {
  const queryClient = useQueryClient()

  return (
    <button
      aria-label="Atualizar clientes no teste"
      data-testid="refetch-clients"
      onClick={() =>
        void queryClient.invalidateQueries({
          queryKey: clientsQueryKeys.clients,
        })
      }
      type="button"
    />
  )
}

function ClientsDataTableHarness() {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <>
      <RefetchClientsControl />
      <button
        aria-label="Alternar tabela de clientes no teste"
        data-testid="toggle-clients"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      />
      <MemoryRouter>{isVisible ? <ClientsDataTable /> : null}</MemoryRouter>
    </>
  )
}

function renderClientsDataTable() {
  return renderWithProviders(<ClientsDataTableHarness />)
}

function getDataTableRoot(table: HTMLElement) {
  const root = table.closest('[data-slot="data-table-root"]')

  if (!root) {
    throw new Error("DataTableRoot não encontrado.")
  }

  return root
}

afterEach(() => {
  onlineManager.setOnline(true)
})

describe("ClientsDataTable query boundary", () => {
  beforeEach(() => {
    loadDemoClientsMock.mockReset()
    notifyMock.mockReset()
  })

  it("mantém o boundary ocupado até a carga inicial concluir", async () => {
    let resolveClients: ((clients: Client[]) => void) | undefined

    loadDemoClientsMock.mockReturnValue(
      new Promise<Client[]>((resolve) => {
        resolveClients = resolve
      }),
    )

    renderClientsDataTable()

    const table = screen.getByRole("table")
    const root = getDataTableRoot(table)

    expect(root).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("searchbox")).toBeDisabled()

    act(() => {
      resolveClients?.(previewClients)
    })

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
    })

    expect(screen.getByRole("searchbox")).not.toBeDisabled()
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(1)
  })

  it("mantém o estado inicial quando a consulta está pausada sem dados", () => {
    onlineManager.setOnline(false)
    loadDemoClientsMock.mockResolvedValue(previewClients)

    renderClientsDataTable()

    const table = screen.getByRole("table")

    expect(screen.getByRole("searchbox")).toBeDisabled()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(within(table).queryAllByTestId("data-table-row")).toHaveLength(0)
    expect(loadDemoClientsMock).not.toHaveBeenCalled()
  })

  it("isola a falha inicial e permite refazer a consulta", async () => {
    const user = userEvent.setup()

    loadDemoClientsMock
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

    expect(loadDemoClientsMock).toHaveBeenCalledTimes(2)
  })

  it("preserva dados e não repete erro de refetch cacheado após remontagem", async () => {
    const user = userEvent.setup()

    loadDemoClientsMock
      .mockResolvedValueOnce(previewClients)
      .mockRejectedValueOnce(new Error("refetch indisponível"))

    const view = renderClientsDataTable()

    const table = await screen.findByRole("table")
    await waitFor(() => {
      expect(screen.getAllByTestId("data-table-row").length).toBeGreaterThan(0)
    })
    const root = getDataTableRoot(table)
    const visibleRows = screen.getAllByTestId("data-table-row").length

    await user.click(screen.getByTestId("refetch-clients"))

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getAllByTestId("data-table-row")).toHaveLength(visibleRows)

    act(() => {
      onlineManager.setOnline(false)
    })
    await user.click(screen.getByTestId("toggle-clients"))
    expect(screen.queryByRole("table")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("toggle-clients"))
    await screen.findByRole("table")

    expect(notifyMock).toHaveBeenCalledTimes(1)

    view.unmount()
  })
})
