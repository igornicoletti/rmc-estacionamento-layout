import { render, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/root/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"
import { waitForRouterInitialization } from "@tests/support/router"

async function renderApp(initialEntry = "/") {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  })

  await waitForRouterInitialization(router)

  render(<App initialSessionSnapshot={anonymousSession} router={router} />)
}

describe("app shell", () => {
  it("não oferece ação no estado sem novas notificações", async () => {
    const user = userEvent.setup()

    await renderApp()

    const notificationTrigger =
      document.querySelector<HTMLButtonElement>('[data-slot="popover-trigger"]')

    if (!notificationTrigger) {
      throw new Error("Trigger de notificações não encontrado.")
    }

    await user.click(notificationTrigger)

    const popover =
      document.querySelector<HTMLElement>('[data-slot="popover-content"]')

    if (!popover) {
      throw new Error("Popover de notificações não encontrado.")
    }

    await user.click(within(popover).getByRole("button"))

    expect(within(popover).queryByRole("button")).not.toBeInTheDocument()
    expect(within(popover).queryByRole("link")).not.toBeInTheDocument()
  })
})
