import type { ComponentProps, ReactNode } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type SheetRootProps = ComponentProps<typeof Sheet>;

interface AppSheetProps {
  children: ReactNode;
  closeLabel?: ReactNode | null;
  description?: ReactNode;
  footer?: ReactNode;
  onOpenChange: NonNullable<SheetRootProps["onOpenChange"]>;
  open: boolean;
  title: ReactNode;
}

export function AppSheet({
  children,
  closeLabel = "Cancelar",
  description,
  footer,
  onOpenChange,
  open,
  title,
}: AppSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="no-scrollbar overflow-y-auto px-4 py-2">{children}</div>

        {footer || closeLabel !== null ? (
          <SheetFooter>
            {closeLabel !== null ? (
              <SheetClose render={<Button variant="outline" />}>
                {closeLabel}
              </SheetClose>
            ) : null}
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
