import { XIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
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
  defaultOpen?: DialogRootProps["defaultOpen"]
  description?: ReactNode
  footer?: ReactNode
  onOpenChange?: DialogRootProps["onOpenChange"]
  open?: DialogRootProps["open"]
  showCloseButton?: boolean
  size?: AppDialogSize
  title: ReactNode
}

/**
 * Dialog padronizado da aplicação.
 *
 * Centraliza header, corpo rolável, footer, fechamento e largura. Regras de
 * negócio e o conteúdo do escopo são fornecidos por children e pelos slots.
 */
export function AppDialog({
  children,
  defaultOpen,
  description,
  footer,
  onOpenChange,
  open,
  showCloseButton = true,
  size = "default",
  title,
}: AppDialogProps) {
  return (
    <Dialog
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogContent
        className={size === "wide" ? "sm:max-w-xl" : undefined}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {showCloseButton ? (
          <DialogClose
            aria-label="Fechar"
            render={
              <Button
                className="absolute top-4 right-4 bg-secondary"
                size="icon-sm"
                type="button"
                variant="ghost"
              />
            }
          >
            <XIcon aria-hidden="true" />
          </DialogClose>
        ) : null}

        <div className="-mx-4 max-h-[50vh] overflow-y-auto px-4">
          {children}
        </div>

        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
