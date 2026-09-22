import { ChevronsUpDownIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export interface SidebarUnitOption {
  id: string
  name: string
}

export type SidebarUnitsStatus = "ready" | "unavailable"

interface SidebarUnitsSwitcherProps {
  onValueChange: (unitId: string) => void
  status?: SidebarUnitsStatus
  units: readonly SidebarUnitOption[]
  value: string | undefined
}

function SidebarUnitIdentity({ unitName }: { unitName: string }) {
  return (
    <>
      <div className="flex aspect-square size-8 items-center justify-center">
        <img alt="" className="h-full" src="/favicon.svg" />
      </div>

      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium text-foreground">
          Rede Monte Carlo
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {unitName}
        </span>
      </div>
    </>
  )
}

export function SidebarUnitsSwitcher({
  onValueChange,
  status = "ready",
  units,
  value,
}: SidebarUnitsSwitcherProps) {
  const { isMobile } = useSidebar()
  const activeUnit = units.find((unit) => unit.id === value) ?? units[0]

  const handleValueChange = (unitId: unknown) => {
    if (typeof unitId === "string" && units.some((unit) => unit.id === unitId)) {
      onValueChange(unitId)
    }
  }

  if (status === "unavailable") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            aria-label="Unidades indisponíveis"
            disabled
            size="lg"
          >
            <SidebarUnitIdentity unitName="Unidades indisponíveis" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeUnit) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            aria-label="Nenhuma unidade disponível"
            disabled
            size="lg"
          >
            <SidebarUnitIdentity unitName="Nenhuma unidade disponível" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (units.length === 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="hover:bg-transparent active:bg-transparent"
            render={<div />}
            size="lg"
          >
            <SidebarUnitIdentity unitName={activeUnit.name} />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                aria-label={`Selecionar unidade. Unidade atual: ${activeUnit.name}`}
                className="hover:bg-transparent active:bg-transparent data-open:bg-transparent data-open:hover:bg-transparent"
                size="lg"
              />
            }
          >
            <SidebarUnitIdentity unitName={activeUnit.name} />

            <ChevronsUpDownIcon
              aria-hidden="true"
              className="ml-auto text-muted-foreground"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuRadioGroup
              onValueChange={handleValueChange}
              value={activeUnit.id}
            >
              {units.map((unit) => (
                <DropdownMenuRadioItem key={unit.id} value={unit.id}>
                  {unit.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
