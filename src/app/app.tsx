import type { QueryClient } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { RouterProvider } from "react-router/dom"

import { AppErrorBoundary } from "@/app/app-error-boundary"
import { AppProviders } from "@/app/app-providers"
import type { SessionCommands } from "@/app/session/session-commands"
import type { SessionSnapshot } from "@/app/session/session-types"

type RouterInstance = ComponentProps<typeof RouterProvider>["router"]

interface AppProps {
  initialSessionSnapshot?: SessionSnapshot
  queryClient?: QueryClient
  router: RouterInstance
  sessionCommands?: SessionCommands
}

export default function App({
  initialSessionSnapshot,
  queryClient,
  router,
  sessionCommands,
}: AppProps) {
  return (
    <AppErrorBoundary>
      <AppProviders
        initialSessionSnapshot={initialSessionSnapshot}
        queryClient={queryClient}
        sessionCommands={sessionCommands}
      >
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  )
}
