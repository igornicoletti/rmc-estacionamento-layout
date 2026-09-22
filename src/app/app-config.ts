import type { RouteAccessPolicy } from "@/app/routing/route-access"

export const APP_BROWSER_TITLE = "Portal Estacionamento — Rede Monte Carlo"

const publicLayoutAccess = {
  authentication: "either",
} satisfies RouteAccessPolicy

// Layout scaffolds remain public until a real authentication adapter is wired.
export const appPages = {
  dashboard: {
    access: publicLayoutAccess,
    path: "/",
    availability: "reserved",
    title: "Dashboard",
    subtitle: "Indicadores e estado operacional do estacionamento.",
  },
  "virtual-yard": {
    access: publicLayoutAccess,
    path: "/patio-virtual",
    availability: "reserved",
    title: "Pátio virtual",
    subtitle: "Ocupação, permanências e movimentações do pátio.",
  },
  reports: {
    access: publicLayoutAccess,
    path: "/relatorios",
    availability: "reserved",
    title: "Relatórios",
    subtitle: "Análises e relatórios da operação do estacionamento.",
  },
  units: {
    access: publicLayoutAccess,
    path: "/unidades",
    availability: "reserved",
    title: "Unidades",
    subtitle: "Consulta e gestão das unidades da operação.",
  },
  clients: {
    access: publicLayoutAccess,
    path: "/clientes",
    availability: "reserved",
    title: "Clientes",
    subtitle: "Consulta e gestão dos clientes da operação.",
  },
  prices: {
    access: publicLayoutAccess,
    path: "/precos",
    availability: "reserved",
    title: "Preços",
    subtitle: "Preços, faixas e critérios da operação.",
  },
  rules: {
    access: publicLayoutAccess,
    path: "/regras",
    availability: "reserved",
    title: "Regras",
    subtitle: "Regras e critérios dos fluxos do estacionamento.",
  },
  users: {
    access: publicLayoutAccess,
    path: "/usuarios",
    availability: "available",
    title: "Usuários",
    subtitle: "Gerencie usuários, status e vínculos de acesso.",
  },
  notifications: {
    access: publicLayoutAccess,
    path: "/notificacoes",
    availability: "reserved",
    title: "Notificações",
    subtitle: "Alertas e atualizações relevantes da operação.",
  },
  profile: {
    access: publicLayoutAccess,
    path: "/perfil",
    availability: "available",
    title: "Meu perfil",
    subtitle: "Consulte as informações do seu perfil.",
  },
  "account-security": {
    access: publicLayoutAccess,
    path: "/seguranca-da-conta",
    availability: "reserved",
    title: "Segurança da conta",
    subtitle: "Opções de segurança e proteção da conta.",
  },
  permissions: {
    access: publicLayoutAccess,
    path: "/permissoes",
    availability: "available",
    title: "Permissões",
    subtitle: "Consulte permissões e abrangências de acesso por perfil.",
  },
  audit: {
    access: publicLayoutAccess,
    path: "/auditoria",
    availability: "reserved",
    title: "Auditoria",
    subtitle: "Consulte eventos administrativos e de segurança.",
  },
} as const satisfies Record<
  string,
  {
    access: RouteAccessPolicy
    path: `/${string}`
    availability: "available" | "reserved"
    title: string
    subtitle: string
  }
>

export type AppPageId = keyof typeof appPages

export const appFeedback = {
  forbidden: {
    title: "Acesso não permitido",
    description: "Você não tem permissão para acessar este conteúdo.",
  },
  "not-found": {
    title: "Conteúdo não encontrado",
    description: "O conteúdo solicitado não existe ou não está disponível.",
  },
  unexpected: {
    title: "Não foi possível carregar esta página",
    description: "Ocorreu um erro inesperado. Tente novamente.",
  },
} as const
