import { useCallback, useMemo, useState } from "react"
import type { ColumnVisibilityState } from "@tanstack/react-table"

import {
  normalizeSearchText,
  paginateRows,
  sortRows,
  type SortValue,
} from "@/components/data-table/core/table-data-utils"
import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state"

export interface LocalDataTableFacetItem {
  group?: string
  label: string
  value: string
}

interface UseLocalDataTableModelOptions<TRow> {
  getFacetGroup?: (row: TRow) => string | undefined
  getFacetLabel?: (row: TRow) => string
  getFacetValue?: (row: TRow) => string | null | undefined
  getSearchText: (row: TRow) => string
  getSortValue: (row: TRow, columnId: string) => SortValue
  initialColumnVisibility?: ColumnVisibilityState
  initialPageSize?: number
  rows: readonly TRow[]
}

const EMPTY_FACET = {
  counts: {} as Record<string, number>,
  items: [] as LocalDataTableFacetItem[],
}

export function useLocalDataTableModel<TRow>({
  getFacetGroup,
  getFacetLabel,
  getFacetValue,
  getSearchText,
  getSortValue,
  initialColumnVisibility,
  initialPageSize,
  rows,
}: UseLocalDataTableModelOptions<TRow>) {
  const state = useDataTableState({
    initialColumnVisibility,
    initialPageSize,
  })
  const [facetValue, setFacetValue] = useState<string>()
  const {
    clearFilters: clearTableFilters,
    onPaginationChange,
  } = state

  const facet = useMemo(() => {
    if (!getFacetValue || !getFacetLabel) {
      return EMPTY_FACET
    }

    const items = new Map<string, LocalDataTableFacetItem>()
    const counts: Record<string, number> = {}

    for (const row of rows) {
      const value = getFacetValue(row)

      if (!value) {
        continue
      }

      counts[value] = (counts[value] ?? 0) + 1

      if (!items.has(value)) {
        items.set(value, {
          group: getFacetGroup?.(row),
          label: getFacetLabel(row),
          value,
        })
      }
    }

    return {
      counts,
      items: Array.from(items.values()).sort((left, right) => {
        const groupComparison = (left.group ?? "").localeCompare(
          right.group ?? "",
          "pt-BR",
        )

        return (
          groupComparison ||
          left.label.localeCompare(right.label, "pt-BR")
        )
      }),
    }
  }, [
    getFacetGroup,
    getFacetLabel,
    getFacetValue,
    rows,
  ])

  const filteredRows = useMemo(() => {
    const search = normalizeSearchText(state.globalFilter)

    return rows.filter((row) => {
      if (
        facetValue &&
        getFacetValue &&
        getFacetValue(row) !== facetValue
      ) {
        return false
      }

      return (
        !search ||
        normalizeSearchText(getSearchText(row)).includes(search)
      )
    })
  }, [
    facetValue,
    getFacetValue,
    getSearchText,
    rows,
    state.globalFilter,
  ])

  const sortedRows = useMemo(
    () => sortRows(filteredRows, state.sorting, getSortValue),
    [filteredRows, getSortValue, state.sorting],
  )

  const pageRows = useMemo(
    () => paginateRows(sortedRows, state.pagination),
    [sortedRows, state.pagination],
  )

  const onFacetValueChange = useCallback(
    (value: string | undefined) => {
      setFacetValue(value)
      onPaginationChange((current) => ({
        ...current,
        pageIndex: 0,
      }))
    },
    [onPaginationChange],
  )

  const clearFilters = useCallback(() => {
    clearTableFilters()
    setFacetValue(undefined)
  }, [clearTableFilters])

  return {
    activeFilterCount:
      Number(Boolean(state.searchDraft.trim())) +
      Number(Boolean(facetValue)),
    clearFilters,
    facet,
    facetValue,
    filteredRows,
    hasActiveFilters: state.hasFilters || Boolean(facetValue),
    onFacetValueChange,
    pageRows,
    sortedRows,
    state,
  }
}
