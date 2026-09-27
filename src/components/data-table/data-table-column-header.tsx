import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

interface SortableColumn {
  getCanSort: () => boolean
  getIsSorted: () => false | "asc" | "desc"
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined
}

export function DataTableColumnHeader({ column, title }: { column: SortableColumn; title: string }) {
  if (!column.getCanSort()) return title

  const direction = column.getIsSorted()
  const Icon = direction === "asc" ? ArrowUpIcon : direction === "desc" ? ArrowDownIcon : ArrowUpDownIcon

  return (
    <button
      aria-label={`Ordenar por ${title}`}
      className="-m-2 flex cursor-pointer items-center gap-1 rounded-md p-2 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      onClick={column.getToggleSortingHandler()}
      type="button"
    >
      {title}
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
