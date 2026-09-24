import type { ComponentProps, ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type AlertDialogRootProps = ComponentProps<typeof AlertDialog>

interface AppAlertDialogProps {
  children?: ReactNode
  defaultOpen?: AlertDialogRootProps["defaultOpen"]
  description?: ReactNode
  footer?: ReactNode
  media?: ReactNode
  onOpenChange?: AlertDialogRootProps["onOpenChange"]
  open?: AlertDialogRootProps["open"]
  size?: ComponentProps<typeof AlertDialogContent>["size"]
  title: ReactNode
}

/**
 * Estrutura compartilhada para diálogos que exigem uma decisão explícita.
 *
 * Ações e conteúdo permanecem injetados pelo consumidor; o wrapper apenas
 * preserva a composição oficial e a estrutura visual comum.
 */
export function AppAlertDialog({
  children,
  defaultOpen,
  description,
  footer,
  media,
  onOpenChange,
  open,
  size = "default",
  title,
}: AppAlertDialogProps) {
  return (
    <AlertDialog
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      open={open}
    >
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          {media ? <AlertDialogMedia>{media}</AlertDialogMedia> : null}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        {children}

        {footer ? <AlertDialogFooter>{footer}</AlertDialogFooter> : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}
