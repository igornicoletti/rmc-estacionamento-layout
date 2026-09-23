import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientVehiclesDataTable } from "@/pages/clients/components/client-vehicles-data-table"

describe("ClientVehiclesDataTable", () => {
  it("mostra veículos do cliente sem expor metadados internos", async () => {
    renderWithProviders(<ClientVehiclesDataTable clientId="1001" />)

    expect(await screen.findByText("2 veículos")).toBeInTheDocument()
    expect(
      screen.getByRole("searchbox", { name: "Buscar veículos" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", {
        name: "Filtrar veículos por descrição",
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: /Motorista/u }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/synthetic-vehicle/u)).not.toBeInTheDocument()
    expect(screen.getByText("DEM-0001")).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(3)
    expect(
      screen.getByRole("button", { name: "Exportar CSV" }),
    ).toBeInTheDocument()
  })

  it("abre os detalhes do veículo pelo menu de ações", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientVehiclesDataTable clientId="1001" />)

    const actions = await screen.findAllByRole("button", {
      name: /Ações do veículo/u,
    })

    await user.click(actions[0])
    await user.click(
      await screen.findByRole("menuitem", { name: "Detalhes" }),
    )

    const sheet = await screen.findByRole("dialog")
    expect(within(sheet).getByText("Código do cliente")).toBeInTheDocument()
    expect(within(sheet).getByText("Sistema")).toBeInTheDocument()
  })

  it("copia os dados completos do veículo", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientVehiclesDataTable clientId="1001" />)

    const actions = await screen.findAllByRole("button", {
      name: /Ações do veículo/u,
    })

    await user.click(actions[0])
    await user.click(
      await screen.findByRole("menuitem", { name: "Copiar dados" }),
    )

    const copied = await navigator.clipboard.readText()
    expect(copied).toContain("Placa: DEM-0001")
    expect(copied).toContain("Código do cliente: 1001")
  })
})
