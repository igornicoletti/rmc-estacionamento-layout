import { act, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppToaster } from "@/components/common/app-toast"
import { notify } from "@/components/toast/toast-notify"

describe("Toast", () => {
  it("exibe uma notificação enviada pela API pública", async () => {
    render(<AppToaster />)

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
