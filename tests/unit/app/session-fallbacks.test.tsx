import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  FallbackSessionLoading,
  FallbackSessionUnavailable,
} from "@/components/fallback/fallback-session"

describe("session fallbacks", () => {
  it("anuncia o bootstrap como estado de carregamento", () => {
    render(<FallbackSessionLoading />)

    expect(screen.getByRole("status")).toHaveAttribute("aria-label")
  })

  it("bloqueia novo retry enquanto a sessão está sendo consultada", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const view = render(
      <FallbackSessionUnavailable isRetrying={false} onRetry={onRetry} />,
    )

    await user.click(screen.getByRole("button"))
    expect(onRetry).toHaveBeenCalledOnce()

    view.rerender(
      <FallbackSessionUnavailable isRetrying={true} onRetry={onRetry} />,
    )

    const retry = screen.getByRole("button")
    expect(retry).toBeDisabled()
    expect(retry).toHaveAttribute("aria-busy", "true")

    await user.click(retry)
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
