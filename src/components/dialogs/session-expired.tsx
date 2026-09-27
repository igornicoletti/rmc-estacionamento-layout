import { AlarmClockOffIcon } from "lucide-react"

import { appCopy } from "@/app/config/app-copy"
import { AppAlertDialog } from "@/components/app/app-alert-dialog"
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
      action={
        <>
          {isPending ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : null}
          {isPending ? copy.pendingAction : copy.action}
        </>
      }
      actionProps={{
        "aria-busy": isPending,
        className: "col-span-2 w-full",
        disabled: isPending,
        onClick: onSignIn,
        type: "button",
      }}
      cancelLabel={null}
      description={copy.description}
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
