import type { DemoUserRole, DemoUserStatus } from "./users.schema"

export const USER_ROLE_OPTIONS: ReadonlyArray<{
  value: DemoUserRole
  label: string
}> = [
  { value: "administrator", label: "Administrador" },
  { value: "manager", label: "Gestor" },
  { value: "operator", label: "Operador" },
]

export const USER_ROLE_LABELS: Record<DemoUserRole, string> = {
  administrator: "Administrador",
  manager: "Gestor",
  operator: "Operador",
}

export const USER_STATUS_OPTIONS: ReadonlyArray<{
  value: DemoUserStatus
  label: string
}> = [
  { value: "active", label: "Ativo" },
  { value: "invited", label: "Convidado" },
  { value: "suspended", label: "Suspenso" },
]

export const USER_STATUS_LABELS: Record<DemoUserStatus, string> = {
  active: "Ativo",
  invited: "Convidado",
  suspended: "Suspenso",
}

export const USER_STATUS_VARIANTS: Record<
  DemoUserStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  invited: "secondary",
  suspended: "outline",
}
