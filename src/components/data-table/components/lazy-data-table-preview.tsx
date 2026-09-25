import { lazy, Suspense } from "react"

import { DataTableLoadingFallback } from "@/components/data-table/components/data-table-state"

import type { DataTablePreviewProps } from "@/components/data-table/components/data-table-preview"

const DataTablePreview = lazy(() =>
  import("@/components/data-table/components/data-table-preview").then(
    (module) => ({ default: module.DataTablePreview }),
  ),
)

export function LazyDataTablePreview(props: DataTablePreviewProps) {
  return (
    <Suspense fallback={<DataTableLoadingFallback />}>
      <DataTablePreview {...props} />
    </Suspense>
  )
}
