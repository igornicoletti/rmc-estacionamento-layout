import { render, screen } from "@testing-library/react"
import { CircleCheckIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { AppBadge } from "@/components/common/app-badge"

describe("AppBadge", () => {
  it("compõe ícone semântico antes do conteúdo por padrão", () => {
    const { container } = render(
      <AppBadge icon={CircleCheckIcon} tone="success">
        Ativo
      </AppBadge>,
    )

    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(
      container.querySelector('[data-icon="inline-start"]'),
    ).toBeInTheDocument()
  })

  it("permite posicionar o ícone no final", () => {
    const { container } = render(
      <AppBadge icon={CircleCheckIcon} iconPosition="end">
        Ativo
      </AppBadge>,
    )

    expect(
      container.querySelector('[data-icon="inline-end"]'),
    ).toBeInTheDocument()
  })
})
