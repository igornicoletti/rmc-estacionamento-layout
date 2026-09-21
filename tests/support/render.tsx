import type { ReactElement } from "react"
import { QueryClient } from "@tanstack/react-query"
import { render, type RenderOptions } from "@testing-library/react"

import { AppProviders } from "@/app/app-providers"

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const queryClient = createTestQueryClient()

  return {
    queryClient,
    ...render(
      <AppProviders queryClient={queryClient}>{ui}</AppProviders>,
      options,
    ),
  }
}
