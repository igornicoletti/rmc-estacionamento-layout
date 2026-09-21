import type { PaginationState } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginatedTable {
  state: { pagination: PaginationState };
  getPageCount: () => number;
  getCanPreviousPage: () => boolean;
  getCanNextPage: () => boolean;
  previousPage: () => void;
  nextPage: () => void;
  setPageSize: (size: number) => void;
}

interface DataTablePaginationProps {
  table: PaginatedTable;
  rowCount: number;
  isPlaceholderData?: boolean;
  pageSizes?: readonly number[];
  itemLabel?: { singular: string; plural: string };
}

const DEFAULT_ITEM_LABEL = { singular: "registro", plural: "registros" };
const DEFAULT_PAGE_SIZES = [5, 10, 20] as const;

function normalizePageSizes(pageSizes: readonly number[], currentSize: number) {
  const sizes = Array.from(
    new Set(
      pageSizes.filter(
        (size) => Number.isSafeInteger(size) && size > 0,
      ),
    ),
  );

  if (Number.isSafeInteger(currentSize) && currentSize > 0) {
    sizes.push(currentSize);
  }

  return Array.from(new Set(sizes)).sort((left, right) => left - right);
}

export function DataTablePagination({
  table,
  rowCount,
  isPlaceholderData = false,
  pageSizes = DEFAULT_PAGE_SIZES,
  itemLabel = DEFAULT_ITEM_LABEL,
}: DataTablePaginationProps) {
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = Math.max(table.getPageCount(), 1);
  const pageSizeItems = normalizePageSizes(pageSizes, pageSize).map((size) => ({
    value: String(size),
    label: String(size),
  }));

  return (
    <div
      data-slot="data-table-pagination"
      className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left"
    >
      <p className="text-sm text-muted-foreground">
        {rowCount} {rowCount === 1 ? itemLabel.singular : itemLabel.plural}
      </p>
      <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
        <div
          data-slot="data-table-page-size"
          className="flex items-center justify-center gap-2"
        >
          <span className="text-sm text-muted-foreground">Linhas por página</span>
          <Select
            items={pageSizeItems}
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" aria-label="Linhas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {pageSizeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div
          data-slot="data-table-page-navigation"
          className="flex items-center justify-center gap-2"
        >
          <span className="min-w-24 text-center text-sm">
            Página {pageIndex + 1} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Página anterior"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Próxima página"
            disabled={isPlaceholderData || !table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRightIcon data-icon="inline-start" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
