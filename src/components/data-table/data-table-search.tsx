import { SearchIcon, XIcon } from "lucide-react"

import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

interface DataTableSearchProps {
  ariaLabel?: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  value: string
}

export function DataTableSearch({
  ariaLabel = dataTableCopy.search.defaultAriaLabel,
  onChange,
  onClear,
  placeholder = dataTableCopy.search.defaultPlaceholder,
  value,
}: DataTableSearchProps) {
  return (
    <InputGroup className="w-full min-w-0 @sm/toolbar:w-80 @sm/toolbar:max-w-md @sm/toolbar:flex-[1_1_20rem]">
      <InputGroupInput
        aria-label={ariaLabel}
        className="text-sm!"
        inputMode="search"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        role="searchbox"
        type="text"
        value={value}
      />
      <InputGroupAddon align="inline-start"><SearchIcon aria-hidden="true" /></InputGroupAddon>
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label={dataTableCopy.search.clear} data-testid="data-table-search-clear" onClick={onClear} size="icon-xs">
            <XIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
