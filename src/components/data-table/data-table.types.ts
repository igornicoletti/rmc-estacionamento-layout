export interface PaginatedResult<T> {
  rows: T[]
  rowCount: number
}

export interface DataTableColumnMeta {
  visibilityLabel?: string
}

export interface RepositoryRequestOptions {
  signal?: AbortSignal
}
