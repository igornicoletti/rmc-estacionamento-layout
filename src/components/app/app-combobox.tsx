import type { ReactNode } from "react"

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
} from "@/components/ui/combobox"

export interface AppComboboxItem<TValue extends string> {
  group?: string
  label: string
  value: TValue
}

interface AppComboboxGroup<TValue extends string> {
  items: AppComboboxItem<TValue>[]
  value: string
}

interface AppComboboxItemState {
  selected: boolean
}

interface AppComboboxProps<TValue extends string> {
  ariaLabel: string
  children?: (
    item: AppComboboxItem<TValue>,
    state: AppComboboxItemState,
  ) => ReactNode
  clearAriaLabel?: string
  disabled?: boolean
  emptyMessage?: ReactNode
  fullWidth?: boolean
  items: ReadonlyArray<AppComboboxItem<TValue>>
  onValueChange: (value: TValue | undefined) => void
  placeholder: string
  showClear?: boolean
  value?: TValue
}

function groupItems<TValue extends string>(
  items: ReadonlyArray<AppComboboxItem<TValue>>,
): AppComboboxGroup<TValue>[] | null {
  if (
    items.length === 0 ||
    items.some((item) => item.group === undefined)
  ) {
    return null
  }

  const groups = new Map<string, AppComboboxItem<TValue>[]>()

  for (const item of items) {
    const group = item.group

    if (group === undefined) {
      continue
    }

    const currentItems = groups.get(group)

    if (currentItems) {
      currentItems.push(item)
    } else {
      groups.set(group, [item])
    }
  }

  return Array.from(groups, ([value, groupedItems]) => ({
    items: groupedItems,
    value,
  }))
}

/**
 * Combobox de seleção simples da aplicação.
 *
 * Centraliza input pesquisável, limpeza, estado vazio e agrupamento opcional.
 * Listas totalmente agrupadas seguem a composição oficial com separadores;
 * listas sem group permanecem planas.
 */
export function AppCombobox<TValue extends string>({
  ariaLabel,
  children,
  clearAriaLabel = "Limpar seleção",
  disabled = false,
  emptyMessage = "Nenhum resultado.",
  fullWidth = false,
  items,
  onValueChange,
  placeholder,
  showClear = true,
  value,
}: AppComboboxProps<TValue>) {
  const selectedItem = items.find((item) => item.value === value) ?? null
  const groupedItems = groupItems(items)
  const comboboxItems = groupedItems ?? items

  const renderItem = (item: AppComboboxItem<TValue>) => (
    <ComboboxItem key={item.value} value={item}>
      {children
        ? children(item, { selected: item.value === value })
        : item.label}
    </ComboboxItem>
  )

  return (
    <Combobox
      disabled={disabled}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.value}
      items={comboboxItems}
      onValueChange={(item) => onValueChange(item?.value)}
      value={selectedItem}
    >
      <ComboboxInput
        aria-label={ariaLabel}
        className={fullWidth ? "w-full" : undefined}
        clearAriaLabel={clearAriaLabel}
        disabled={disabled}
        placeholder={placeholder}
        showClear={showClear}
      />

      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {groupedItems
            ? (group: AppComboboxGroup<TValue>, index: number) => (
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
  )
}
