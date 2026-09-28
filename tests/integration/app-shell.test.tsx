import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/app"
import { routes } from "@/app/app-route-tree"
import { anonymousSession } from "@/features/auth/auth-types"
import { headerContent } from "@/components/header/header-content"
import { waitForRouterInitialization } from "@tests/support/router"

async function renderApp(initialEntry = "/") {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  })

  await waitForRouterInitialization(router)

  render(<App initialSessionSnapshot={anonymousSession} router={router} />)
}

describe("app shell", () => {
  it("expõe o header e seus controles como banner da aplicação", async () => {
    await renderApp()

    const header = screen.getByRole("banner")
    expect(within(header).getByRole("button", {
      name: headerContent.userMenu.trigger,
    })).toBeInTheDocument()
    expect(within(header).getByRole("button", {
      name: new RegExp(`^${headerContent.notifications.trigger}`),
    })).toBeInTheDocument()
  })

  it("não oferece ação no estado sem novas notificações", async () => {
    const user = userEvent.setup()

    await renderApp()

    const notificationTrigger = screen.getByRole("button", {
      name: new RegExp(`^${headerContent.notifications.trigger}`),
    })

    await user.click(notificationTrigger)

    const popover = await screen.findByRole("dialog", {
      name: headerContent.notifications.title,
    })

    await user.click(within(popover).getByRole("button"))

    expect(within(popover).queryByRole("button")).not.toBeInTheDocument()
    expect(within(popover).queryByRole("link")).not.toBeInTheDocument()
  })
})
