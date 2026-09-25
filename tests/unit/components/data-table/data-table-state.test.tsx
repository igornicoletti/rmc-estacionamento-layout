import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DataTableEmpty,
  DataTableError,
  DataTableLazyFallback,
  DataTableSkeletonRows,
  DataTableUpdating,
} from "@/components/data-table/components/data-table-state"

afterEach(() => {
  vi.useRealTimers()
})

describe("DataTableLazyFallback", () => {
  it("expõe um status de carregamento sem depender da copy", () => {
    render(<DataTableLazyFallback />)

    const status = screen.getByRole("status")

    expect(status).toBeVisible()
    expect(status.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2)
  })
})

describe("DataTableUpdating", () => {
  it("não reserva espaço quando inativo e atrasa atualizações transitórias", async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(
      <DataTableUpdating active={false} />,
    )

    expect(container).toBeEmptyDOMElement()

    rerender(<DataTableUpdating active />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(screen.getByRole("status")).toBeVisible()

    rerender(<DataTableUpdating active={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("DataTableError", () => {
  it("executa a nova tentativa", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<DataTableError onRetry={onRetry} />)

    expect(screen.getByRole("alert")).toBeVisible()
    await user.click(screen.getByRole("button"))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe("DataTableEmpty", () => {
  it("oferece limpar filtros somente quando há filtros", async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    const { rerender } = render(
      <DataTableEmpty hasFilters onClearFilters={onClearFilters} />,
    )

    await user.click(screen.getByRole("button"))
    expect(onClearFilters).toHaveBeenCalledOnce()

    rerender(
      <DataTableEmpty
        hasFilters={false}
        onClearFilters={onClearFilters}
      />,
    )
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})

describe("DataTableSkeletonRows", () => {
  it("preserva a geometria solicitada", () => {
    render(
      <table>
        <tbody>
          <DataTableSkeletonRows columns={2} rows={3} />
        </tbody>
      </table>,
    )

    expect(screen.getAllByRole("row", { hidden: true })).toHaveLength(3)
    expect(screen.getAllByRole("cell", { hidden: true })).toHaveLength(6)
  })
})
