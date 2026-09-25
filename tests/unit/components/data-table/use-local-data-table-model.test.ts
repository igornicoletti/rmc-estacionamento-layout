import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useLocalDataTableModel } from "@/components/data-table/hooks/use-local-data-table-model"

interface Row {
  city: string
  group: string
  id: string
  name: string
}

const rows: Row[] = [
  { city: "São Paulo", group: "SP", id: "1", name: "Beta" },
  { city: "Curitiba", group: "PR", id: "2", name: "Alfa" },
  { city: "São Paulo", group: "SP", id: "3", name: "Gama" },
]

const options = {
  getFacetGroup: (row: Row) => row.group,
  getFacetLabel: (row: Row) => row.city,
  getFacetValue: (row: Row) => `${row.group}:${row.city}`,
  getSearchText: (row: Row) => `${row.name} ${row.city}`,
  getSortValue: (row: Row, columnId: string) =>
    row[columnId as keyof Row],
  rows,
}

describe("useLocalDataTableModel", () => {
  it("constrói faceta agrupada e contabiliza valores", () => {
    const { result } = renderHook(() =>
      useLocalDataTableModel(options),
    )

    expect(result.current.facet.counts).toEqual({
      "PR:Curitiba": 1,
      "SP:São Paulo": 2,
    })
    expect(result.current.facet.items).toEqual([
      { group: "PR", label: "Curitiba", value: "PR:Curitiba" },
      { group: "SP", label: "São Paulo", value: "SP:São Paulo" },
    ])
  })

  it("filtra por faceta e reinicia a paginação", () => {
    const { result } = renderHook(() =>
      useLocalDataTableModel({
        ...options,
        initialPageSize: 1,
      }),
    )

    act(() => {
      result.current.state.onPaginationChange({
        pageIndex: 2,
        pageSize: 1,
      })
    })

    act(() => {
      result.current.onFacetValueChange("SP:São Paulo")
    })

    expect(result.current.state.pagination.pageIndex).toBe(0)
    expect(result.current.filteredRows.map((row) => row.id)).toEqual([
      "1",
      "3",
    ])
    expect(result.current.hasActiveFilters).toBe(true)
    expect(result.current.activeFilterCount).toBe(1)
  })

  it("ordena, pagina e limpa a faceta sem compartilhar estado entre instâncias", () => {
    const first = renderHook(() =>
      useLocalDataTableModel({
        ...options,
        initialPageSize: 2,
      }),
    )
    const second = renderHook(() =>
      useLocalDataTableModel(options),
    )

    act(() => {
      first.result.current.state.onSortingChange([
        { desc: false, id: "name" },
      ])
      first.result.current.onFacetValueChange("SP:São Paulo")
    })

    expect(first.result.current.sortedRows.map((row) => row.name)).toEqual([
      "Beta",
      "Gama",
    ])
    expect(first.result.current.pageRows).toHaveLength(2)
    expect(second.result.current.facetValue).toBeUndefined()

    act(() => {
      first.result.current.clearFilters()
    })

    expect(first.result.current.facetValue).toBeUndefined()
    expect(first.result.current.filteredRows).toHaveLength(3)
  })
})
