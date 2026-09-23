export const pageSyncHistoryCopy = {
  title: "Histórico de sincronização",
  description: (scopeLabel: string) =>
    `Execuções recentes de sincronização de ${scopeLabel.toLocaleLowerCase("pt-BR")}.`,
  empty: {
    title: "Nenhuma sincronização registrada",
    description:
      "As execuções concluídas aparecerão aqui quando estiverem disponíveis.",
  },
  status: {
    success: "Sucesso",
    partial: "Parcial",
    error: "Erro",
  },
  trigger: {
    automatic: "Automática",
    manual: "Manual",
  },
  fields: {
    startedAt: "Início",
    finishedAt: "Término",
    duration: "Duração",
    trigger: "Tipo",
    requestedBy: "Responsável",
    processedCount: "Processados",
    succeededCount: "Concluídos",
    failedCount: "Falhas",
    executionId: "Identificador",
    message: "Mensagem",
  },
  actions: {
    showDetails: "Exibir detalhes da sincronização",
  },
} as const
