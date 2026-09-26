import { beforeEach, describe, expect, it, vi } from "vitest"

import type { FeedbackDefinition } from "@/app/feedback/feedback-contract"
import { notify } from "@/app/feedback/notify"
import { toast } from "@/components/ui/toast"

vi.mock("@/components/ui/toast", () => ({
  toast: {
    add: vi.fn(),
  },
}))

const addToast = vi.mocked(toast.add)

describe("notify", () => {
  beforeEach(() => {
    addToast.mockReset()
  })

  it("encaminha somente o contrato público e não expõe o id do manager", () => {
    addToast.mockReturnValue("toast-1")

    const feedback = {
      description: "As alterações foram salvas.",
      internal: "não encaminhar",
      title: "Unidade atualizada",
      type: "success" as const,
    }

    const result = notify(feedback)

    expect(result).toBeUndefined()
    expect(addToast).toHaveBeenCalledOnce()
    expect(addToast).toHaveBeenCalledWith({
      description: "As alterações foram salvas.",
      title: "Unidade atualizada",
      type: "success",
    })
  })

  it("aceita feedback sem description", () => {
    const feedback = {
      title: "E-mail copiado",
      type: "success",
    } satisfies FeedbackDefinition

    notify(feedback)

    expect(addToast).toHaveBeenCalledWith({
      description: undefined,
      title: "E-mail copiado",
      type: "success",
    })
  })

  it("não oculta falhas inesperadas do manager", () => {
    const managerError = new Error("toast manager unavailable")
    addToast.mockImplementationOnce(() => {
      throw managerError
    })

    expect(() =>
      notify({
        title: "Teste",
        type: "info",
      }),
    ).toThrow(managerError)
  })
})
