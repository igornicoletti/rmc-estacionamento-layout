import { AlarmClockOffIcon, LogInIcon } from "lucide-react"

import { appCopy } from "@/app/config/app-copy"
import { AppAlertDialog } from "@/components/common/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface SessionExpiredDialogProps {
  isPending?: boolean
  onSignIn: () => void
  open: boolean
}

/**
 * Informa que a sessão já foi encerrada por inatividade.
 *
 * O componente não restaura autenticação nem navega por conta própria; apenas
 * encaminha a ação para o escopo responsável pela sessão.
 */
export function SessionExpiredDialog({
  isPending = false,
  onSignIn,
  open,
}: SessionExpiredDialogProps) {
  const copy = appCopy.feedback.sessionExpired

  return (
    <AppAlertDialog
      description={copy.description}
      footer={
        <div className="col-span-2 flex justify-center">
          <Button
            aria-busy={isPending}
            disabled={isPending}
            onClick={onSignIn}
            type="button"
          >
            {isPending ? (
              <Spinner aria-hidden="true" data-icon="inline-start" />
            ) : (
              <LogInIcon aria-hidden="true" data-icon="inline-start" />
            )}
            {isPending ? copy.pendingAction : copy.action}
          </Button>
        </div>
      }
      media={<AlarmClockOffIcon aria-hidden="true" />}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen) {
          eventDetails.cancel()
        }
      }}
      open={open}
      size="sm"
      title={copy.title}
    />
  )
}
