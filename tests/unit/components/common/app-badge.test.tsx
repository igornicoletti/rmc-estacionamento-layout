import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppBadge } from "@/components/common/app-badge"

describe("AppBadge", () => {
  it("preserva o conteúdo no contrato sem exigir customização da primitiva", () => {
    render(<AppBadge tone="success">Ativo</AppBadge>)

    expect(screen.getByText("Ativo")).toBeInTheDocument()
  })
})
