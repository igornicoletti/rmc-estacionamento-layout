import { MemoryRouter } from "react-router"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientsDataTable } from "@/pages/clients/components/clients-data-table"

const clientRecord = {
  cod_pessoa: 363,
  nom_pessoa: "ASSOCIACAO ECO VILLAGE I",
  nom_fantasia: "",
  num_cnpj_cpf: "08218781000105",
  des_email_1:
    "principal@example.com;financeiro@example.com;frota@example.com",
  num_telefone_1: "1732264790",
  nom_cidade: "SAO JOSE DO RIO PRETO",
  sgl_estado: "SP",
  dta_cadastro: "2018-09-06",
  ind_pessoa_ativa: "S",
  bloqueio_financeiro: "N",
  qtd_veiculos: 1,
  dta_ultima_compra: "2026-07-29",
  is_active_120d: true,
  source_hash: "81e98b0ade08a5ef6b7c183e4a47948e",
  source_updated_at: null,
  synced_at: "2026-08-01 15:00:06.043+00",
  created_at: "2026-08-01 06:55:46.767382+00",
  updated_at: "2026-08-01 15:01:46.196989+00",
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ClientsDataTable", () => {
  it("carrega o mock local, resume e-mails e expõe navegação", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify([clientRecord]), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }),
        ),
      ),
    )

    renderWithProviders(
      <MemoryRouter>
        <ClientsDataTable />
      </MemoryRouter>,
    )

    expect(await screen.findByText("1 cliente")).toBeInTheDocument()
    expect(
      screen.getByRole("searchbox", { name: "Buscar clientes" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: "Filtrar por cidade" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Associação Eco Village I" }),
    ).toHaveAttribute("href", "/clientes/363")
    expect(screen.getByText("principal@example.com")).toBeInTheDocument()

    const additionalEmails = screen.getByRole("button", {
      name: "2 e-mails adicionais",
    })
    expect(additionalEmails).toHaveTextContent("+2")

    await user.hover(additionalEmails)

    expect(await screen.findByText("financeiro@example.com")).toBeInTheDocument()
    expect(screen.getByText("frota@example.com")).toBeInTheDocument()

    await user.click(screen.getByRole("combobox", { name: "Filtrar por cidade" }))

    expect(
      await screen.findByRole("option", {
        name: /São José do Rio Preto/u,
      }),
    ).toBeInTheDocument()
  })
})
