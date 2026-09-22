import { Building2Icon, ChevronsUpDownIcon } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"

export interface SidebarUnitOption {
  id: string
  name: string
}

export type SidebarUnitsStatus = "loading" | "ready" | "unavailable"

interface SidebarUnitsSwitcherProps {
  onValueChange: (unitId: string) => void
  status?: SidebarUnitsStatus
  units: readonly SidebarUnitOption[]
  value: string | undefined
}

function SidebarUnitIdentity({ unitName }: { unitName: string }) {
  return (
    <>
      <Building2Icon aria-hidden="true" />
      <span className="truncate">{unitName}</span>
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

  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton aria-busy="true" disabled>
            <SidebarUnitIdentity unitName="Carregando unidades" />
            <Spinner aria-hidden="true" className="ml-auto" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (status === "unavailable") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled>
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
          <SidebarMenuButton disabled>
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
            className="hover:bg-transparent"
            render={<div />}
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
              />
            }
          >
            <SidebarUnitIdentity unitName={activeUnit.name} />
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent side={isMobile ? "bottom" : "right"}>
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
