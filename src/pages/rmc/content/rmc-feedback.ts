import type { FeedbackCatalog } from "@/app/feedback/feedback-contract"

export const RMC_FEEDBACK = {
  operationCompleted: {
    title: "Operação concluída",
    description: "A ação foi concluída com sucesso.",
    type: "success",
  },
  informationAvailable: {
    title: "Informação disponível",
    description: "Este é um feedback informativo de exemplo.",
    type: "info",
  },
  attentionRequired: {
    title: "Atenção necessária",
    description: "Este é um feedback de atenção de exemplo.",
    type: "warning",
  },
  operationFailed: {
    title: "Não foi possível concluir a ação",
    description: "Tente novamente.",
    type: "error",
  },
  urgentOperationFailed: {
    title: "Ação urgente não concluída",
    description: "Este feedback usa prioridade alta para validação manual.",
    priority: "high",
    type: "error",
  },
} as const satisfies FeedbackCatalog
