import type { QueryClient } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { RouterProvider } from "react-router/dom"

import { AppProviders } from "../providers/app-providers"
import { router as defaultRouter } from "../routing/router"
import type { SessionCommands } from "../session/session-commands"
import type { SessionSnapshot } from "../session/session-status"
import { AppErrorBoundary } from "./app-error-boundary"

type RouterInstance = ComponentProps<typeof RouterProvider>["router"]

interface AppProps {
  initialSessionSnapshot?: SessionSnapshot
  queryClient?: QueryClient
  router?: RouterInstance
  sessionCommands?: SessionCommands
}

export default function App({
  initialSessionSnapshot,
  queryClient,
  router = defaultRouter,
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
