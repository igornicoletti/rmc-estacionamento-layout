import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircleHelpIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { AppEmpty } from "@/components/common/app-empty"
import { Button } from "@/components/ui/button"

describe("AppEmpty", () => {
  it("encaminha children para EmptyContent junto das ações", async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()

    render(
      <AppEmpty
        media={{ icon: CircleHelpIcon }}
        primaryAction={<Button onClick={onPrimary}>primary</Button>}
        secondaryAction={
          <Button onClick={onSecondary} variant="outline">
            secondary
          </Button>
        }
        title="state"
      >
        <input aria-label="Conteúdo adicional" />
      </AppEmpty>,
    )

    const content = screen
      .getByRole("textbox", { name: "Conteúdo adicional" })
      .closest('[data-slot="empty-content"]')

    expect(content).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "primary" }))
    await user.click(screen.getByRole("button", { name: "secondary" }))

    expect(onPrimary).toHaveBeenCalledOnce()
    expect(onSecondary).toHaveBeenCalledOnce()
  })
})
