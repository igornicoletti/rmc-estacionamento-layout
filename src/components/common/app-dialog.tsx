import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AppDialogSize = "default" | "wide"
type DialogRootProps = ComponentProps<typeof Dialog>

interface AppDialogProps {
  children: ReactNode
  description?: ReactNode
  footer?: ReactNode
  onOpenChange: NonNullable<DialogRootProps["onOpenChange"]>
  open: boolean
  showCloseButton?: boolean
  size?: AppDialogSize
  title: ReactNode
}

/**
 * Dialog controlado e padronizado da aplicação.
 *
 * Mantém header e footer visíveis e deixa somente o corpo rolar quando o
 * conteúdo ultrapassa a viewport. O close permanece responsabilidade do
 * DialogContent padrão.
 */
export function AppDialog({
  children,
  description,
  footer,
  onOpenChange,
  open,
  showCloseButton = true,
  size = "default",
  title,
}: AppDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-2rem)] overflow-hidden",
          footer
            ? "grid-rows-[auto_minmax(0,1fr)_auto]"
            : "grid-rows-[auto_minmax(0,1fr)]",
          size === "wide" && "sm:max-w-xl",
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto">{children}</div>

        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
