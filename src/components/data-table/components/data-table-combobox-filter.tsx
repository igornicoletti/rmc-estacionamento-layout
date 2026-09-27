import { AppCombobox } from "@/components/app/app-combobox";
import { Badge } from "@/components/ui/badge";

export interface DataTableComboboxFilterItem<TValue extends string> {
  group?: string;
  label: string;
  value: TValue;
}

interface DataTableComboboxFilterProps<TValue extends string> {
  ariaLabel: string;
  clearAriaLabel?: string;
  counts?: Partial<Record<TValue, number>>;
  emptyMessage?: string;
  items: ReadonlyArray<DataTableComboboxFilterItem<TValue>>;
  onValueChange: (value: TValue | undefined) => void;
  placeholder: string;
  value?: TValue;
}

export function DataTableComboboxFilter<TValue extends string>({
  ariaLabel,
  clearAriaLabel = `Limpar ${ariaLabel.toLocaleLowerCase("pt-BR")}`,
  counts,
  emptyMessage = "Nenhum resultado.",
  items,
  onValueChange,
  placeholder,
  value,
}: DataTableComboboxFilterProps<TValue>) {
  const availableItems = items.filter(
    (item) =>
      counts === undefined ||
      (counts[item.value] ?? 0) > 0 ||
      item.value === value,
  );

  return (
    <div className="w-full min-w-0 @sm/toolbar:w-fit @sm/toolbar:min-w-56 @sm/toolbar:max-w-sm @sm/toolbar:flex-none">
      <AppCombobox
        ariaLabel={ariaLabel}
        clearAriaLabel={clearAriaLabel}
        emptyMessage={emptyMessage}
        fullWidth
        items={availableItems}
        onValueChange={onValueChange}
        placeholder={placeholder}
        value={value}
      >
        {(item) => (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {counts !== undefined ? (
              <Badge className="ml-auto shrink-0" variant="ghost">
                {counts[item.value] ?? 0}
              </Badge>
            ) : null}
          </>
        )}
      </AppCombobox>
    </div>
  );
}
