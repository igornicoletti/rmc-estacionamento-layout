import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"

interface AppProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
}

function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
    },
  })
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createAppQueryClient())

  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <Toaster>{children}</Toaster>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
