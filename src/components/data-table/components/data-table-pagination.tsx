import type { PaginationState } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { dataTableCopy } from "@/components/data-table/data-table.copy";
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
  firstPage: () => void;
  lastPage: () => void;
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

const DEFAULT_ITEM_LABEL = dataTableCopy.pagination.defaultItem;
const DEFAULT_PAGE_SIZES = [10, 25, 50, 100] as const;

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
      data-testid="data-table-pagination"
      className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left"
    >
      <p className="text-sm text-muted-foreground">
        {rowCount} {rowCount === 1 ? itemLabel.singular : itemLabel.plural}
      </p>
      <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
        <div
          data-testid="data-table-page-size"
          className="flex items-center justify-center gap-2"
        >
          <span className="text-sm text-muted-foreground">{dataTableCopy.pagination.rowsPerPage}</span>
          <Select
            items={pageSizeItems}
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" aria-label={dataTableCopy.pagination.rowsPerPage}>
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
          data-testid="data-table-page-navigation"
          className="flex items-center justify-center gap-2"
        >
          <span className="min-w-24 text-center text-sm">
            {dataTableCopy.pagination.page} {pageIndex + 1} {dataTableCopy.pagination.of} {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              data-testid="data-table-page-first"
              variant="outline"
              size="icon-sm"
              aria-label={dataTableCopy.pagination.first}
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.firstPage()}
            >
              <ChevronsLeftIcon data-icon="inline-start" aria-hidden="true" />
            </Button>
            <Button
              data-testid="data-table-page-previous"
              variant="outline"
              size="icon-sm"
              aria-label={dataTableCopy.pagination.previous}
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
            </Button>
            <Button
              data-testid="data-table-page-next"
              variant="outline"
              size="icon-sm"
              aria-label={dataTableCopy.pagination.next}
              disabled={isPlaceholderData || !table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRightIcon data-icon="inline-start" aria-hidden="true" />
            </Button>
            <Button
              data-testid="data-table-page-last"
              variant="outline"
              size="icon-sm"
              aria-label={dataTableCopy.pagination.last}
              disabled={isPlaceholderData || !table.getCanNextPage()}
              onClick={() => table.lastPage()}
            >
              <ChevronsRightIcon data-icon="inline-start" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
