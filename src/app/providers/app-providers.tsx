import type { QueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "@/app/providers/query-provider"
import { SessionBootstrapBoundary } from "@/app/session/session-bootstrap-boundary"
import type { SessionCommands } from "@/app/session/session-commands"
import { SessionProvider } from "@/app/session/session-provider"
import type { SessionSnapshot } from "@/app/session/session-status"

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
  return (
    <QueryProvider client={queryClient}>
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
    </QueryProvider>
  )
}
