import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/render"

import App from "./App"

describe("App", () => {
  it("exibe somente a tabela de usuários", async () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole("heading", { name: /rmc estacionamento/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText("Ana Martins")).toBeInTheDocument()
    expect(screen.getByText("12 usuários")).toBeInTheDocument()
    expect(screen.getAllByRole("table")).toHaveLength(1)
  })
})
