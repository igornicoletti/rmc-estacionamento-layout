import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

import { SessionBootstrapBoundary } from "@/app/session/session-boundary"
import type { SessionCommands } from "@/app/session/session-commands"
import { SessionProvider } from "@/app/session/session-provider"
import type { ResolvedSessionSnapshot } from "@/app/session/session-types"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createAppQueryClient } from "@/lib/query/query-client"

export interface AppProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
  sessionCommands?: SessionCommands
  initialSessionSnapshot?: ResolvedSessionSnapshot
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
      <ThemeProvider>
        <SessionProvider
          commands={sessionCommands}
          initialSnapshot={initialSessionSnapshot}
        >
          <SessionBootstrapBoundary>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </SessionBootstrapBoundary>
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
