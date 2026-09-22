import type {
  ReactTable,
  RowData,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import { DataTableSkeletonRows } from "@/components/data-table/components/data-table-state";
import type { ServerTableFeatures } from "@/components/data-table/core/create-server-table-features";
interface DataTableProps<
  TMeta extends object,
  TData extends RowData,
> {
  table: ReactTable<ServerTableFeatures<TMeta>, TData>;
  caption: string;
  isInitialLoading: boolean;
  emptyState: React.ReactNode;
  skeletonRows?: number;
}

export function DataTable<
  TMeta extends object,
  TData extends RowData,
>({
  table,
  caption,
  isInitialLoading,
  emptyState,
  skeletonRows = 5,
}: DataTableProps<TMeta, TData>) {
  const visibleColumnCount = Math.max(
    table.getVisibleLeafColumns().length,
    1,
  );
  const rows = table.getRowModel().rows;
  const hasSortableColumns = table
    .getAllLeafColumns()
    .some((column) => column.getCanSort());

  return (
    <div
      data-slot="data-table"
      className="overflow-hidden rounded-3xl border"
    >
      <Table>
        <TableCaption className="sr-only">
          {caption}
          {hasSortableColumns
            ? ". Os cabeçalhos com botão permitem ordenar os resultados."
            : null}
        </TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isInitialLoading ? (
            <DataTableSkeletonRows
              columns={visibleColumnCount}
              rows={skeletonRows}
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {!isInitialLoading && rows.length === 0 ? (
        <>
          <Separator />
          <div
            className="w-full min-w-0"
            role="status"
            aria-live="polite"
          >
            {emptyState}
          </div>
        </>
      ) : null}
    </div>
  );
}
