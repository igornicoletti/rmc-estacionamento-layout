import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DataTableColumnMeta } from "./data-table.types";

interface HideableColumn {
  id: string;
  columnDef: { meta?: DataTableColumnMeta };
  getCanHide: () => boolean;
  getIsVisible: () => boolean;
  toggleVisibility: (visible?: boolean) => void;
}

interface HideableTable {
  getAllLeafColumns: () => HideableColumn[];
}

interface DataTableViewOptionsProps {
  table: HideableTable;
}

export function DataTableViewOptions({
  table,
}: DataTableViewOptionsProps) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  if (columns.length === 0) return null;

  const visibleColumnCount = columns.filter((column) =>
    column.getIsVisible(),
  ).length;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="Colunas"
                  variant="outline"
                  size="icon"
                />
              }
            />
          }
        >
          <SlidersHorizontalIcon data-icon="inline-start" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent role="tooltip">Exibir colunas</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          {columns.map((column) => {
            const label = column.columnDef.meta?.visibilityLabel;

            if (!label) {
              throw new Error(
                `A coluna ocultável "${column.id}" precisa de meta.visibilityLabel.`,
              );
            }

            const isLastVisibleColumn =
              column.getIsVisible() && visibleColumnCount === 1;

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                closeOnClick={false}
                disabled={isLastVisibleColumn}
                aria-label={
                  isLastVisibleColumn
                    ? `${label}, última coluna visível`
                    : label
                }
                onCheckedChange={(checked) => {
                  if (!checked && isLastVisibleColumn) return;
                  column.toggleVisibility(checked);
                }}
              >
                <span>{label}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
