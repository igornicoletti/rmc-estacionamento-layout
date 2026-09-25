import { createTableHook } from "@tanstack/react-table"

import { createDataTableFeatures } from "@/components/data-table/core/create-data-table-features"

export function createDataTableHook<TMeta extends object>() {
  const features = createDataTableFeatures<TMeta>()

  return {
    features,
    ...createTableHook({
      features,
      enableMultiSort: false,
      manualPagination: true,
      manualSorting: true,
    }),
  }
}
