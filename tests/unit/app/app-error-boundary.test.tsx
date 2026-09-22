import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppErrorBoundary } from "@/app/app-error-boundary"

function BrokenComponent(): never {
  throw new Error("sensitive internal detail")
}

describe("AppErrorBoundary", () => {
  it("apresenta fallback sanitizado e permite recuperação", async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    const onReload = vi.fn()

    render(
      <AppErrorBoundary onError={onError} onReload={onReload}>
        <BrokenComponent />
      </AppErrorBoundary>,
    )

    expect(
      screen.getByRole("heading", {
        name: "Não foi possível iniciar a aplicação",
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/sensitive internal detail/i),
    ).not.toBeInTheDocument()
    expect(onError).toHaveBeenCalledOnce()

    await user.click(screen.getByRole("button", { name: "Recarregar" }))

    expect(onReload).toHaveBeenCalledOnce()
  })
})
