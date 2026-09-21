import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

interface SortableColumn {
  getCanSort: () => boolean
  getIsSorted: () => false | "asc" | "desc"
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined
}

interface DataTableColumnHeaderProps {
  column: SortableColumn
  title: string
}

export function DataTableColumnHeader({ column, title }: DataTableColumnHeaderProps) {
  if (!column.getCanSort()) {
    return title
  }

  const sorted = column.getIsSorted()
  const SortIcon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon

  return (
    <button
      type="button"
      className="-m-2 flex cursor-pointer items-center gap-1 rounded-md p-2 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-label={`Ordenar por ${title}`}
      onClick={column.getToggleSortingHandler()}
    >
      <span>{title}</span>
      <SortIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  )
}
