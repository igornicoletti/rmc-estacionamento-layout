import { render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/root/app"
import { RouteAccessBoundary } from "@/app/routing/route-access-boundary"
import type { AppRouteHandle } from "@/app/routing/route-access"
import { anonymousSession } from "@/app/session/session-types"

function EmptyRoute() {
  return null
}

function PrivateRoute() {
  return <button type="button" />
}

describe("route access boundary", () => {
  it("preserva pathname, query e hash ao redirecionar", async () => {
    const privateHandle = {
      access: { authentication: "required" },
      routeId: "private",
    } satisfies AppRouteHandle
    const router = createMemoryRouter(
      [
        {
          path: "/login",
          Component: EmptyRoute,
        },
        {
          Component: () => (
            <RouteAccessBoundary authenticationPath="/login" />
          ),
          children: [
            {
              path: "/private",
              Component: EmptyRoute,
              handle: privateHandle,
            },
          ],
        },
      ],
      {
        initialEntries: ["/private?tab=security#passkeys"],
      },
    )

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login")
    })
    expect(router.state.location.state).toEqual({
      returnTo: "/private?tab=security#passkeys",
    })
  })

  it("nega acesso quando um match contém handle inválido", async () => {
    const validHandle = {
      access: { authentication: "either" },
      routeId: "access",
    } satisfies AppRouteHandle
    const router = createMemoryRouter(
      [
        {
          Component: RouteAccessBoundary,
          handle: validHandle,
          children: [
            {
              path: "/private",
              Component: PrivateRoute,
              handle: {
                access: { authentication: "invalid" },
                routeId: "private",
              },
            },
          ],
        },
      ],
      {
        initialEntries: ["/private"],
      },
    )

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(await screen.findByRole("main")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
