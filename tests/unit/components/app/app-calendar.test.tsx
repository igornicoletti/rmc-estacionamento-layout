import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AppCalendar } from "@/components/app/app-calendar"

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ timeZone }: { timeZone?: string }) => (
    <div data-testid="calendar" data-time-zone={timeZone} />
  ),
}))

describe("AppCalendar", () => {
  it("usa o fuso local do navegador quando nenhum fuso é informado", () => {
    render(<AppCalendar />)

    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-time-zone",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    )
  })

  it("preserva um fuso explícito do consumidor", () => {
    render(<AppCalendar timeZone="UTC" />)

    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-time-zone",
      "UTC",
    )
  })
})
