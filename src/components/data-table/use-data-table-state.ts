import { useCallback, useEffect, useState } from "react"
import { useDebouncer } from "@tanstack/react-pacer"
import {
  functionalUpdate,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"

const SEARCH_DEBOUNCE_MS = 500

interface UseDataTableStateOptions {
  initialPageSize?: number
}

export function useDataTableState({
  initialPageSize = 5,
}: UseDataTableStateOptions = {}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [searchDraft, setSearchDraft] = useState("")
  const [globalFilter, setGlobalFilter] = useState("")

  const resetPage = useCallback(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [])

  const searchDebouncer = useDebouncer(
    (value: string) => {
      setGlobalFilter(value.trim())
      resetPage()
    },
    {
      wait: SEARCH_DEBOUNCE_MS,
      leading: false,
      trailing: true,
    },
  )

  const onSortingChange: OnChangeFn<SortingState> = useCallback((updater) => {
    setSorting((current) => functionalUpdate(updater, current))
    resetPage()
  }, [resetPage])

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = useCallback((updater) => {
    setColumnFilters((current) => functionalUpdate(updater, current))
    resetPage()
  }, [resetPage])

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback((updater) => {
    setPagination((current) => {
      const next = functionalUpdate(updater, current)
      return next.pageSize === current.pageSize
        ? next
        : { ...next, pageIndex: 0 }
    })
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchDraft(value)
    searchDebouncer.maybeExecute(value)
  }, [searchDebouncer])

  const clearSearch = useCallback(() => {
    searchDebouncer.cancel()
    setSearchDraft("")
    setGlobalFilter("")
    resetPage()
  }, [resetPage, searchDebouncer])

  const submitSearch = useCallback(() => {
    searchDebouncer.flush()
  }, [searchDebouncer])

  const clearFilters = useCallback(() => {
    searchDebouncer.cancel()
    setSearchDraft("")
    setGlobalFilter("")
    setColumnFilters([])
    resetPage()
  }, [resetPage, searchDebouncer])

  return {
    sorting,
    columnFilters,
    columnVisibility,
    pagination,
    searchDraft,
    globalFilter,
    hasFilters: Boolean(globalFilter || columnFilters.length),
    setColumnVisibility,
    onSortingChange,
    onColumnFiltersChange,
    onPaginationChange,
    handleSearchChange,
    clearSearch,
    submitSearch,
    clearFilters,
  }
}

interface UseDataTablePageBoundsOptions {
  isPlaceholderData: boolean
  onPaginationChange: OnChangeFn<PaginationState>
  pagination: PaginationState
  rowCount?: number
}

export function useDataTablePageBounds({
  isPlaceholderData,
  onPaginationChange,
  pagination,
  rowCount,
}: UseDataTablePageBoundsOptions) {
  useEffect(() => {
    if (rowCount === undefined || isPlaceholderData) return

    const lastPageIndex = Math.max(
      Math.ceil(rowCount / pagination.pageSize) - 1,
      0,
    )

    if (pagination.pageIndex <= lastPageIndex) return

    onPaginationChange((current) => ({
      ...current,
      pageIndex: lastPageIndex,
    }))
  }, [
    isPlaceholderData,
    onPaginationChange,
    pagination.pageIndex,
    pagination.pageSize,
    rowCount,
  ])
}
