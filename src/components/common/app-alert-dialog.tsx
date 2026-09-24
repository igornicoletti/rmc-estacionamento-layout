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
  description: ReactNode
  footer: ReactNode
  media?: ReactNode
  onOpenChange: NonNullable<AlertDialogRootProps["onOpenChange"]>
  open: boolean
  size?: ComponentProps<typeof AlertDialogContent>["size"]
  title: ReactNode
}

/**
 * Estrutura controlada para decisões que exigem resposta explícita.
 *
 * Exige descrição e footer para preservar contexto acessível e uma resposta
 * explícita. Conteúdo adicional e media permanecem opcionais.
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
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>{footer}</AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
