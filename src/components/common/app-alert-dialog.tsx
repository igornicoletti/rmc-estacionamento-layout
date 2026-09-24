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
  description?: ReactNode
  footer?: ReactNode
  media?: ReactNode
  onOpenChange: NonNullable<AlertDialogRootProps["onOpenChange"]>
  open: boolean
  size?: ComponentProps<typeof AlertDialogContent>["size"]
  title: ReactNode
}

/**
 * Estrutura controlada para decisões que exigem resposta explícita.
 *
 * O wrapper preserva a composição do AlertDialog e recebe conteúdo, media e
 * ações por slots, sem incorporar regras de negócio.
 */
export function AppAlertDialog({
  children,
  description,
  footer,
  media,
  onOpenChange,
  open,
  size = "default",
  title,
}: AppAlertDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
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
