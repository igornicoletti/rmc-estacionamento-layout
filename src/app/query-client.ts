import { QueryClient, type QueryClientConfig } from "@tanstack/react-query"

import { readHttpStatus } from "@/lib/http-status"

const SECOND = 1_000
const MINUTE = 60 * SECOND
const MAX_EXPONENTIAL_RETRY_DELAY = 30 * SECOND

function readRetryAfterDelay(error: unknown): number | null {
  if (typeof Response === "undefined" || !(error instanceof Response)) {
    return null
  }

  const retryAfter = error.headers.get("Retry-After")?.trim()

  if (!retryAfter) {
    return null
  }

  if (/^\d+$/u.test(retryAfter)) {
    return Number(retryAfter) * SECOND
  }

  const retryAt = Date.parse(retryAfter)

  return Number.isNaN(retryAt) ? null : Math.max(0, retryAt - Date.now())
}

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false
  }

  const status = readHttpStatus(error)
  return status === 408 || status === 429 || (status !== null && status >= 500)
}

export function getQueryRetryDelay(attemptIndex: number, error: unknown) {
  return (
    readRetryAfterDelay(error) ??
    Math.min(
      SECOND * 2 ** attemptIndex,
      MAX_EXPONENTIAL_RETRY_DELAY,
    )
  )
}

export const appQueryClientConfig = {
  defaultOptions: {
    mutations: { retry: false },
    queries: {
      gcTime: 10 * MINUTE,
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
      retryDelay: getQueryRetryDelay,
      staleTime: 30 * SECOND,
    },
  },
} satisfies QueryClientConfig

export function createAppQueryClient() {
  return new QueryClient(appQueryClientConfig)
}
