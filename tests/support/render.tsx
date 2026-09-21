import type { ReactElement } from "react"
import { render, type RenderOptions } from "@testing-library/react"

import { AppProviders } from "@/app/app-providers"

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(<AppProviders>{ui}</AppProviders>, options)
}
