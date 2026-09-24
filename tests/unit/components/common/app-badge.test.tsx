import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppBadge } from "@/components/common/app-badge"

describe("AppBadge", () => {
  it("renderiza o contrato sem exigir customização da primitiva", () => {
    expect(() => {
      render(<AppBadge tone="success">Ativo</AppBadge>)
    }).not.toThrow()
  })
})
