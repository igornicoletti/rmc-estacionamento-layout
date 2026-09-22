import { render, waitFor } from "@testing-library/react"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/app"
import { RouteAccessBoundary } from "@/app/routing/route-access-boundary"
import type { AppRouteHandle } from "@/app/routing/route-access"
import { anonymousSession } from "@/app/session/session-types"

function EmptyRoute() {
  return null
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
})
