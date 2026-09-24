import { ClockAlertIcon } from "lucide-react"
import { useRef } from "react"

import { appCopy } from "@/app/config/app-copy"
import { AppAlertDialog } from "@/components/common/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface SessionTimeoutWarningDialogProps {
  isPending?: boolean
  onContinue: () => void
  open: boolean
  remainingSeconds: number
}

function formatRemainingTime(value: number) {
  const totalSeconds = Number.isFinite(value)
    ? Math.max(0, Math.ceil(value))
    : 0
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

/**
 * Aviso visual de expiração iminente da sessão.
 *
 * A política de inatividade e a contagem pertencem ao escopo de sessão.
 * Este componente apenas apresenta remainingSeconds e encaminha a continuidade.
 */
export function SessionTimeoutWarningDialog({
  isPending = false,
  onContinue,
  open,
  remainingSeconds,
}: SessionTimeoutWarningDialogProps) {
  const copy = appCopy.feedback.sessionTimeoutWarning
  const continueButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <AppAlertDialog
      description={copy.description}
      footer={
        <Button
          aria-busy={isPending}
          className="col-span-2 w-full"
          disabled={isPending}
          onClick={onContinue}
          ref={continueButtonRef}
          type="button"
        >
          {isPending ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : null}
          {isPending ? copy.continuingAction : copy.continueAction}
        </Button>
      }
      initialFocus={continueButtonRef}
      media={<ClockAlertIcon aria-hidden="true" />}
      onOpenChange={(nextOpen, eventDetails) => {
        if (nextOpen) {
          return
        }

        eventDetails.cancel()

        if (eventDetails.reason === "escape-key" && !isPending) {
          onContinue()
        }
      }}
      open={open}
      size="sm"
      title={copy.title}
    >
      <div className="flex justify-center">
        <div className="min-w-40 rounded-2xl border bg-muted/40 px-5 py-4 text-center">
          <div
            aria-label={copy.remainingTime}
            className="text-3xl font-semibold tracking-tight tabular-nums"
            role="timer"
          >
            {formatRemainingTime(remainingSeconds)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.remainingTime}
          </p>
        </div>
      </div>
    </AppAlertDialog>
  )
}
