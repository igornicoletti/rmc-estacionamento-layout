import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"

describe("app shell", () => {
  it("abre um grupo inativo sob demanda", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const navigation = await screen.findByRole("navigation")
    const linksBefore = within(navigation).getAllByRole("link").length
    const collapsedTrigger = within(navigation)
      .getAllByRole("button")
      .find((button) => button.getAttribute("aria-expanded") === "false")

    expect(collapsedTrigger).toBeDefined()
    if (!collapsedTrigger) {
      return
    }

    await user.click(collapsedTrigger)

    await waitFor(() => {
      expect(within(navigation).getAllByRole("link").length).toBeGreaterThan(
        linksBefore,
      )
    })
  })

  it("mantém disponível a rota ativa do grupo atual", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/usuarios"],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const navigation = await screen.findByRole("navigation")
    const activeLink = within(navigation)
      .getAllByRole("link")
      .find((link) => link.getAttribute("aria-current") === "page")

    expect(activeLink).toBeDefined()
  })
})
