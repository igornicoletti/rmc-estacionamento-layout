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

  it("compõe o avatar e seu fallback dentro de EmptyMedia", () => {
    const { container } = render(
      <AppEmpty
        media={{
          avatar: {
            alt: "Avatar de Marina",
            fallback: "MN",
            src: "/marina.png",
          },
        }}
        title="Marina"
      />,
    )

    expect(container.querySelector('[data-slot="empty-icon"]')).toHaveAttribute(
      "data-variant",
      "default",
    )
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="avatar-fallback"]')).toHaveTextContent(
      "MN",
    )
  })
})
