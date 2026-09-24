import type { ComponentProps, ReactNode } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type AppSheetSize = "default" | "wide"
type SheetRootProps = ComponentProps<typeof Sheet>

interface AppSheetProps {
  children: ReactNode
  description?: ReactNode
  footer?: ReactNode
  onOpenChange: NonNullable<SheetRootProps["onOpenChange"]>
  open: boolean
  showCloseButton?: boolean
  size?: AppSheetSize
  title: ReactNode
}

/**
 * Sheet controlado e padronizado da aplicação.
 *
 * Usa o close nativo do SheetContent e reserva o espaço restante para um corpo
 * rolável, mantendo header e footer fora da região de scroll.
 */
export function AppSheet({
  children,
  description,
  footer,
  onOpenChange,
  open,
  showCloseButton = true,
  size = "default",
  title,
}: AppSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className={
          size === "wide"
            ? "data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
            : undefined
        }
        showCloseButton={showCloseButton}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>

        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}
