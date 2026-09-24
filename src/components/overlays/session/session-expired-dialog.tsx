import { TriangleAlertIcon } from "lucide-react"

import { appCopy } from "@/app/config/app-copy"
import { AppAlertDialog } from "@/components/common/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface SessionExpiredDialogProps {
  isRedirecting?: boolean
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
  isRedirecting = false,
  onSignIn,
  open,
}: SessionExpiredDialogProps) {
  const copy = appCopy.feedback.sessionExpired

  return (
    <AppAlertDialog
      description={copy.description}
      footer={
        <Button
          aria-busy={isRedirecting}
          disabled={isRedirecting}
          onClick={onSignIn}
          type="button"
        >
          {isRedirecting ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : null}
          {isRedirecting ? copy.pendingAction : copy.action}
        </Button>
      }
      media={<TriangleAlertIcon aria-hidden="true" />}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen) {
          eventDetails.cancel()
        }
      }}
      open={open}
      title={copy.title}
    />
  )
}
