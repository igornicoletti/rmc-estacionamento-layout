import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientVehiclesDataTable } from "@/pages/clients/components/client-vehicles-data-table"

describe("ClientVehiclesDataTable", () => {
  it("mostra veículos do cliente sem expor metadados internos", async () => {
    renderWithProviders(<ClientVehiclesDataTable clientId="1001" />)

    expect(await screen.findByText("2 veículos")).toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Buscar veículos" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Filtrar veículos por descrição" })).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: /Motorista/u })).not.toBeInTheDocument()
    expect(screen.queryByText(/synthetic-vehicle/u)).not.toBeInTheDocument()
    expect(screen.getByText("DEM-0001")).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(3)
  })
})
