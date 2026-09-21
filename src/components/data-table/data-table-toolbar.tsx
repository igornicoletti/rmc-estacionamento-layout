import type { ReactNode } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DataTableToolbarProps {
  actions?: ReactNode;
  children: ReactNode;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function DataTableToolbar({
  actions,
  children,
  hasActiveFilters,
  onClearFilters,
}: DataTableToolbarProps) {
  return (
    <div className="@container/toolbar min-w-0" data-slot="data-table-toolbar">
      <div className="flex min-w-0 flex-col gap-3 @sm/toolbar:flex-row @sm/toolbar:flex-wrap @sm/toolbar:items-center">
        {children}

        {hasActiveFilters ? (
          <Button
            onClick={onClearFilters}
            variant="ghost"
            size="sm"
          >
            <XIcon data-icon="inline-start" aria-hidden="true" />
            Limpar filtros
          </Button>
        ) : null}

        {actions !== undefined && actions !== null ? (
          <div
            className="flex w-full min-w-0 items-center justify-end gap-3 @sm/toolbar:ml-auto @sm/toolbar:w-auto"
            data-slot="data-table-toolbar-actions"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
