import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  constructFilterFn,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  filterFn_equals,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures,
} from "@tanstack/react-table"

export interface DataTableColumnMeta {
  visibilityLabel: string
}

function normalizeSearchValue(value: unknown) {
  const text = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : ""
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
}

const accentInsensitive = constructFilterFn({
  ...filterFn_includesString,
  resolveDataValue: normalizeSearchValue,
  resolveFilterValue: normalizeSearchValue,
})

export const dataTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { accentInsensitive, equals: filterFn_equals },
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
  columnMeta: metaHelper<DataTableColumnMeta>(),
})

export type DataTableFeatures = typeof dataTableFeatures

export const {
  useAppTable: useDataTable,
  createAppColumnHelper: createDataTableColumnHelper,
} = createTableHook({
  features: dataTableFeatures,
  enableMultiSort: false,
  globalFilterFn: "accentInsensitive",
})
