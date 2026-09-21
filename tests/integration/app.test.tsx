import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import App from "@/App"

describe("App", () => {
  it("exibe a base sem conteúdo demonstrativo", () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole("heading", { name: /rmc estacionamento/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Base de interface pronta para integração com dados reais."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
