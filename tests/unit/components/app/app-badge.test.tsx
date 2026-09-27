import { render } from "@testing-library/react"
import { CircleCheckIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { AppBadge } from "@/components/app/app-badge"

describe("AppBadge", () => {
  it("mantém o ícone decorativo", () => {
    const { container } = render(
      <AppBadge icon={CircleCheckIcon} iconPosition="end" tone="success">
        Ativo
      </AppBadge>,
    )

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})
