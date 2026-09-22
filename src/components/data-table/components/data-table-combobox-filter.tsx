import { useRef } from "react"
import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/combobox"

export interface DataTableComboboxFilterItem<TValue extends string> {
  group?: string
  label: string
  value: TValue
}

interface DataTableComboboxFilterGroup<TValue extends string> {
  items: DataTableComboboxFilterItem<TValue>[]
  value: string
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

function groupItems<TValue extends string>(
  items: DataTableComboboxFilterItem<TValue>[],
): DataTableComboboxFilterGroup<TValue>[] | null {
  const groups = new Map<string, DataTableComboboxFilterItem<TValue>[]>()

  for (const item of items) {
    if (item.group === undefined) {
      return null
    }

    const groupItems = groups.get(item.group)

    if (groupItems) {
      groupItems.push(item)
    } else {
      groups.set(item.group, [item])
    }
  }

  return Array.from(groups, ([value, groupItems]) => ({
    items: groupItems,
    value,
  }))
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
  const groupedItems = groupItems(availableItems)
  const comboboxItems = groupedItems ?? availableItems
  const renderItem = (item: DataTableComboboxFilterItem<TValue>) => (
    <ComboboxItem className="pr-10" key={item.value} value={item}>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <Badge className="shrink-0" variant="secondary">
        {counts?.[item.value] ?? 0}
      </Badge>
    </ComboboxItem>
  )

  return (
    <Combobox
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.value}
      items={comboboxItems}
      onValueChange={(item) => onValueChange(item?.value)}
      value={selectedItem}
    >
      <div
        className="w-full min-w-0 @sm/toolbar:w-fit @sm/toolbar:min-w-40 @sm/toolbar:max-w-sm @sm/toolbar:flex-none"
        data-slot="data-table-combobox-filter"
      >
        <div className="flex w-full items-center gap-1">
          <div ref={anchorRef} className="min-w-0 flex-1">
            <ComboboxTrigger
              aria-label={ariaLabel}
              render={
                <Button
                  className="w-full min-w-0 justify-between"
                  variant="outline"
                />
              }
            >
              <span className="min-w-0 flex-1 truncate text-left">
                {selectedItem?.label ?? placeholder}
              </span>
            </ComboboxTrigger>
          </div>

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
        className="w-(--anchor-width) min-w-(--anchor-width) max-w-(--anchor-width)"
      >
        <ComboboxInput
          aria-label={`Buscar em ${ariaLabel.toLocaleLowerCase("pt-BR")}`}
          clearAriaLabel="Limpar busca"
          placeholder="Buscar..."
          readOnly={!searchable}
          showClear={searchable}
          showTrigger={false}
        />
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {groupedItems
            ? (group: DataTableComboboxFilterGroup<TValue>, index: number) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  {index > 0 ? <ComboboxSeparator /> : null}
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>{renderItem}</ComboboxCollection>
                </ComboboxGroup>
              )
            : renderItem}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
