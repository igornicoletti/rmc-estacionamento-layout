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
} as const
