import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircleHelpIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { AppEmpty } from "@/components/common/app-empty"
import { Button } from "@/components/ui/button"

describe("AppEmpty", () => {
  it("encaminha as ações sem assumir o comportamento", async () => {
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
      />,
    )

    const actions = screen.getAllByRole("button")
    await user.click(actions[0]!)
    await user.click(actions[1]!)

    expect(onPrimary).toHaveBeenCalledOnce()
    expect(onSecondary).toHaveBeenCalledOnce()
  })
})
