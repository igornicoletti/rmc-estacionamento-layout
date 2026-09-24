import { unitErpFixture } from "@/pages/units/data/unit-erp.fixture"
import { mapErpUnits } from "@/pages/units/model/unit-mapper"

export const unitPreviewQueryKeys = {
  units: ["preview-data", "erp-units"] as const,
}

export function loadPreviewUnits() {
  return mapErpUnits(unitErpFixture)
}
