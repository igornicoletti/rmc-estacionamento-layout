import type { PaginationState, SortingState } from "@tanstack/react-table"

type SortValue = boolean | number | string | null | undefined

export function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLocaleLowerCase("pt-BR")
}

export function sortRows<T>(rows: readonly T[], sorting: SortingState, getValue: (row: T, columnId: string) => SortValue) {
  const sort = sorting[0]
  if (!sort) return [...rows]
  return [...rows].sort((left, right) => {
    const comparison = String(getValue(left, sort.id) ?? "").localeCompare(String(getValue(right, sort.id) ?? ""), "pt-BR", { numeric: true, sensitivity: "base" })
    return sort.desc ? -comparison : comparison
  })
}

export function paginateRows<T>(rows: readonly T[], pagination: PaginationState) {
  const start = pagination.pageIndex * pagination.pageSize
  return rows.slice(start, start + pagination.pageSize)
}
