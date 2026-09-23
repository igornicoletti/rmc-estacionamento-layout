import { XIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface AppSheetProps {
  children: ReactNode
  description: ReactNode
  footer?: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
  title: ReactNode
}

export function AppSheet({
  children,
  description,
  footer,
  onOpenChange,
  open,
  title,
}: AppSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <SheetClose
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
        </SheetClose>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>

        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}
