import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { notify } from "@/app/feedback/notify"
import App from "@/app/root/app"
import { routes } from "@/app/routing/routes"
import type { SessionCommands } from "@/app/session/session-commands"
import { SESSION_FEEDBACK } from "@/app/session/content/session-feedback"
import type { ResolvedSessionSnapshot } from "@/app/session/session-types"
import { waitForRouterInitialization } from "@tests/support/router"

vi.mock("@/app/feedback/notify", () => ({
  notify: vi.fn(),
}))

const authenticatedSession = {
  status: "authenticated",
  session: {
    assurance: "aal1",
    capabilities: [],
    identity: {
      displayName: "Usuária",
      id: "user-1",
    },
  },
} satisfies ResolvedSessionSnapshot

describe("app shell feedback", () => {
  it("notifica uma falha de logout com feedback controlado e urgente", async () => {
    const user = userEvent.setup()
    const sessionCommands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      signOut: vi.fn().mockRejectedValue(new Error("internal provider detail")),
    }
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    await waitForRouterInitialization(router)

    render(
      <App
        initialSessionSnapshot={authenticatedSession}
        router={router}
        sessionCommands={sessionCommands}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Abrir menu do usuário" }),
    )
    await user.click(await screen.findByRole("menuitem", { name: "Sair" }))

    await waitFor(() => {
      expect(notify).toHaveBeenCalledOnce()
    })
    expect(SESSION_FEEDBACK.signOutFailed.priority).toBe("high")
    expect(notify).toHaveBeenCalledWith(SESSION_FEEDBACK.signOutFailed)
  })
})
