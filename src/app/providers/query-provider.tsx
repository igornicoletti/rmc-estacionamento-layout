/* eslint-disable react-refresh/only-export-components -- policy and factory are part of this provider's public contract */
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

const SECOND = 1_000
const MINUTE = 60 * SECOND

function readStatus(error: unknown) {
  if (error instanceof Response) {
    return error.status
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status
  }

  return null
}

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false
  }

  const status = readStatus(error)
  return status === 408 || status === 429 || (status !== null && status >= 500)
}

export const appQueryClientConfig = {
  defaultOptions: {
    mutations: { retry: false },
    queries: {
      gcTime: 10 * MINUTE,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
      retryDelay: (attemptIndex: number) =>
        Math.min(SECOND * 2 ** attemptIndex, 30 * SECOND),
      staleTime: 30 * SECOND,
    },
  },
} satisfies QueryClientConfig

export function createAppQueryClient() {
  return new QueryClient(appQueryClientConfig)
}

interface QueryProviderProps {
  children: ReactNode
  client?: QueryClient
}

export function QueryProvider({ children, client }: QueryProviderProps) {
  const [stableClient] = useState(() => client ?? createAppQueryClient())

  return (
    <QueryClientProvider client={stableClient}>{children}</QueryClientProvider>
  )
}
