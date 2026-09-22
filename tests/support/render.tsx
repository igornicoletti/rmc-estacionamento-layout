import type { ReactElement } from "react"
import { render, type RenderOptions } from "@testing-library/react"

import { AppProviders } from "@/app/app-providers"
import { anonymousSession } from "@/app/session/session-types"

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
