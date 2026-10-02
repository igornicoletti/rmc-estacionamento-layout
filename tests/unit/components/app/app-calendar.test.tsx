import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { TZDate } from "react-day-picker"
import { enUS } from "react-day-picker/locale"

import { AppCalendar } from "@/components/app/app-calendar"

describe("AppCalendar", () => {
  it("seleciona uma data com o calendário real e locale padrão pt-BR", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { container } = render(
      <AppCalendar
        defaultMonth={new Date(2026, 0, 1)}
        mode="single"
        onSelect={onSelect}
      />,
    )

    expect(container.querySelector('[lang="pt-BR"]')).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /\b15\b/ }))
    expect(onSelect).toHaveBeenCalledOnce()
    const selected: unknown = onSelect.mock.calls[0]?.[0]
    expect(selected).toBeInstanceOf(Date)
    if (!(selected instanceof Date)) throw new Error("Data não selecionada")
    expect([selected.getFullYear(), selected.getMonth(), selected.getDate()])
      .toEqual([2026, 0, 15])
  })

  it("permite sobrescrever o locale sem alterar o modo de seleção", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { container } = render(
      <AppCalendar
        defaultMonth={new Date(2026, 0, 1)}
        locale={enUS}
        mode="single"
        onSelect={onSelect}
      />,
    )

    expect(container.querySelector('[lang="en-US"]')).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /\b15\b/ }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it.each(["America/Sao_Paulo", "Pacific/Kiritimati"])(
    "preserva o dia escolhido no fuso explícito %s",
    async (timeZone) => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <AppCalendar
          defaultMonth={new TZDate(2026, 0, 1, timeZone)}
          mode="single"
          onSelect={onSelect}
          timeZone={timeZone}
        />,
      )

      await user.click(screen.getByRole("button", { name: /\b15\b/ }))
      expect(onSelect).toHaveBeenCalledOnce()
      const selected: unknown = onSelect.mock.calls[0]?.[0]
      expect(selected).toBeInstanceOf(Date)
      if (!(selected instanceof Date)) throw new Error("Data não selecionada")
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).formatToParts(selected)
      expect(parts.find((part) => part.type === "year")?.value).toBe("2026")
      expect(parts.find((part) => part.type === "month")?.value).toBe("1")
      expect(parts.find((part) => part.type === "day")?.value).toBe("15")
    },
  )

  it("não seleciona uma data desabilitada", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <AppCalendar
        defaultMonth={new Date(2026, 0, 1)}
        disabled={new Date(2026, 0, 15)}
        mode="single"
        onSelect={onSelect}
      />,
    )

    const day = screen.getByRole("button", { name: /\b15\b/ })
    expect(day).toBeDisabled()
    await user.click(day)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
