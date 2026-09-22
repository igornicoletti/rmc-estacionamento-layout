import type { ReactElement } from "react"
import { render, type RenderOptions } from "@testing-library/react"

import { AppProviders } from "@/app/providers/app-providers"
import { anonymousSession } from "@/app/session/session-status"

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(
    <AppProviders initialSessionSnapshot={anonymousSession}>
      {ui}
    </AppProviders>,
    options,
  )
}
