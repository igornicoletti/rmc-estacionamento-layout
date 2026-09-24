import { Clock3Icon } from "lucide-react"

import { appCopy } from "@/app/config/app-copy"
import { AppAlertDialog } from "@/components/common/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface SessionTimeoutWarningDialogProps {
  isContinuing?: boolean
  isSigningOut?: boolean
  onContinue: () => void
  onSignOut: () => void
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
 * Este componente apenas apresenta remainingSeconds e encaminha as ações.
 */
export function SessionTimeoutWarningDialog({
  isContinuing = false,
  isSigningOut = false,
  onContinue,
  onSignOut,
  open,
  remainingSeconds,
}: SessionTimeoutWarningDialogProps) {
  const copy = appCopy.feedback.sessionTimeoutWarning
  const isPending = isContinuing || isSigningOut

  return (
    <AppAlertDialog
      description={copy.description}
      footer={
        <>
          <Button
            aria-busy={isSigningOut}
            disabled={isPending}
            onClick={onSignOut}
            type="button"
            variant="outline"
          >
            {isSigningOut ? (
              <Spinner aria-hidden="true" data-icon="inline-start" />
            ) : null}
            {isSigningOut ? copy.signingOutAction : copy.signOutAction}
          </Button>

          <Button
            aria-busy={isContinuing}
            disabled={isPending}
            onClick={onContinue}
            type="button"
          >
            {isContinuing ? (
              <Spinner aria-hidden="true" data-icon="inline-start" />
            ) : null}
            {isContinuing ? copy.continuingAction : copy.continueAction}
          </Button>
        </>
      }
      media={<Clock3Icon aria-hidden="true" />}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen) {
          eventDetails.cancel()
        }
      }}
      open={open}
      title={copy.title}
    >
      <output
        aria-label={copy.remainingTime}
        className="block text-center text-2xl font-semibold tabular-nums"
        role="timer"
      >
        {formatRemainingTime(remainingSeconds)}
      </output>
    </AppAlertDialog>
  )
}
