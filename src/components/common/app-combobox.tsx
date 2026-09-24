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
  className?: string
  clearAriaLabel?: string
  disabled?: boolean
  emptyMessage?: ReactNode
  items: ReadonlyArray<AppComboboxItem<TValue>>
  onValueChange: (value: TValue | undefined) => void
  placeholder: string
  showClear?: boolean
  showGroupSeparators?: boolean
  value?: TValue
}

function groupItems<TValue extends string>(
  items: ReadonlyArray<AppComboboxItem<TValue>>,
): AppComboboxGroup<TValue>[] | null {
  const groups = new Map<string, AppComboboxItem<TValue>[]>()

  for (const item of items) {
    if (item.group === undefined) {
      return null
    }

    const currentItems = groups.get(item.group)

    if (currentItems) {
      currentItems.push(item)
    } else {
      groups.set(item.group, [item])
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
 * O conteúdo visual de cada opção continua extensível por children.
 */
export function AppCombobox<TValue extends string>({
  ariaLabel,
  children,
  className,
  clearAriaLabel = "Limpar seleção",
  disabled = false,
  emptyMessage = "Nenhum resultado.",
  items,
  onValueChange,
  placeholder,
  showClear = true,
  showGroupSeparators = false,
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
        className={className}
        clearAriaLabel={clearAriaLabel}
        disabled={disabled}
        placeholder={placeholder}
        showClear={showClear}
      />

      <ComboboxContent aria-label={ariaLabel}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {groupedItems
            ? (group: AppComboboxGroup<TValue>, index: number) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>{renderItem}</ComboboxCollection>
                  {showGroupSeparators &&
                  index < groupedItems.length - 1 ? (
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
