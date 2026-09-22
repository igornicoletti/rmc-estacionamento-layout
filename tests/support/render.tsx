import type { ReactElement, ReactNode } from "react"
import { render, type RenderOptions } from "@testing-library/react"

import { AppProviders } from "@/app/app-providers"
import { anonymousSession } from "@/app/session/session-types"

function TestProviders({ children }: { children: ReactNode }) {
  return (
    <AppProviders initialSessionSnapshot={anonymousSession}>
      {children}
    </AppProviders>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    ...options,
    wrapper: TestProviders,
  })
}
