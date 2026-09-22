import { useRef } from "react"
import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"

export interface DataTableComboboxFilterItem<TValue extends string> {
  label: string
  value: TValue
}

interface DataTableComboboxFilterProps<TValue extends string> {
  ariaLabel: string
  counts?: Partial<Record<TValue, number>>
  emptyMessage?: string
  items: ReadonlyArray<DataTableComboboxFilterItem<TValue>>
  onValueChange: (value: TValue | undefined) => void
  placeholder: string
  searchable?: boolean
  value?: TValue
}

export function DataTableComboboxFilter<TValue extends string>({
  ariaLabel,
  counts,
  emptyMessage = "Nenhum resultado.",
  items,
  onValueChange,
  placeholder,
  searchable = true,
  value,
}: DataTableComboboxFilterProps<TValue>) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const selectedItem = items.find((item) => item.value === value) ?? null
  const availableItems = items.filter(
    (item) =>
      counts === undefined ||
      (counts[item.value] ?? 0) > 0 ||
      item.value === value,
  )

  return (
    <Combobox
      itemToStringValue={(item) => item.label}
      items={availableItems}
      onValueChange={(item) => onValueChange(item?.value)}
      value={selectedItem}
    >
      <div
        ref={anchorRef}
        className="w-full min-w-0 @sm/toolbar:w-fit @sm/toolbar:min-w-40 @sm/toolbar:max-w-sm @sm/toolbar:flex-none"
        data-slot="data-table-combobox-filter"
      >
        <div className="flex w-full items-center gap-1">
          <ComboboxTrigger
            aria-label={ariaLabel}
            render={<Button className="flex-1 justify-between" variant="outline" />}
          >
            {selectedItem?.label ?? placeholder}
          </ComboboxTrigger>
          {selectedItem ? (
            <Button
              aria-label={`Limpar ${ariaLabel.toLocaleLowerCase("pt-BR")}`}
              onClick={() => onValueChange(undefined)}
              size="icon"
              variant="outline"
            >
              <XIcon aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
      <ComboboxContent
        anchor={anchorRef}
        aria-label={ariaLabel}
        className="w-max min-w-[max(var(--anchor-width),9rem)] max-w-(--available-width) data-[chips=true]:min-w-[max(var(--anchor-width),9rem)]"
      >
        <ComboboxInput
          aria-label={`Buscar em ${ariaLabel.toLocaleLowerCase("pt-BR")}`}
          placeholder="Buscar..."
          readOnly={!searchable}
          showClear
        />
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: DataTableComboboxFilterItem<TValue>) => (
            <ComboboxItem className="pr-10" key={item.value} value={item}>
              <span className="min-w-0 flex-1 whitespace-nowrap">
                {item.label}
              </span>
              <Badge className="shrink-0" variant="secondary">
                {counts?.[item.value] ?? 0}
              </Badge>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
