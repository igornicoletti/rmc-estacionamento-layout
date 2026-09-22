export const APP_BROWSER_TITLE = "Portal Estacionamento — Rede Monte Carlo"

// Public layout scaffolds; availability describes delivery status, not authorization.
export const appPages = {
  "dashboard": {
    path: "/",
    availability: "reserved",
    title: "Dashboard",
    subtitle: "Indicadores e estado operacional do estacionamento.",
  },
  "virtual-yard": {
    path: "/patio-virtual",
    availability: "reserved",
    title: "Pátio virtual",
    subtitle: "Ocupação, permanências e movimentações do pátio.",
  },
  "reports": {
    path: "/relatorios",
    availability: "reserved",
    title: "Relatórios",
    subtitle: "Análises e relatórios da operação do estacionamento.",
  },
  "units": {
    path: "/unidades",
    availability: "reserved",
    title: "Unidades",
    subtitle: "Consulta e gestão das unidades da operação.",
  },
  "clients": {
    path: "/clientes",
    availability: "reserved",
    title: "Clientes",
    subtitle: "Consulta e gestão dos clientes da operação.",
  },
  "prices": {
    path: "/precos",
    availability: "reserved",
    title: "Preços",
    subtitle: "Preços, faixas e critérios da operação.",
  },
  "rules": {
    path: "/regras",
    availability: "reserved",
    title: "Regras",
    subtitle: "Regras e critérios dos fluxos do estacionamento.",
  },
  "users": {
    path: "/usuarios",
    availability: "available",
    title: "Usuários",
    subtitle: "Gerencie usuários, status e vínculos de acesso.",
  },
  "notifications": {
    path: "/notificacoes",
    availability: "reserved",
    title: "Notificações",
    subtitle: "Alertas e atualizações relevantes da operação.",
  },
  "profile": {
    path: "/perfil",
    availability: "available",
    title: "Meu perfil",
    subtitle: "Consulte as informações do seu perfil.",
  },
  "account-security": {
    path: "/seguranca-da-conta",
    availability: "reserved",
    title: "Segurança da conta",
    subtitle: "Opções de segurança e proteção da conta.",
  },
  "permissions": {
    path: "/permissoes",
    availability: "available",
    title: "Permissões",
    subtitle: "Consulte permissões e abrangências de acesso por perfil.",
  },
  "audit": {
    path: "/auditoria",
    availability: "reserved",
    title: "Auditoria",
    subtitle: "Consulte eventos administrativos e de segurança.",
  },
} as const satisfies Record<string, {
  path: `/${string}`
  availability: "available" | "reserved"
  title: string
  subtitle: string
}>

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
