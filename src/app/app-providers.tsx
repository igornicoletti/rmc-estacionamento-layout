import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createAppQueryClient } from "@/app/query-client"
import { SessionBootstrapBoundary } from "@/app/session/session-boundary"
import type { SessionCommands } from "@/app/session/session-commands"
import { SessionProvider } from "@/app/session/session-provider"
import type { SessionSnapshot } from "@/app/session/session-types"

export interface AppProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
  sessionCommands?: SessionCommands
  initialSessionSnapshot?: SessionSnapshot
}

export function AppProviders({
  children,
  queryClient,
  sessionCommands,
  initialSessionSnapshot,
}: AppProvidersProps) {
  const [stableClient] = useState(() => queryClient ?? createAppQueryClient())

  return (
    <QueryClientProvider client={stableClient}>
      <SessionProvider
        commands={sessionCommands}
        initialSnapshot={initialSessionSnapshot}
      >
        <SessionBootstrapBoundary>
          <TooltipProvider>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </SessionBootstrapBoundary>
      </SessionProvider>
    </QueryClientProvider>
  )
}
