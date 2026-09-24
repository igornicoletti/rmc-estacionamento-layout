export const appCopy = {
  brand: {
    name: "Rede Monte Carlo",
  },
  feedback: {
    applicationFailure: {
      action: "Recarregar",
      description: "Recarregue a página para tentar novamente.",
      title: "Não foi possível iniciar a aplicação",
    },
    forbidden: {
      description: "Você não tem permissão para acessar este conteúdo.",
      title: "Acesso não permitido",
    },
    logoutFailure: {
      description: "Tente novamente.",
      title: "Não foi possível sair",
    },
    notFound: {
      description: "O conteúdo solicitado não existe ou não está disponível.",
      title: "Conteúdo não encontrado",
    },
    reservedPage: {
      description:
        "Este módulo está reservado para uma próxima etapa do projeto.",
      title: "Página em preparação",
    },
    sessionBootstrap: {
      label: "Inicializando aplicação",
    },
    sessionExpired: {
      action: "Entrar novamente",
      description:
        "Por segurança, sua sessão foi encerrada após um período sem atividade. Entre novamente para continuar.",
      pendingAction: "Entrando novamente",
      title: "Sessão encerrada por inatividade",
    },
    sessionTimeoutWarning: {
      continueAction: "Continuar conectado",
      continuingAction: "Mantendo sessão",
      description:
        "Sua sessão será encerrada em breve por inatividade. Continue para permanecer conectado.",
      remainingTime: "Tempo restante",
      title: "Sessão prestes a expirar",
    },
    sessionUnavailable: {
      action: "Tentar novamente",
      description: "Não foi possível confirmar sua sessão. Tente novamente.",
      pendingAction: "Tentando novamente",
      title: "Sessão indisponível",
    },
    unexpected: {
      action: "Tentar novamente",
      description: "Ocorreu um erro inesperado. Tente novamente.",
      title: "Não foi possível carregar esta página",
    },
  },
  sidebar: {
    collapse: "Recolher menu lateral",
    expand: "Expandir menu lateral",
    navigation: "Navegação principal",
  },
  pageActions: {
    back: "Voltar",
    history: "Histórico",
    synchronize: "Sincronizar",
  },
  toolbar: {
    closeSidebar: "Fechar menu lateral",
    notifications: {
      emptyDescription: "Você não tem notificações não lidas.",
      emptyTitle: "Sem novas notificações",
      loading: "Carregando notificações",
      markAllRead: "Marcar como lidas",
      title: "Notificações",
      trigger: "Abrir notificações",
      triggerLoading: "Abrir notificações. Carregando notificações.",
      triggerUnavailable:
        "Abrir notificações. Notificações indisponíveis.",
      unavailableDescription: "Não foi possível acessar as notificações.",
      unavailableTitle: "Notificações indisponíveis",
      viewAll: "Ver todas as notificações",
    },
    openSidebar: "Abrir menu lateral",
    userMenu: {
      appearance: "Aparência",
      profile: "Meu perfil",
      signOut: "Sair",
      signingOut: "Saindo",
      themeDark: "Escuro",
      themeLight: "Claro",
      themeSystem: "Sistema",
      trigger: "Abrir menu do usuário",
    },
  },
} as const

export function getNotificationsTriggerLabel(
  count: number,
  status: "loading" | "ready" | "unavailable",
) {
  const copy = appCopy.toolbar.notifications

  if (status === "loading") {
    return copy.triggerLoading
  }

  if (status === "unavailable") {
    return copy.triggerUnavailable
  }

  if (count === 0) {
    return copy.trigger
  }

  return count === 1
    ? `${copy.trigger}, 1 não lida`
    : `${copy.trigger}, ${count} não lidas`
}

export function getUserAvatarAlt(name: string) {
  return `Foto de perfil de ${name}`
}
