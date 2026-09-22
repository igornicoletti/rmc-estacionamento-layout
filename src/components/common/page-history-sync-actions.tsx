import { HistoryIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface PageHistorySyncActionsProps {
  onHistory?: () => void
  onSync?: () => void
}

export function PageHistorySyncActions({
  onHistory,
  onSync,
}: PageHistorySyncActionsProps) {
  return (
    <>
      <Button onClick={onHistory} type="button" variant="outline">
        <HistoryIcon aria-hidden="true" data-icon="inline-start" />
        Histórico
      </Button>
      <Button onClick={onSync} type="button">
        <RefreshCwIcon aria-hidden="true" data-icon="inline-start" />
        Sincronizar
      </Button>
    </>
  )
}
