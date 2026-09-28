import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

import { AuthBoundary } from "@/features/auth/auth-boundary"
import type { SessionCommands } from "@/features/auth/auth-commands"
import { AuthProvider } from "@/features/auth/auth-provider"
import type { ResolvedSessionSnapshot } from "@/features/auth/auth-types"
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
        <AuthProvider
          commands={sessionCommands}
          initialSnapshot={initialSessionSnapshot}
        >
          <AuthBoundary>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </AuthBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
