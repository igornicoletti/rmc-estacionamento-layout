import { ArrowLeftIcon, HistoryIcon, RefreshCwIcon } from "lucide-react"
import { Link } from "react-router"

import { appCopy } from "@/app/config/app-copy"
import { Button, buttonVariants } from "@/components/ui/button"

interface PageSyncHistoryActionsProps {
  backTo?: string
  onHistory?: () => void
  onSynchronize?: () => void
}

export function PageSyncHistoryActions({
  backTo,
  onHistory,
  onSynchronize,
}: PageSyncHistoryActionsProps) {
  return (
    <>
      {backTo ? (
        <Link className={buttonVariants({ variant: "outline" })} to={backTo}>
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          {appCopy.pageActions.back}
        </Link>
      ) : null}

      <Button
        disabled={!onHistory}
        onClick={onHistory}
        type="button"
        variant="outline"
      >
        <HistoryIcon aria-hidden="true" data-icon="inline-start" />
        {appCopy.pageActions.history}
      </Button>

      <Button
        disabled={!onSynchronize}
        onClick={onSynchronize}
        type="button"
      >
        <RefreshCwIcon aria-hidden="true" data-icon="inline-start" />
        {appCopy.pageActions.synchronize}
      </Button>
    </>
  )
}
