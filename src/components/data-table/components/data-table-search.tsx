import { SearchIcon, XIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

interface DataTableSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  onSubmit?: () => void
  placeholder?: string
  ariaLabel?: string
}

export function DataTableSearch({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Buscar registros...",
  ariaLabel = "Buscar registros",
}: DataTableSearchProps) {
  return (
    <InputGroup className="w-full min-w-0 @sm/toolbar:w-80 @sm/toolbar:max-w-md @sm/toolbar:flex-[1_1_20rem]">
      <InputGroupInput
        className="text-sm"
        type="text"
        role="searchbox"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return
          event.preventDefault()
          onSubmit?.()
        }}
      />
      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Limpar busca"
            onClick={onClear}
          >
            <XIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
