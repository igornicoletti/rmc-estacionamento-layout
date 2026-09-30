import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import App from "@/app/app"
import { routes } from "@/app/app-route-tree"
import type { SessionCommands } from "@/features/auth/session/auth-commands"
import type { ResolvedSessionSnapshot } from "@/features/auth/contracts/auth-types"
import { notify } from "@/components/toast/toast-notify"
import { waitForRouterInitialization } from "@tests/support/router"

vi.mock("@/components/toast/toast-notify", () => ({
  notify: vi.fn(),
}))

const showToast = vi.mocked(notify)

const authenticatedSession = {
  status: "authenticated",
  session: {
    assurance: "aal1",
    freshUntil: null,
    capabilities: [],
    identity: {
      displayName: "Usuária",
      id: "user-1",
    },
  },
} satisfies ResolvedSessionSnapshot

describe("app shell sign out", () => {
  it("usa feedback público urgente quando o logout falha", async () => {
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
      expect(showToast).toHaveBeenCalledOnce()
    })

    const definition = showToast.mock.calls[0]?.[0]

    expect(sessionCommands.signOut).toHaveBeenCalledOnce()
    expect(definition).toMatchObject({
      priority: "high",
      type: "error",
    })
    expect(definition?.description).not.toBe("internal provider detail")
  })
})
