import { RouterProvider, type RouterProviderProps } from "react-router/dom"

import { AppErrorBoundary } from "@/app/root/app-error-boundary"
import { AppProviders, type AppProvidersProps } from "@/app/root/app-providers"

interface AppProps extends Omit<AppProvidersProps, "children"> {
  router: RouterProviderProps["router"]
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
