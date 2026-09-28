import { render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { waitForRouterInitialization } from "@tests/support/router"

import { appMetadata } from "@/app/app-metadata"
import { RouteErrorBoundary } from "@/app/app-route-error-boundary"
import { fallbackContent } from "@/components/fallback/fallback-content"
import type { FallbackRouteErrorKind } from "@/components/fallback/fallback-route-error"

describe("route error recovery", () => {
  it.each([
    { error: new Response(null, { status: 403 }), kind: "forbidden" },
    { error: new Response(null, { status: 404 }), kind: "notFound" },
    { error: new Response(null, { status: 503 }), kind: "unexpected" },
    { error: new Error("private server detail"), kind: "unexpected" },
    { error: { status: 403, message: "untrusted detail" }, kind: "unexpected" },
    { error: "private arbitrary value", kind: "unexpected" },
  ] satisfies { error: unknown; kind: FallbackRouteErrorKind }[])(
    "classifica o erro de loader como $kind e protege detalhes internos",
    async ({ error, kind }) => {
      const router = createMemoryRouter([
        {
          path: "/",
          loader: () => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- Exercise arbitrary values accepted by router error boundaries.
            throw error
          },
          Component: () => null,
          ErrorBoundary: RouteErrorBoundary,
        },
      ])
      await waitForRouterInitialization(router)
      document.title = "Previous route"
      render(<RouterProvider router={router} />)

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: fallbackContent[kind].title,
        }),
      ).toBeInTheDocument()
      expect(screen.queryByText(/private|untrusted/)).not.toBeInTheDocument()
      if (kind === "unexpected") {
        expect(screen.getByRole("button")).toBeEnabled()
      } else {
        expect(screen.queryByRole("button")).not.toBeInTheDocument()
      }
      await waitFor(() => expect(document.title).toBe(appMetadata.browserTitle))
      router.dispose()
    },
  )
})
