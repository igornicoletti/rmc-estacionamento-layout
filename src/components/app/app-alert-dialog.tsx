import type { ComponentProps, ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type AlertDialogRootProps = ComponentProps<typeof AlertDialog>

interface AppAlertDialogProps {
  action: ReactNode
  actionProps?: Omit<ComponentProps<typeof AlertDialogAction>, "children">
  cancelLabel?: ReactNode | null
  cancelProps?: Omit<ComponentProps<typeof AlertDialogCancel>, "children">
  children?: ReactNode
  description: ReactNode
  initialFocus?: ComponentProps<typeof AlertDialogContent>["initialFocus"]
  media?: ReactNode
  onOpenChange: NonNullable<AlertDialogRootProps["onOpenChange"]>
  open: boolean
  size?: ComponentProps<typeof AlertDialogContent>["size"]
  title: ReactNode
}

export function AppAlertDialog({
  action,
  actionProps,
  cancelLabel = "Cancelar",
  cancelProps,
  children,
  description,
  initialFocus,
  media,
  onOpenChange,
  open,
  size = "default",
  title,
}: AppAlertDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent initialFocus={initialFocus} size={size}>
        <AlertDialogHeader>
          {media ? <AlertDialogMedia>{media}</AlertDialogMedia> : null}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          {cancelLabel !== null ? (
            <AlertDialogCancel {...cancelProps}>
              {cancelLabel}
            </AlertDialogCancel>
          ) : null}
          <AlertDialogAction {...actionProps}>{action}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
