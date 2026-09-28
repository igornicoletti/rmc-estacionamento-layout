import { unitErpFixture } from "@/mocks/mock-units-fixtures"
import { mapErpUnits } from "@/features/units/mapping/units-mapper"

export const unitsQueryKeys = {
  units: ["preview-data", "erp-units"] as const,
}

export function loadDemoUnits() {
  return mapErpUnits(unitErpFixture)
}
