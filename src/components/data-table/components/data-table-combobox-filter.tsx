import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/combobox";

export interface DataTableComboboxFilterItem<TValue extends string> {
  group?: string;
  label: string;
  value: TValue;
}

interface DataTableComboboxFilterGroup<TValue extends string> {
  items: DataTableComboboxFilterItem<TValue>[];
  value: string;
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

function groupItems<TValue extends string>(
  items: ReadonlyArray<DataTableComboboxFilterItem<TValue>>,
): DataTableComboboxFilterGroup<TValue>[] | null {
  if (items.length === 0) {
    return null;
  }

  const groups = new Map<string, DataTableComboboxFilterItem<TValue>[]>();

  for (const item of items) {
    if (item.group === undefined) {
      return null;
    }

    const currentItems = groups.get(item.group);

    if (currentItems) {
      currentItems.push(item);
    } else {
      groups.set(item.group, [item]);
    }
  }

  return Array.from(groups, ([value, groupedItems]) => ({
    items: groupedItems,
    value,
  }));
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
  const selectedItem = items.find((item) => item.value === value) ?? null;
  const availableItems = items.filter(
    (item) =>
      counts === undefined ||
      (counts[item.value] ?? 0) > 0 ||
      item.value === value,
  );
  const groupedItems = groupItems(availableItems);
  const comboboxItems = groupedItems ?? availableItems;
  const renderItem = (item: DataTableComboboxFilterItem<TValue>) => (
    <ComboboxItem key={item.value} value={item}>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {counts !== undefined ? (
        <Badge className="ml-auto shrink-0" variant="ghost">
          {counts[item.value] ?? 0}
        </Badge>
      ) : null}
    </ComboboxItem>
  );

  return (
    <Combobox
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.value}
      items={comboboxItems}
      onValueChange={(item) => onValueChange(item?.value)}
      value={selectedItem}
    >
      <ComboboxInput
        aria-label={ariaLabel}
        className="w-full min-w-0 border-border! bg-background! **:data-[slot=input-group-control]:text-sm! @sm/toolbar:w-fit @sm/toolbar:min-w-56 @sm/toolbar:max-w-sm @sm/toolbar:flex-none dark:bg-transparent!"
        clearAriaLabel={clearAriaLabel}
        placeholder={placeholder}
        showClear
      />

      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {groupedItems
            ? (group: DataTableComboboxFilterGroup<TValue>, index: number) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>{renderItem}</ComboboxCollection>
                  {index < groupedItems.length - 1 ? (
                    <ComboboxSeparator />
                  ) : null}
                </ComboboxGroup>
              )
            : renderItem}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
