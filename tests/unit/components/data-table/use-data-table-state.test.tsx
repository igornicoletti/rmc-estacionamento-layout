import { act, renderHook } from "@testing-library/react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  useDataTablePageBounds,
  useDataTableState,
} from "@/components/data-table/hooks/use-data-table-state"

afterEach(() => {
  vi.useRealTimers()
})

describe("useDataTableState", () => {
  it("confirma somente o último termo após 500 ms", async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDataTableState())

    act(() => {
      result.current.handleSearchChange("fin")
      result.current.handleSearchChange("financeiro")
    })

    expect(result.current.searchDraft).toBe("financeiro")
    expect(result.current.globalFilter).toBe("")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(499)
    })
    expect(result.current.globalFilter).toBe("")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.globalFilter).toBe("financeiro")
  })

  it("cancela uma busca pendente ao limpar", async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDataTableState())

    act(() => {
      result.current.handleSearchChange("descartar")
      result.current.clearSearch()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(result.current.searchDraft).toBe("")
    expect(result.current.globalFilter).toBe("")
  })

  it("reinicia a página nas mudanças que alteram o conjunto de dados", () => {
    const { result } = renderHook(() => useDataTableState({ initialPageSize: 10 }))

    act(() => {
      result.current.onPaginationChange({ pageIndex: 2, pageSize: 10 })
    })
    expect(result.current.pagination).toEqual({ pageIndex: 2, pageSize: 10 })

    act(() => {
      result.current.onSortingChange([{ id: "name", desc: false }])
    })
    expect(result.current.sorting).toHaveLength(1)
    expect(result.current.pagination.pageIndex).toBe(0)

    act(() => {
      result.current.onPaginationChange({ pageIndex: 2, pageSize: 10 })
      result.current.onColumnFiltersChange([{ id: "status", value: "active" }])
    })
    expect(result.current.columnFilters).toHaveLength(1)
    expect(result.current.pagination.pageIndex).toBe(0)
    expect(result.current.hasFilters).toBe(true)

    act(() => {
      result.current.onPaginationChange({ pageIndex: 2, pageSize: 20 })
    })
    expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 20 })

    act(() => result.current.clearFilters())
    expect(result.current.columnFilters).toEqual([])
    expect(result.current.hasFilters).toBe(false)
  })

  it("confirma imediatamente uma busca pendente", () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDataTableState())

    act(() => {
      result.current.handleSearchChange("  ana  ")
      result.current.submitSearch()
    })

    expect(result.current.globalFilter).toBe("ana")
    expect(result.current.hasFilters).toBe(true)
  })
})

describe("useDataTablePageBounds", () => {
  it("corrige uma página que deixou de existir", () => {
    const onPaginationChange = vi.fn<OnChangeFn<PaginationState>>()

    renderHook(() =>
      useDataTablePageBounds({
        isPlaceholderData: false,
        onPaginationChange,
        pagination: { pageIndex: 2, pageSize: 5 },
        rowCount: 4,
      }),
    )

    expect(onPaginationChange).toHaveBeenCalledOnce()
    const updater = onPaginationChange.mock.calls[0]?.[0]
    expect(typeof updater).toBe("function")
    if (typeof updater !== "function") return
    expect(updater({ pageIndex: 2, pageSize: 5 })).toEqual({
      pageIndex: 0,
      pageSize: 5,
    })
  })

  it("não corrige limites enquanto usa placeholder", () => {
    const onPaginationChange = vi.fn<OnChangeFn<PaginationState>>()

    renderHook(() =>
      useDataTablePageBounds({
        isPlaceholderData: true,
        onPaginationChange,
        pagination: { pageIndex: 2, pageSize: 5 },
        rowCount: 4,
      }),
    )

    expect(onPaginationChange).not.toHaveBeenCalled()
  })

  it("não corrige uma página válida nem um total ainda desconhecido", () => {
    const onPaginationChange = vi.fn<OnChangeFn<PaginationState>>()
    const { rerender } = renderHook(
      ({ rowCount }: { rowCount?: number }) =>
        useDataTablePageBounds({
          isPlaceholderData: false,
          onPaginationChange,
          pagination: { pageIndex: 0, pageSize: 5 },
          rowCount,
        }),
      { initialProps: { rowCount: undefined as number | undefined } },
    )

    expect(onPaginationChange).not.toHaveBeenCalled()
    rerender({ rowCount: 4 })
    expect(onPaginationChange).not.toHaveBeenCalled()
  })
})
