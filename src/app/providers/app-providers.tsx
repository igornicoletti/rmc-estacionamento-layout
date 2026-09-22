import type { QueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"

import { SessionBootstrapBoundary } from "../session/session-bootstrap-boundary"
import type { SessionCommands } from "../session/session-commands"
import { SessionProvider } from "../session/session-provider"
import type { SessionSnapshot } from "../session/session-status"
import { QueryProvider } from "./query-provider"

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
