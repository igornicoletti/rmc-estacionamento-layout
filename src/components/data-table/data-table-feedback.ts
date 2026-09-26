import type { FeedbackCatalog } from "@/app/feedback/feedback-contract"

export const DATA_TABLE_FEEDBACK = {
  rowCopied: {
    title: "Dados copiados",
    description: "Os dados do registro foram copiados.",
    type: "success",
  },
  rowCopyFailed: {
    title: "Falha ao copiar",
    description: "Não foi possível copiar os dados do registro.",
    type: "error",
  },
} as const satisfies FeedbackCatalog
