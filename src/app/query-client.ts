import { QueryClient, type QueryClientConfig } from "@tanstack/react-query"

import { readHttpStatus } from "@/lib/http-status"

const SECOND = 1_000
const MINUTE = 60 * SECOND

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false
  }

  const status = readHttpStatus(error)
  return status === 408 || status === 429 || (status !== null && status >= 500)
}

export const appQueryClientConfig = {
  defaultOptions: {
    mutations: { retry: false },
    queries: {
      gcTime: 10 * MINUTE,
      refetchOnReconnect: true,
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
