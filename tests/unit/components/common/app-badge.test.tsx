import { render, screen } from "@testing-library/react"
import { CircleCheckIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { AppBadge } from "@/components/common/app-badge"

describe("AppBadge", () => {
  it("renderiza conteúdo e mantém o ícone decorativo", () => {
    const { container } = render(
      <AppBadge icon={CircleCheckIcon} iconPosition="end" tone="success">
        Ativo
      </AppBadge>,
    )

    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})
