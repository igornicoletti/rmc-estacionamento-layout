import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

import { createAppQueryClient } from "@/app/query-client"
import { SessionBootstrapBoundary } from "@/app/session/session-boundary"
import type { SessionCommands } from "@/app/session/session-commands"
import { SessionProvider } from "@/app/session/session-provider"
import type { SessionSnapshot } from "@/app/session/session-types"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"

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
      <ThemeProvider>
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
      </ThemeProvider>
    </QueryClientProvider>
  )
}
