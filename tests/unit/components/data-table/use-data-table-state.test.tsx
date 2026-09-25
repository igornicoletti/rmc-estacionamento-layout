import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state"

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
    const { result } = renderHook(() =>
      useDataTableState({ initialPageSize: 10 }),
    )

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
      result.current.onPaginationChange({ pageIndex: 2, pageSize: 20 })
    })
    expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 20 })
  })

  it("confirma e limpa imediatamente uma busca pendente", () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDataTableState())

    act(() => {
      result.current.handleSearchChange("  ana  ")
      result.current.submitSearch()
    })

    expect(result.current.globalFilter).toBe("ana")
    expect(result.current.hasFilters).toBe(true)

    act(() => result.current.clearFilters())

    expect(result.current.searchDraft).toBe("")
    expect(result.current.globalFilter).toBe("")
    expect(result.current.hasFilters).toBe(false)
  })
})
