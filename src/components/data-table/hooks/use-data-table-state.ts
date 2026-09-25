import { useCallback, useState } from "react"
import { useDebouncer } from "@tanstack/react-pacer"
import {
  functionalUpdate,
  type ColumnVisibilityState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"

const SEARCH_DEBOUNCE_MS = 500

interface UseDataTableStateOptions {
  initialColumnVisibility?: ColumnVisibilityState
  initialPageSize?: number
}

export function useDataTableState({
  initialColumnVisibility = {},
  initialPageSize = 10,
}: UseDataTableStateOptions = {}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(
    initialColumnVisibility,
  )
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

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting((current) => functionalUpdate(updater, current))
      resetPage()
    },
    [resetPage],
  )

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      setPagination((current) => {
        const next = functionalUpdate(updater, current)
        return next.pageSize === current.pageSize
          ? next
          : { ...next, pageIndex: 0 }
      })
    },
    [],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchDraft(value)
      searchDebouncer.maybeExecute(value)
    },
    [searchDebouncer],
  )

  const clearSearch = useCallback(() => {
    searchDebouncer.cancel()
    setSearchDraft("")
    setGlobalFilter("")
    resetPage()
  }, [resetPage, searchDebouncer])

  const submitSearch = useCallback(() => {
    searchDebouncer.flush()
  }, [searchDebouncer])

  return {
    sorting,
    columnVisibility,
    pagination,
    searchDraft,
    globalFilter,
    hasFilters: Boolean(globalFilter),
    setColumnVisibility,
    onSortingChange,
    onPaginationChange,
    handleSearchChange,
    clearSearch,
    submitSearch,
    clearFilters: clearSearch,
  }
}
