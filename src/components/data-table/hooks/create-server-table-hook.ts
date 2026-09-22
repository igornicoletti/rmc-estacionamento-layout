import { createTableHook } from "@tanstack/react-table"

import { createServerTableFeatures } from "@/components/data-table/core/create-server-table-features"

export function createServerTableHook<TMeta extends object>() {
  const features = createServerTableFeatures<TMeta>()

  return {
    features,
    ...createTableHook({
      features,
      enableMultiSort: false,
      manualFiltering: true,
      manualPagination: true,
      manualSorting: true,
    }),
  }
}
