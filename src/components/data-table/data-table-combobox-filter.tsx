import { AppCombobox } from "@/components/app/app-combobox"
import { Badge } from "@/components/ui/badge"

export interface DataTableComboboxFilterItem<TValue extends string> {
  group?: string
  label: string
  value: TValue
}

interface DataTableComboboxFilterProps<TValue extends string> {
  ariaLabel: string
  clearAriaLabel?: string
  counts: ReadonlyMap<TValue, number>
  items: ReadonlyArray<DataTableComboboxFilterItem<TValue>>
  onValueChange: (value: TValue | undefined) => void
  placeholder: string
  value?: TValue
}

export function DataTableComboboxFilter<TValue extends string>({ ariaLabel, clearAriaLabel, counts, items, onValueChange, placeholder, value }: DataTableComboboxFilterProps<TValue>) {
  const available = items.filter((item) => (counts.get(item.value) ?? 0) > 0 || item.value === value)
  return (
    <div className="w-full min-w-0 @sm/toolbar:w-fit @sm/toolbar:min-w-56 @sm/toolbar:max-w-sm @sm/toolbar:flex-none">
      <AppCombobox
        ariaLabel={ariaLabel}
        clearAriaLabel={clearAriaLabel ?? `Limpar ${ariaLabel.toLocaleLowerCase("pt-BR")}`}
        emptyMessage="Nenhum resultado."
        fullWidth
        items={available}
        onValueChange={onValueChange}
        placeholder={placeholder}
        value={value}
      >
        {(item) => <><span className="min-w-0 flex-1 truncate">{item.label}</span><Badge className="ml-auto shrink-0" variant="ghost">{counts.get(item.value) ?? 0}</Badge></>}
      </AppCombobox>
    </div>
  )
}
