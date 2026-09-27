import { render, screen } from "@testing-library/react"
import { CircleHelpIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { AppEmpty } from "@/components/app/app-empty"

describe("AppEmpty", () => {
  it("aplica o nível de heading e mantém o ícone decorativo", () => {
    const { container } = render(
      <AppEmpty
        headingLevel={3}
        media={{ icon: CircleHelpIcon }}
        title={<span />}
      />,
    )

    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument()
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})
