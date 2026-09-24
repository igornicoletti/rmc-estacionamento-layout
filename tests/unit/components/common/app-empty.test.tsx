import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircleHelpIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { AppEmpty } from "@/components/common/app-empty"
import { Button } from "@/components/ui/button"

describe("AppEmpty", () => {
  it("encaminha conteúdo complementar sem impor quantidade de ações", async () => {
    const user = userEvent.setup()
    const onFirstAction = vi.fn()
    const onSecondAction = vi.fn()
    const onThirdAction = vi.fn()

    render(
      <AppEmpty media={{ icon: CircleHelpIcon }} title="state">
        <input aria-label="Conteúdo adicional" />
        <div>
          <Button onClick={onFirstAction}>primeira</Button>
          <Button onClick={onSecondAction}>segunda</Button>
          <Button onClick={onThirdAction}>terceira</Button>
        </div>
      </AppEmpty>,
    )

    expect(
      screen.getByRole("textbox", { name: "Conteúdo adicional" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "primeira" }))
    await user.click(screen.getByRole("button", { name: "segunda" }))
    await user.click(screen.getByRole("button", { name: "terceira" }))

    expect(onFirstAction).toHaveBeenCalledOnce()
    expect(onSecondAction).toHaveBeenCalledOnce()
    expect(onThirdAction).toHaveBeenCalledOnce()
  })
})
