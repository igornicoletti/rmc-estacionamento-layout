import { act, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { notify } from "@/components/toast/toast-notify"
import { Toaster } from "@/components/ui/toast"

describe("Toast", () => {
  it("exibe uma notificação enviada pela API pública", async () => {
    render(<Toaster />)

    act(() => {
      notify({
        title: "Operação concluída",
        description: "As alterações foram salvas.",
        type: "success",
      })
    })

    expect(await screen.findByText("Operação concluída")).toBeVisible()
    expect(screen.getByText("As alterações foram salvas.")).toBeVisible()
  })
})
