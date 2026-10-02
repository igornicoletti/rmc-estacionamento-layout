import type { ComponentProps, ReactNode } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type DialogRootProps = ComponentProps<typeof Dialog>

interface AppDialogProps {
  children: ReactNode
  closeLabel?: ReactNode | null
  description?: ReactNode
  footer?: ReactNode
  onOpenChange: NonNullable<DialogRootProps["onOpenChange"]>
  open: boolean
  title: ReactNode
}

export function AppDialog({
  children,
  closeLabel = "Cancelar",
  description,
  footer,
  onOpenChange,
  open,
  title,
}: AppDialogProps) {
  const hasFooter = Boolean(footer) || closeLabel !== null

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={hasFooter
          ? "max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]"
          : "max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)]"}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="-mx-4 min-h-0 overflow-y-auto px-4 py-2">
          {children}
        </div>

        {hasFooter ? (
          <DialogFooter>
            {closeLabel !== null ? (
              <DialogClose render={<Button variant="outline" />}>
                {closeLabel}
              </DialogClose>
            ) : null}
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
