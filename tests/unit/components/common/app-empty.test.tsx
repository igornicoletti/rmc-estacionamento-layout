import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircleHelpIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { AppEmpty } from "@/components/common/app-empty"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

describe("AppEmpty", () => {
  it("oferece uma ou duas ações sem assumir o comportamento", async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()

    render(
      <AppEmpty
        media={{ icon: CircleHelpIcon }}
        primaryAction={<Button onClick={onPrimary}>Confirmar</Button>}
        secondaryAction={
          <Button onClick={onSecondary} variant="outline">
            Voltar
          </Button>
        }
        title="Escolha uma ação"
      />,
    )

    await user.click(screen.getByRole("button", { name: "Confirmar" }))
    await user.click(screen.getByRole("button", { name: "Voltar" }))

    expect(onPrimary).toHaveBeenCalledOnce()
    expect(onSecondary).toHaveBeenCalledOnce()
  })

  it("aceita um avatar como mídia", () => {
    render(
      <AppEmpty
        media={{
          avatar: (
            <Avatar>
              <AvatarFallback>RM</AvatarFallback>
            </Avatar>
          ),
        }}
        title="Perfil indisponível"
      />,
    )

    expect(screen.getByText("RM")).toBeInTheDocument()
  })
})
