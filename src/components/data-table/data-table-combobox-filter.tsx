import { useRef } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

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
        <ComboboxInput
          aria-label={ariaLabel}
          className="w-full"
          clearAriaLabel={`Limpar ${ariaLabel.toLocaleLowerCase("pt-BR")}`}
          placeholder={placeholder}
          readOnly={!searchable}
          showClear
        />
      </div>
      <ComboboxContent
        anchor={anchorRef}
        aria-label={ariaLabel}
        className="w-max min-w-[max(var(--anchor-width),9rem)] max-w-(--available-width) data-[chips=true]:min-w-[max(var(--anchor-width),9rem)]"
      >
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: DataTableComboboxFilterItem<TValue>) => (
            <ComboboxItem className="pr-10" key={item.value} value={item}>
              <span className="min-w-0 flex-1 whitespace-nowrap">
                {item.label}
              </span>
              <Badge className="shrink-0 tabular-nums" variant="secondary">
                {counts?.[item.value] ?? 0}
              </Badge>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
