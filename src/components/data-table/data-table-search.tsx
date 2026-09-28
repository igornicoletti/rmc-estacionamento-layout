import { SearchIcon, XIcon } from "lucide-react"

import { dataTableContent } from "@/components/data-table/data-table-content"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

interface DataTableSearchProps {
  ariaLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  value: string
}

export function DataTableSearch({
  ariaLabel = dataTableContent.search.defaultAriaLabel,
  disabled = false,
  onChange,
  onClear,
  placeholder = dataTableContent.search.defaultPlaceholder,
  value,
}: DataTableSearchProps) {
  return (
    <InputGroup className="w-full min-w-0 @sm/toolbar:w-80 @sm/toolbar:max-w-md @sm/toolbar:flex-[1_1_20rem]">
      <InputGroupInput
        aria-label={ariaLabel}
        className="text-sm!"
        disabled={disabled}
        inputMode="search"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        role="searchbox"
        type="text"
        value={value}
      />
      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={dataTableContent.search.clear}
            data-testid="data-table-search-clear"
            disabled={disabled}
            onClick={onClear}
            size="icon-xs"
          >
            <XIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
