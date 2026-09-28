// Paths, route IDs and browser metadata only; UI content belongs to its domain.
const clientsPath = "/clientes"

export const appRoutes = {
  dashboard: { id: "dashboard", path: "/", browserTitle: "Dashboard" },
  "virtual-yard": {
    id: "virtual-yard",
    path: "/patio-virtual",
    browserTitle: "Pátio virtual",
  },
  reports: { id: "reports", path: "/relatorios", browserTitle: "Relatórios" },
  units: { id: "units", path: "/unidades", browserTitle: "Unidades" },
  clients: { id: "clients", path: clientsPath, browserTitle: "Clientes" },
  prices: { id: "prices", path: "/precos", browserTitle: "Preços" },
  rules: { id: "rules", path: "/regras", browserTitle: "Regras" },
  users: { id: "users", path: "/usuarios", browserTitle: "Usuários" },
  notifications: {
    id: "notifications",
    path: "/notificacoes",
    browserTitle: "Notificações",
  },
  profile: { id: "profile", path: "/perfil", browserTitle: "Meu perfil" },
  "account-security": {
    id: "account-security",
    path: "/seguranca-da-conta",
    browserTitle: "Segurança da conta",
  },
  permissions: {
    id: "permissions",
    path: "/permissoes",
    browserTitle: "Permissões",
  },
  audit: { id: "audit", path: "/auditoria", browserTitle: "Auditoria" },
  clientDetails: {
    id: "client-details",
    pattern: `${clientsPath}/:clientId`,
    path: (clientId: string) =>
      `${clientsPath}/${encodeURIComponent(clientId)}`,
    browserTitle: "Cliente",
  },
  preview: { id: "rmc-preview", path: "/rmc", browserTitle: "RMC" },
} as const

export const appPageRouteIds = [
  "dashboard",
  "virtual-yard",
  "reports",
  "units",
  "clients",
  "prices",
  "rules",
  "users",
  "notifications",
  "profile",
  "account-security",
  "permissions",
  "audit",
] as const
export type AppPageRouteId = (typeof appPageRouteIds)[number]
