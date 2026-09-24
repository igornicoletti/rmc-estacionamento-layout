import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { AppCalendar } from "@/components/common/app-calendar"

describe("AppCalendar", () => {
  it("suporta renderização no servidor sem resolver o fuso local no snapshot SSR", () => {
    expect(() =>
      renderToString(
        <AppCalendar mode="single" month={new Date(2026, 8, 1)} />,
      ),
    ).not.toThrow()
  })
})
