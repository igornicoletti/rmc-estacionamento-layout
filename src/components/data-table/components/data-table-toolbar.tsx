import type { ReactNode } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dataTableCopy } from "@/components/data-table/data-table.copy";

interface DataTableToolbarProps {
  actions?: ReactNode;
  children: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function DataTableToolbar({
  actions,
  children,
  activeFilterCount,
  onClearFilters,
}: DataTableToolbarProps) {
  return (
    <div className="@container/toolbar min-w-0" data-slot="data-table-toolbar">
      <div className="flex min-w-0 flex-col gap-3 @sm/toolbar:flex-row @sm/toolbar:flex-wrap @sm/toolbar:items-center">
        {children}

        {activeFilterCount >= 2 ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label={dataTableCopy.empty.clearFilters}
                  onClick={onClearFilters}
                  size="icon"
                  variant="ghost"
                />
              }
            >
              <XIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent role="tooltip">
              {dataTableCopy.empty.clearFilters}
            </TooltipContent>
          </Tooltip>
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
