import { screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientVehiclesDataTable } from "@/pages/clients/components/client-vehicles-data-table"

const vehicles = [
  {
    cod_veiculo: 44425,
    cod_pessoa: 363,
    nom_pessoa: "ASSOCIACAO ECO VILLAGE I",
    nom_fantasia: "",
    num_cnpj_cpf: "08218781000105",
    num_placa: "FSL8590",
    des_veiculo: "SCANIA",
    nom_motorista: "",
    client_is_active_120d: true,
    source_hash: "0662dbaf736b830b7b41cd2986c1289b",
    source_updated_at: null,
    synced_at: "2026-08-01 07:57:45.009+00",
    created_at: "2026-08-01 07:33:15.302608+00",
    updated_at: "2026-08-01 07:57:55.574986+00",
  },
  {
    cod_veiculo: 44426,
    cod_pessoa: 363,
    nom_pessoa: "ASSOCIACAO ECO VILLAGE I",
    nom_fantasia: "",
    num_cnpj_cpf: "08218781000105",
    num_placa: "ABC1234",
    des_veiculo: "VOLVO",
    nom_motorista: "",
    client_is_active_120d: true,
    source_hash: "1662dbaf736b830b7b41cd2986c1289b",
    source_updated_at: null,
    synced_at: "2026-08-01 07:57:45.009+00",
    created_at: "2026-08-01 07:33:15.302608+00",
    updated_at: "2026-08-01 07:57:55.574986+00",
  },
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ClientVehiclesDataTable", () => {
  it("omite motorista sem dados e mantém busca, filtro e paginação", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(vehicles), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }),
        ),
      ),
    )

    renderWithProviders(<ClientVehiclesDataTable clientId="363" />)

    expect(await screen.findByText("2 veículos")).toBeInTheDocument()
    expect(
      screen.getByRole("searchbox", { name: "Buscar veículos" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: "Filtrar por veículo" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: /Motorista/u }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("FSL-8590")).toBeInTheDocument()
    expect(screen.getByText("Scania")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ordenar por Placa" }),
    ).toBeInTheDocument()
  })
})
