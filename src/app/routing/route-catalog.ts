export type AppRouteAvailability = "available" | "reserved"
export type AppRouteModule =
  | "audit"
  | "permissions"
  | "placeholder"
  | "profile"
  | "users"

export interface AppPageDefinition {
  availability: AppRouteAvailability
  id:
    | "account-security"
    | "audit"
    | "clients"
    | "dashboard"
    | "notifications"
    | "permissions"
    | "prices"
    | "profile"
    | "reports"
    | "rules"
    | "units"
    | "users"
    | "virtual-yard"
  module: AppRouteModule
  path: string
  segment: string | null
  subtitle: string
  title: string
}

function definePage(
  page: Omit<AppPageDefinition, "path">,
): AppPageDefinition {
  return {
    ...page,
    path: page.segment === null ? "/" : `/${page.segment}`,
  }
}

export const appRouteCatalog = [
  definePage({
    availability: "reserved",
    id: "dashboard",
    segment: null,
    module: "placeholder",
    title: "Dashboard",
    subtitle: "Indicadores e estado operacional do estacionamento.",
  }),
  definePage({
    availability: "reserved",
    id: "virtual-yard",
    segment: "patio-virtual",
    module: "placeholder",
    title: "Pátio virtual",
    subtitle: "Ocupação, permanências e movimentações do pátio.",
  }),
  definePage({
    availability: "reserved",
    id: "reports",
    segment: "relatorios",
    module: "placeholder",
    title: "Relatórios",
    subtitle: "Análises e relatórios da operação do estacionamento.",
  }),
  definePage({
    availability: "reserved",
    id: "units",
    segment: "unidades",
    module: "placeholder",
    title: "Unidades",
    subtitle: "Consulta e gestão das unidades da operação.",
  }),
  definePage({
    availability: "reserved",
    id: "clients",
    segment: "clientes",
    module: "placeholder",
    title: "Clientes",
    subtitle: "Consulta e gestão dos clientes da operação.",
  }),
  definePage({
    availability: "reserved",
    id: "prices",
    segment: "precos",
    module: "placeholder",
    title: "Preços",
    subtitle: "Preços, faixas e critérios da operação.",
  }),
  definePage({
    availability: "reserved",
    id: "rules",
    segment: "regras",
    module: "placeholder",
    title: "Regras",
    subtitle: "Regras e critérios dos fluxos do estacionamento.",
  }),
  definePage({
    availability: "available",
    id: "users",
    segment: "usuarios",
    module: "users",
    title: "Usuários",
    subtitle: "Gerencie usuários, status e vínculos de acesso.",
  }),
  definePage({
    availability: "reserved",
    id: "notifications",
    segment: "notificacoes",
    module: "placeholder",
    title: "Notificações",
    subtitle: "Alertas e atualizações relevantes da operação.",
  }),
  definePage({
    availability: "available",
    id: "profile",
    segment: "perfil",
    module: "profile",
    title: "Meu perfil",
    subtitle: "Consulte as informações do seu perfil.",
  }),
  definePage({
    availability: "reserved",
    id: "account-security",
    segment: "seguranca-da-conta",
    module: "placeholder",
    title: "Segurança da conta",
    subtitle: "Opções de segurança e proteção da conta.",
  }),
  definePage({
    availability: "available",
    id: "permissions",
    segment: "permissoes",
    module: "permissions",
    title: "Permissões",
    subtitle: "Consulte permissões e abrangências de acesso por perfil.",
  }),
  definePage({
    availability: "reserved",
    id: "audit",
    segment: "auditoria",
    module: "audit",
    title: "Auditoria",
    subtitle: "Consulte eventos administrativos e de segurança.",
  }),
] as const satisfies readonly AppPageDefinition[]

export type AppRouteId = (typeof appRouteCatalog)[number]["id"]

export function getAppPage(id: AppRouteId) {
  const page = appRouteCatalog.find((candidate) => candidate.id === id)

  if (!page) {
    throw new Error(`UNKNOWN_APP_ROUTE:${id}`)
  }

  return page
}
